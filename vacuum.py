#!/usr/bin/env python
from __future__ import print_function
import sys
import time
from pred.config import parse_config, CONFIG_FILENAME
from webserver import create_db_connection

DELETE_AFTER_DAYS = "2";
BASE_SQL = "delete from custom_list where extract('days' from (current_timestamp - uploaded)) >= {}"
DELETE_OLD_LISTS_SQL = BASE_SQL.format(DELETE_AFTER_DAYS)


def connect_and_delete_old_lists():
    print("Deleting old custom lists.")
    config = parse_config(CONFIG_FILENAME)
    db = create_db_connection(config.dbconfig)
    cur = db.cursor()
    cur.execute(DELETE_OLD_LISTS_SQL, [])
    cur.close()
    db.commit()
    db.close()


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


