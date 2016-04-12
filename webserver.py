#!/usr/bin/env python
from __future__ import print_function

import psycopg2
import psycopg2.extras
from flask import Flask, request, render_template, jsonify, g, make_response, Response

from pred.config import parse_config, CONFIG_FILENAME
from pred.dbdatasource import DataSources
from pred.predictionsearch import get_predictions_with_guess, get_all_values


app = Flask(__name__)
g_config = parse_config(CONFIG_FILENAME)
g_dbconfig = g_config.dbconfig


def log_info(message):
    print(message)


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        log_info("Creating database connection.")
        db = g._database = create_db_connection(g_dbconfig)
    return db


def create_db_connection(config):
    return psycopg2.connect('host=' + config.host +
                            ' dbname=' + config.dbname +
                            ' user=' + config.user +
                            ' password=' + config.password)


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        log_info("Cleanup database connection.")
        db.close()


@app.route('/', methods=['GET'])
@app.route('/datasources', methods=['GET'])
@app.route('/models', methods=['GET'])
@app.route('/about', methods=['GET'])
def root():
    return render_template('index.html')


@app.route('/api/v1/datasources', methods=['GET'])
def get_api_datasources():
    log_info("Reading data sources.")
    data_sources = DataSources(get_db()).get_items()
    blob = jsonify({'results': data_sources})
    r = make_response(blob)
    log_info("Returning data sources.")
    return r


@app.route('/api/v1/settings', methods=['GET'])
def get_genome_versions():
    log_info("Reading settings")
    blob = jsonify({
        'genomes': g_config.get_genomes_setup(),
        'max_binding_offset': g_config.binding_max_offset,
    })
    r = make_response(blob)
    log_info("Returning settings")
    return r


@app.route('/api/v1/genomes/<genome>/prediction', methods=['POST','GET'])
def prediction_search(genome):
    log_info("Finding predictions.")
    predictions, args = get_predictions_with_guess(get_db(), g_config, genome, request.args)
    response_format = args.get_format()
    if response_format == 'json':
        r = make_json_response('predictions', predictions)
    elif response_format == 'tsv' or response_format == 'csv':
        filename = 'prediction_{}_{}.{}'.format(args.get_upstream(), args.get_downstream(), response_format)
        content_disposition = 'attachment; filename="{}"'.format(filename)
        headers = {'Content-Disposition': content_disposition}
        gen = make_predictions_csv_response(predictions, args)
        r = Response(gen, mimetype='application/octet-stream', headers=headers)

    else:
        raise ValueError("Unexpected format:{}".format(response_format))
    log_info("Returning predictions.")
    return r


def make_json_response(name, obj):
    blob = jsonify({
        name: obj,
    })
    return make_response(blob)


def make_predictions_csv_response(predictions, args):
    up = args.get_upstream()
    down = args.get_downstream()
    size = up + down + 1
    separator = ','
    if args.get_format() == 'tsv':
        separator = '\t'
    headers = ['Name', 'ID', 'Max', 'Location', 'Start', 'End']
    if args.get_include_all():
        headers.extend([str(i) for i in range(-1*up, down+1)])
    yield separator.join(headers) + '\n'
    for prediction in predictions:
        items = [
            prediction['common_name'],
            prediction['name'],
            str(prediction['max']),
            prediction['chrom'],
            str(prediction['start']),
            str(prediction['end'])]
        if args.get_include_all():
            items.extend(get_all_values(prediction, size))
        yield separator.join(items) + '\n'


if __name__ == '__main__':
    app.debug = True
    app.run()
