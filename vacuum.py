#!/usr/bin/env python
from __future__ import print_function
import sys
import time
from pred.config import parse_config, CONFIG_FILENAME
from webserver import create_db_connection
from pred.webserver.customjob import CustomJob
from pred.webserver.sequencelist import SequenceList

DELETE_AFTER_HOURS = "48"
BASE_SQL = "delete from custom_list where current_timestamp - uploaded > interval '{} hours'"
DELETE_OLD_LISTS_SQL = BASE_SQL.format(DELETE_AFTER_HOURS)


def connect_and_delete_old_lists():
    config = parse_config(CONFIG_FILENAME)
    db = create_db_connection(config.dbconfig)
    cur = db.cursor()
    delete_old_items(cur)
    cur.close()
    db.commit()
    db.close()


def delete_old_items(cur):
    print("Deleting old custom lists.")
    cur.execute(DELETE_OLD_LISTS_SQL, [])
    print("Deleting old jobs.")
    CustomJob.delete_old_jobs(cur, DELETE_AFTER_HOURS)
    print("Deleting old custom sequences.")
    SequenceList.delete_old_and_unattached(cur, DELETE_AFTER_HOURS)


def delete_and_wait(wait_minutes):
    while True:
        print("Waiting {} minutes.".format(wait_minutes))
        time.sleep(wait_minutes * 60)
        connect_and_delete_old_lists()


if __name__ == '__main__':
    args = sys.argv[1:]
    if args:
        delete_and_wait(int(args[0]))
    else:
        connect_and_delete_old_lists()


