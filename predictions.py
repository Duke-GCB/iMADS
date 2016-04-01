#!/usr/bin/env python
from __future__ import print_function
import psycopg2
import psycopg2.extras
from flask import Flask, request, render_template, jsonify, g, make_response, redirect, Response
from config import parse_config, CONFIG_FILENAME
from predictionsearch import PredictionSearch
from datasource import DataSources

app = Flask(__name__)
g_config = parse_config(CONFIG_FILENAME)
g_dbconfig = g_config.dbconfig


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        print("Creating database connection.")
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
        print("Cleanup database connection.")
        db.close()


@app.route('/', methods=['GET'])
@app.route('/datasources', methods=['GET'])
@app.route('/about', methods=['GET'])
def root():
    return render_template('index.html')


@app.route('/api/v1/datasources', methods=['GET'])
def get_api_datasources():
    data_sources = DataSources(get_db()).get_items()
    blob = jsonify({'results': data_sources})
    r = make_response(blob)
    r.headers['Access-Control-Allow-Origin'] = '*'
    print("Returning stuff.")
    return r


@app.route('/api/v1/genomes', methods=['GET'])
def get_genome_versions():
    result = {}
    for genome_data in g_config.genome_data_list:
        genome = genome_data.genomename
        model_names = [model.name for model in genome_data.prediction_lists]
        gene_list_names = [gene_list.source_table for gene_list in genome_data.gene_lists]
        result[genome] = {
            'models': model_names,
            'gene_lists': gene_list_names,
        }
    blob = jsonify({'genomes': result})
    r = make_response(blob)
    r.headers['Access-Control-Allow-Origin'] = '*'
    return r


def get_predictions_with_guess(genome, args):
    search = PredictionSearch(get_db(), genome, g_config.binding_max_offset, args, enable_guess=True)
    predictions = search.get_predictions()
    if search.has_max_prediction_guess():  # repeat without guess if we didn't get enough values
        per_page = search.get_per_page()
        if per_page:
            if len(predictions) < per_page:
                search.enable_guess = False
                predictions = search.get_predictions()
    return predictions, search.args


@app.route('/api/v1/genomes/<genome>/prediction', methods=['POST','GET'])
def prediction_search(genome):
    print("finding predictions.")
    predictions, args = get_predictions_with_guess(genome, request.args)
    response_format = args.get_format()
    if response_format == 'json':
        r = make_json_response('predictions', predictions)
    elif response_format == 'tsv' or response_format == 'csv':
        gen = make_predictions_csv_response(predictions, args)
        r = Response(gen, mimetype='text/' + response_format)
    else:
        raise ValueError("Unexpected format:{}".format(response_format))

    return r


def make_json_response(name, obj):
    blob = jsonify({
        name: obj,
    })
    return make_response(blob)


def make_predictions_csv_response(predictions, args):
    size = args.get_upstream() + args.get_downstream() + 1
    separator = ','
    if args.get_format() == 'tsv':
        separator = '\t'
    headers = ['Name', 'ID', 'Max', 'Location', 'Start', 'End']
    if args.get_include_all():
        headers.extend([str(i) for i in range(1, size + 1)])
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
            items.extend(get_all_values(prediction, size, args))
        yield separator.join(items) + '\n'


def get_all_values(prediction, size, args):
    values = [0] * size
    offset = int(prediction['start'])
    for data in prediction['values']:
        start = int(data['start'])
        value = data['value']
        idx = start - offset
        values[idx] = value
    return [str(val) for val in values]

if __name__ == '__main__':
    app.debug = True
    app.run()
