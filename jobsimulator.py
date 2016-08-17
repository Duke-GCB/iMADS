"""
Command line utility to test out jobs portion of the API.
"""

from __future__ import print_function
import sys
import requests
import base64
from Bio import SeqIO
from StringIO import StringIO
import random
from multiprocessing import Pool
import time

BASE_URL = "http://localhost:5000/api/v1"


def make_url(part):
    return "{}/{}".format(BASE_URL, part)


def get_new_jobs():
    r = requests.get(make_url("jobs?job_status=NEW"))
    return r.json()['result']


def claim_job(job):
    url = make_url("jobs/{}".format(job['id']))
    data = {'job_status':'RUNNING'}
    r = requests.put(url, json=data)
    r.raise_for_status()


def mark_job_complete(job):
    url = make_url("jobs/{}".format(job['id']))
    data = {'job_status':'COMPLETE'}
    r = requests.put(url, json=data)
    r.raise_for_status()


def mark_job_error(job, message):
    url = make_url("jobs/{}".format(job['id']))
    data = {'job_status':'ERROR', 'error_message': message}
    r = requests.put(url, json=data)
    r.raise_for_status()


def get_sequence(job):
    url = make_url("sequences/{}".format(job['sequence_list']))
    r = requests.get(url)
    r.raise_for_status()
    data = r.json()['data']
    return base64.b64decode(data)


def save_custom_predictions(job, bed_file_data):
    url = make_url("custom_predictions")
    r = requests.post(url, json={
        'job_id': job['id'],
        'model_name': job['model_name'],
        'bed_data': bed_file_data,
    })
    r.raise_for_status()


def make_predictions(job):
    fasta_data = get_sequence(job)
    bed_data = []
    for rec in SeqIO.parse(StringIO(fasta_data), 'fasta'):
        predictions = make_predictions_for_seq(rec.id, str(rec.seq))
        bed_data.extend(predictions)
    result = "\n".join(bed_data)
    return result


def make_predictions_for_seq(name, seq):
    pred_width = 5
    bed_data = []
    preds = random.randint(1, 5)
    width = len(seq)
    for i in range(preds):

        start = random.randint(0, max(width - pred_width,1))
        end = start + pred_width
        value = random.random()
        if value < 0.2:
            value = 0.2
        bed_data.append("{}\t{}\t{}\t{}".format(name, start, end, value))
    return bed_data


def list_jobs():
    print("NEW JOBS")
    for job in get_new_jobs():
        print('id:', job['id'])
        print('     model:', job['model_name'], ' type:', job['type'], 'sequence:', job['sequence_list'])
    print()


def claim_next_job():
    jobs = get_new_jobs()
    if not jobs:
        print("No jobs available to claim.")
    else:
        job = jobs[0]
        claim_job(job)
        try:
            bed_file_data = make_predictions(job)
            save_custom_predictions(job, bed_file_data)
            mark_job_complete(job)
        except Exception as ex:
            mark_job_error(job, str(ex))


def claim_many():
    pool = Pool()
    while True:
        pool.apply_async(claim_next_job)
        time.sleep(0.5)


def error_next_job():
    jobs = get_new_jobs()
    if not jobs:
        print("No jobs available to claim.")
    else:
        job = jobs[0]
    mark_job_error(job, "Processing failed with error DAN-8.")

def create_job():
    # upload sequence
    url = make_url("sequences")
    data = {'data': base64.b64encode('>myseq\nAACCGGTT'), 'title':'MySeq'}
    r = requests.post(url, json=data)
    r.raise_for_status()
    sequence_id = r.json()['id']

    # make new job
    url = make_url("jobs")
    data = {
        'job_type': 'PREDICTION',
        'sequence_id': sequence_id,
        'model_name': 'E2f1'
    }
    r = requests.post(url, json=data)
    r.raise_for_status()
    print("Job ID:", r.json()['id'])



COMMANDS = {
    "list": list_jobs,
    "claim": claim_next_job,
    "error": error_next_job,
    "loop": claim_many,
    "makejob": create_job
}


def usage():
    print("python {} {}".format(sys.argv[0], '|'.join(COMMANDS.keys())))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        usage()
    else:
        func = COMMANDS.get(sys.argv[1])
        if func:
            func()
        else:
            usage()

