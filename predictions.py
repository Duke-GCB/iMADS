#!/usr/bin/env python
from __future__ import print_function
import os
import argparse
from sqlalchemy import Column, String, BigInteger, Numeric
from bx.wiggle import IntervalReader
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from flask import Flask, request, render_template
from flask import Response
app = Flask(__name__)

Base = declarative_base()


class Prediction(Base):
    __tablename__ = 'prediction'
    chrom = Column(String(), nullable=False, primary_key=True)
    start_range = Column(BigInteger(), nullable=False, primary_key=True)
    end_range = Column(BigInteger(), nullable=False)
    value = Column(Numeric(), nullable=False)

database_str = os.environ.get('PRED_DB', None)
if not database_str:
    database_str = 'sqlite:///pred.db'
    print("WARNING: PRED_DB environment variable not defined defaulting to sqlite pred.db.")
engine = create_engine(database_str)
# Bind the engine to the metadata of the Base class so that the
# declaratives can be accessed through a DBSession instance
Base.metadata.bind = engine
DBSession = sessionmaker(bind=engine)


def insert_records_into_db(input_file):
    cnt = 0
    with open(input_file, 'r') as infile:
        session = DBSession()
        reader = IntervalReader(infile)
        for chr_data in reader:
            (chrom, start, end, strand, value) = chr_data
            prediction = Prediction(chrom=chrom, start_range=start, end_range=end, value=value)
            session.add(prediction)
            cnt += 1
            if cnt % 10000 == 0:
                print("Cnt:" + str(cnt))
                session.commit()
        print('Committing final')
        session.commit()


def read_records(session, chroms, start, end, vstart, vend):
    chrom_ary = [x for x in chroms.split(" ") if x]
    query = session.query(Prediction)
    if chroms != 'all':
        query = query.filter(Prediction.chrom.in_(chrom_ary))
    if start:
        query = query.filter(Prediction.start_range > start)
    if end:
        query = query.filter(Prediction.end_range <= end)
    if vstart:
        query = query.filter(Prediction.value > vstart)
    if vend:
        query = query.filter(Prediction.value <= vend)
    return query.order_by(Prediction.chrom, Prediction.start_range).all()


def check_chroms(chroms):
    if not chroms:
        return 'You must enter a value from chromosomes.'
    return ''


def check_range(start, end):
    if start and not start.isnumeric():
        return 'From must be numeric.'
    if end and not end.isnumeric():
        return 'Through must be numeric.'
    return ''


@app.route('/', methods=['GET', 'POST'])
def search():
    if request.method == 'POST':
        chroms = request.form['chroms']
        start = request.form['start']
        end = request.form['end']
        vstart = request.form['vstart']
        vend = request.form['vend']
        csv = request.form.get('csv',None)

        chroms_error = check_chroms(chroms)
        range_error = check_range(start, end)
        vrange_error = ''#check_range(vstart, vend)
        results = []
        if not chroms_error and not range_error and not vrange_error:
            session = DBSession()
            results = read_records(session, chroms, start, end, vstart, vend)
            session.close()
            if csv:
                return render_csv(results)
        return render_template('search.html', chroms=chroms, start=start, end=end,
                               range_error=range_error, chroms_error=chroms_error,
                               vstart=vstart, vend=vend,
                               vrange_error=vrange_error,
                               results=results)
    else:
        return render_template('search.html')


def render_csv(results):
    def generate():
        yield 'Chromosome,Value,Start,End\n'
        for row in results:
            list = [row.chrom, str(row.value), str(row.start_range), str(row.end_range)]
            yield ','.join(list) + '\n'
    return Response(generate(), mimetype='text/csv')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Predictions database. Uses PRED_DB for database connection str.')
    parser.add_argument('--wigfile', help='Add wig file to database.')
    parser.add_argument('--web', help='Run web server to view wig data.', action="store_true")
    args = parser.parse_args()
    if not args.wigfile and not args.web:
        parser.print_help()
    else:
        if args.wigfile:
            insert_records_into_db(args.wigfile)
        if args.web:
            app.debug = True
            app.run()