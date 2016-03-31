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
        db = g._database = psycopg2.connect('host=' + g_dbconfig.host +
                                            ' dbname=' + g_dbconfig.dbname +
                                            ' user=' + g_dbconfig.user +
                                            ' password=' + g_dbconfig.password)
    return db


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


@app.route('/api/datasources', methods=['GET'])
def get_api_datasources():
    data_sources = DataSources(get_db()).get_items()
    blob = jsonify({'results': data_sources})
    r = make_response(blob)
    r.headers['Access-Control-Allow-Origin'] = '*'
    print("Returning stuff.")
    return r

@app.route('/genomes', methods=['GET'])
def get_genome_versions():
    print("Got here.")
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
    print("Returning stuff.")
    return r


@app.route('/genomes/<genome>/prediction2', methods=['POST','GET'])
def prediction2_search(genome):
    search = PredictionSearch(get_db(), request.args)


def get_predictions_with_guess(genome, args):
    search = PredictionSearch(get_db(), genome, g_config.binding_max_offset, args, enable_guess=True)
    predictions = search.get_predictions()
    if search.has_max_prediction_guess():  # repeat without guess if we didn't get enough values
        per_page = search.get_per_page()
        if per_page:
            if len(predictions) < per_page:
                search.enable_guess = False
                predictions = search.get_predictions()
    return predictions


@app.route('/genomes/<genome>/prediction', methods=['POST','GET'])
def prediction_search(genome):
    print("finding predictions.")
    predictions = get_predictions_with_guess(genome, request.args)
    blob = jsonify({
        'predictions': predictions,
    })
    r = make_response(blob)
    r.headers['Access-Control-Allow-Origin'] = '*'
    return r

if __name__ == '__main__':
    app.debug = True
    app.run()
