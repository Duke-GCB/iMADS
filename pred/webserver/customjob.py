"""
Allows manipulation of custom jobs.
Jobs include creating predictions or preferences for a custom sequence.
"""

import uuid
import datetime
from pred.queries.dbutil import update_database, read_database
from pred.webserver.customresult import CustomResultData


class JobStatus(object):
    """
    States a job can be in.
    """
    NEW = 'NEW'
    RUNNING = 'RUNNING'
    COMPLETE = 'COMPLETE'
    ERROR = 'ERROR'


class CustomJob(object):
    """
    CRUD for managing job request in the database.
    The job will perform some operation in the background for a user and update status when done
    """

    NON_KEY_FIELDS = 'type, seq_id, model_name, status, created, finished, error_msg'
    def __init__(self, job_uuid):
        """
        Setup job with specified uuid.
        :param job_uuid: str: uuid key of this job
        """
        if not job_uuid:
            raise ValueError("CustomJob uuid must have a value yours:'{}'.".format(job_uuid))
        self.uuid = job_uuid
        self.status = JobStatus.NEW
        self.type = None
        self.model_name = None
        self.sequence_list = None
        self.created = None
        self.error_msg = None
        self.finished = None

    def insert(self, db):
        if not self.type or not self.sequence_list or not self.status or not self.model_name:
            raise ValueError("Type, sequence_list, model_name, and status properties "
                             "must be filled in before calling insert.")
        insert_sql = "insert into job(id, type, model_name, seq_id, status) values(%s, %s, %s, %s, %s)"
        update_database(db, insert_sql, [self.uuid, self.type, self.model_name, self.sequence_list, self.status])

    def delete(self, cur):
        cur.execute("delete from job where id = %s", [self.uuid])

    def load(self, db):
        select_sql = "select {} from job where id = %s".format(self.NON_KEY_FIELDS)
        rows = read_database(db, select_sql, [self.uuid])
        self._load_non_key(rows[0])

    def _load_non_key(self, row):
        self.type, self.sequence_list, self.model_name, self.status, self.created, self.finished, self.error_msg = row

    def get_dict(self):
        """
        Get properties as a dictionary.
        :return:
        """
        return {
            'id': self.uuid,
            'status': self.status,
            'type': self.type,
            'sequence_list': self.sequence_list,
            'created': self.created,
            'finished': self.finished,
            'error_msg': self.error_msg,
            'model_name': self.model_name,
            'current_time': datetime.datetime.utcnow(),
        }

    @staticmethod
    def create_job(db, job_type, sequence_list, model_name):
        """
        Create and return a job with the specified properties.
        :param db: DatabaseConnection: database we will create the job in
        :param job_type: str: type of job to perform
        :param sequence_list: str: uuid of the custom sequence to use in this job
        :param model_name: str: name of the model to generate data with
        :return: CustomJob: job that has been persisted to database in NEW state.
        """
        custom_job = CustomJob(str(uuid.uuid1()))
        custom_job.type = job_type
        custom_job.sequence_list = sequence_list
        custom_job.model_name = model_name
        custom_job.insert(db)
        return custom_job

    @staticmethod
    def read_job(db, job_uuid):
        """
        Load job based on uuid.
        :param db: DatabaseConnection: database we will read the job details from
        :param job_uuid: str: uuid of this job
        :return: CustomJob with properties loaded from database
        """
        custom_job = CustomJob(job_uuid)
        custom_job.load(db)
        return custom_job

    @staticmethod
    def set_job_running(db, job_uuid):
        """
        Set job to RUNNING state.
        Requires job to be at NEW status.
        :param db: DatabaseConnection: database to update
        :param job_uuid: str: uuid of this job
        """
        update_sql = "update job set status = %s where id = %s and status = %s"
        rowcount = update_database(db, update_sql, [JobStatus.RUNNING, job_uuid, JobStatus.NEW])
        if rowcount == 0:
            raise ValueError("No job found for {} at status {}".format(job_uuid, JobStatus.NEW))

    @staticmethod
    def set_job_complete(db, job_uuid):
        """
        Set job to COMPLETE state.
        Requires job to be at RUNNING status.
        Updates the finished date/time.
        :param db: DatabaseConnection: database to update
        :param job_uuid: str: uuid of this job
        """
        update_sql = "update job set status = %s, finished = CURRENT_TIMESTAMP where id = %s and status = %s"
        rowcount = update_database(db, update_sql, [JobStatus.COMPLETE, job_uuid, JobStatus.RUNNING])
        if rowcount == 0:
            raise ValueError("No job found for {} at status {}".format(job_uuid, JobStatus.RUNNING))

    @staticmethod
    def set_job_as_error(db, job_uuid, error_message):
        """
        Set job to ERROR state.
        Updates the finished date/time.
        :param db: DatabaseConnection: database to update
        :param job_uuid: str: uuid of this job
        :param error_message: str: error associated with the failure
        """
        if not error_message:
            raise ValueError("Missing required error_message.")
        update_sql = "update job set status = %s, error_msg = %s, finished = CURRENT_TIMESTAMP where id = %s"
        rowcount = update_database(db, update_sql, [JobStatus.ERROR, error_message, job_uuid])
        if rowcount == 0:
            raise ValueError("No job found for {}.".format(job_uuid))

    @staticmethod
    def find_jobs(db, job_status):
        """
        Find jobs with optional job_status filter.
        :param db: DatabaseConnection: database to read
        :param job_status: str: JobStatus property to filter by
        :return: [CustomJob] jobs found
        """
        result = []
        select_sql = "select id, {} from job".format(CustomJob.NON_KEY_FIELDS)
        params = []
        if job_status:
            select_sql += " WHERE status = %s"
            params.append(job_status)
        select_sql += " order by created "
        for row in read_database(db, select_sql, params):
            job = CustomJob(row[0])
            job._load_non_key(row[1:])
            result.append(job)
        return result

    @staticmethod
    def find_existing_job(db, job_type, sequence_list, model_name):
        """
        Find a single job for the specified properties.
        :param db: DatabaseConnection: database to read
        :param job_type: str: type of job we are looking for
        :param sequence_list: str: uuid of sequence
        :param model_name: str: name of the model
        :return: CustomJob or None if not found
        """
        select_sql = "select id, {} from job " \
                     " WHERE seq_id = %s and type = %s and model_name = %s".format(CustomJob.NON_KEY_FIELDS)
        params = [sequence_list, job_type, model_name]
        for row in read_database(db, select_sql, params):
            job = CustomJob(row[0])
            job._load_non_key(row[1:])
            return job
        return None

    @staticmethod
    def find_old_jobs(cur, hours):
        result = []
        select_sql = "select id, {} from job " \
                     "where CURRENT_TIMESTAMP  - finished > interval '{} hours'".format(CustomJob.NON_KEY_FIELDS, hours)
        cur.execute(select_sql, [])
        for row in cur.fetchall():
            job = CustomJob(row[0])
            job._load_non_key(row[1:])
            result.append(job)
        return result

    @staticmethod
    def delete_old_jobs(cur, hours):
        for old_job in CustomJob.find_old_jobs(cur, hours):
            CustomResultData.delete_for_job(cur, old_job.uuid)
            old_job.delete(cur)
        return None
