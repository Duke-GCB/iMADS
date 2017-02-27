#!/usr/bin/env python
from __future__ import print_function

import os
import sys
import logging
import base64
import psycopg2
import psycopg2.extras
from flask import Flask, request, render_template, jsonify, g, make_response, Response

from pred.config import parse_config, CONFIG_FILENAME
from pred.webserver.dbdatasource import DataSources
from pred.webserver.predictionsearch import get_predictions_with_guess, get_all_values
from pred.webserver.customlist import save_custom_file
from pred.webserver.dnasequence import lookup_dna_sequence
from pred.webserver.sequencelist import SequenceList
from pred.webserver.customjob import CustomJob, JobStatus
from pred.webserver.customresult import CustomResultData
from pred.webserver.errors import ClientException, ServerException, ErrorType

logging.basicConfig(stream=sys.stderr)
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
    try:
        return psycopg2.connect('host=' + config.host +
                                ' dbname=' + config.dbname +
                                ' user=' + config.user +
                                ' password=' + config.password)
    except Exception as ex:
        raise ValueError("Unable to connect to the database:{}.".format(ex))


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
@app.route('/shared_link', methods=['GET'])
@app.route('/prediction', methods=['GET'])
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
        'maxBindingOffset': g_config.binding_max_offset,
    })
    r = make_response(blob)
    log_info("Returning settings")
    return r


@app.route('/api/v1/custom_list', methods=['POST'])
def create_custom_file():
    user_info = "Addr:{} Browser:{} Platform:{} Agent:{}".format(
        request.remote_addr,
        request.user_agent.browser,
        request.user_agent.platform,
        request.user_agent.string)
    json_data = request.get_json()
    key = save_custom_file(get_db(), user_info, json_data.get('type'), json_data.get('content'))
    return make_json_response({'key': key})

@app.route('/api/v1/genomes/<genome>/prediction', methods=['POST','GET'])
def prediction_search(genome):
    log_info("Finding predictions.")
    predictions, args, warning = get_predictions_with_guess(get_db(), g_config, genome, request.args)
    response_format = args.get_format()
    if response_format == 'json':
        r = make_json_response({
            'predictions': predictions,
            'page': args.page,
            'warning': warning,
        })
    elif response_format == 'tsv' or response_format == 'csv':
        filename = make_download_filename(genome, args, response_format)
        content_disposition = 'attachment; filename="{}"'.format(filename)
        headers = {'Content-Disposition': content_disposition}
        gen = make_predictions_csv_response(predictions, args)
        r = Response(gen, mimetype='application/octet-stream', headers=headers)
    else:
        raise ValueError("Unexpected format:{}".format(response_format))
    log_info("Returning predictions.")
    return r


def make_download_filename(genome, args, response_format):
    """
    Make filename that will explain to the user what the predictions are for
    :param genome: str: which version of the genome we are pulling data from
    :param args: SearchArgs: argument used for search
    :param response_format: str file extension/format
    :return: str filename that will be returned to the user
    """
    prefix = 'predictions_{}_{}_{}'.format(genome, args.get_model_name(), args.get_gene_list())
    middle = ''
    if not args.is_custom_ranges_list():
        middle = '_{}_{}'.format(args.get_upstream(), args.get_downstream())
    filename = '{}{}.{}'.format(prefix, middle, response_format)
    return filename.replace(' ', '_')


@app.route('/api/v1/genomes/<genome>/sequences', methods=['GET','POST'])
def get_sequences(genome):
    json_data = request.get_json()
    ranges = json_data['ranges']
    try:
        sequences = lookup_dna_sequence(g_config, genome, ranges)
        return make_json_response({'sequences': sequences})
    except IOError as err:
        raise ValueError("Missing file for {}:{}.".format(genome, err))


@app.route('/api/v1/sequences/<sequence_id>', methods=['GET'])
def get_custom_sequences_data(sequence_id):
    """
    Get base64 encoded contents and other properties of a custom sequence(DNA).
    :param sequence_id: str: uuid associated with a particular sequence
    :return: json response
    """
    seq = SequenceList(sequence_id)
    seq.load(get_db())
    return make_json_response({
            "id": seq.seq_uuid,
            "data": base64.b64encode(seq.content),
            "created": seq.created
        })


@app.route('/api/v1/sequences', methods=['POST'])
def post_custom_sequences():
    (data, title) = get_required_json_props(request, ["data", "title"])
    decoded_data = base64.b64decode(data)
    seq_uuid = SequenceList.create_with_content_and_title(get_db(), decoded_data, title)
    return make_ok_json_response({'id': seq_uuid})


@app.route('/api/v1/jobs', methods=['POST'])
def post_jobs():
    """
    Create a job to create preferences/predictions for a custom sequence using the specified model(model_name).
    request['sequence_id'] str: uuid of the custom sequence to process
    request['job_type'] str: see config.DataType properties for values
    request['model_name'] str: name of the model to use
    :return: json response with id of the job
    """
    required_prop_names = ["sequence_id", "job_type", "model_name"]
    (sequence_id, job_type, model_name) = get_required_json_props(request, required_prop_names)
    try:
        seq = SequenceList(sequence_id)
        seq.load(get_db())
    except KeyError as ex:
        raise ClientException("Unable to find sequence. It may have purged.",
                            ErrorType.SEQUENCE_NOT_FOUND,
                            error_data=sequence_id)
    job = CustomJob.find_existing_job(get_db(), job_type, sequence_id, model_name)
    status_code = None
    if not job:
        status_code = None
        job = CustomJob.create_job(get_db(), job_type, sequence_id, model_name)
    return make_ok_json_response({'id': job.uuid}, status_code)


@app.route('/api/v1/jobs', methods=['GET'])
def get_jobs():
    """
    Return a list of jobs with optional job_status filter.
    request['job_status'] str: see customjob.JobStatus properties for values
    :return: json response with 'result' array of jobs.
    """
    job_status = request.args.get("job_status")
    result = []
    for job in CustomJob.find_jobs(get_db(), job_status):
        result.append(job.get_dict())
    return make_json_response({'result': result})


@app.route('/api/v1/jobs/<job_uuid>', methods=['GET'])
def get_job(job_uuid):
    """
    Retrieve details about a specific job.
    :param job_uuid: str: uuid of the job returned from the POST to /jobs.
    :return: json response
    """
    job = CustomJob(job_uuid)
    job.load(get_db())
    return make_json_response(job.get_dict())


@app.route('/api/v1/jobs/<job_uuid>', methods=['PUT'])
def put_job(job_uuid):
    """
    Update job status.
    Secured via apache config: production/imads.conf.
    request['job_status'] str: value from customjob.JobStatus properties
    :param job_uuid: str: uuid of the job we want to update status
    :return: json response
    """
    db = get_db()
    (job_status,) = get_required_json_props(request, ["job_status"])
    error_message = request.get_json().get("error_message")
    if job_status == JobStatus.RUNNING:
        CustomJob.set_job_running(db, job_uuid)
    elif job_status == JobStatus.COMPLETE:
        CustomJob.set_job_complete(db, job_uuid)
    elif job_status == JobStatus.ERROR:
        CustomJob.set_job_as_error(db, job_uuid, error_message)
    else:
        raise ValueError("Invalid job status:{} for job:{}".format(job_status, job_uuid))
    return json_ok_result()


@app.route('/api/v1/custom_predictions', methods=['POST'])
@app.route('/api/v1/custom_preferences', methods=['POST'])
def post_custom_result():
    """
    Save custom prediction/preferences results.
    Secured via apache config: production/imads.conf.
    request['job_id'] - str: uuid of the job associated with these results
    request['bed_data'] - str: data that makes up the results
    request['model_name'] - str: name of the model used to build these results
    :return: json response with uuid of result stored in 'id' field
    """
    required_prop_names = ["job_id", "model_name"]
    (job_id, model_name) = get_required_json_props(request, required_prop_names)
    bed_data = request.get_json().get('bed_data')
    decoded_bed_data = base64.b64decode(bed_data)
    result_uuid = CustomResultData.new_uuid()
    result_data = CustomResultData(get_db(), result_uuid, job_id, model_name, decoded_bed_data)
    result_data.save()
    return make_json_response({'result': 'ok', 'id': result_uuid})


@app.route('/api/v1/custom_predictions/<result_id>/search', methods=['GET'])
@app.route('/api/v1/custom_preferences/<result_id>/search', methods=['GET'])
def search_custom_results(result_id):
    """
    Search a result for predictions.
    request['maxPredictionSort'] - when true sort by max prediction
    request['all'] - include values in download
    request['page'] - which page of results to show
    request['perPage'] - items per page to show
    :param result_id: str: uuid of the custom_predictions/custom_preferences we want to search
    :return: json response with 'result' property containing an array of predictions
    """
    args = request.args
    format = args.get('format')
    sort_by_max = args.get('maxPredictionSort')
    if sort_by_max == 'false':
        sort_by_max = None
    all_values = args.get('all')
    page = get_optional_int(args, 'page')
    per_page = get_optional_int(args, 'per_page')
    offset = None
    if page and per_page:
        offset = (page - 1) * per_page

    predictions = CustomResultData.get_predictions(get_db(), result_id, sort_by_max, per_page, offset)
    if format == 'tsv' or format == 'csv':
        filename = "custom_result.{}".format(format)
        separator = ','
        if format == 'tsv':
            separator = '\t'
        return download_file_response(filename, make_download_custom_result(separator, all_values, predictions))
    else:
        return make_ok_json_response({
            'result': predictions})


@app.route('/api/v1/custom_predictions/<result_id>/data', methods=['GET'])
@app.route('/api/v1/custom_preferences/<result_id>/data', methods=['GET'])
def get_custom_result_raw_data(result_id):
    bed_file_contents = CustomResultData.bed_file_contents(get_db(), result_id)
    def gen():
        yield bed_file_contents
    return download_file_response("data.bed", gen())


def download_file_response(filename, gen):
    content_disposition = 'attachment; filename="{}"'.format(filename)
    headers = {'Content-Disposition': content_disposition}
    r = Response(gen, mimetype='application/octet-stream', headers=headers)
    return r


def make_download_custom_result(separator, include_all, predictions):
    headers = ['Name', 'Sequence', 'Max']
    if include_all:
        headers.append('Values')
    yield separator.join(headers) + '\n'
    for prediction in predictions:
        items = [
            prediction['name'],
            prediction['sequence'],
            str(prediction['max'])
        ]
        if include_all:
            items.extend(get_all_values(prediction, len(prediction['sequence'])))
        yield separator.join(items) + '\n'


def get_optional_int(args, arg_name):
    value = args.get(arg_name)
    if value:
        return int(value)
    return None


@app.route('/api/v1/custom_predictions/find_one', methods=['GET'])
@app.route('/api/v1/custom_preferences/find_one', methods=['GET'])
def find_one_custom_result():
    """
    Find a single prediction for a sequence_id and model_name.
    request['sequence_id'] str: uuid of the custom sequence to look for
    request['model_name'] str: name of the model we are looking for a
    :return: json response with id field that is either None or the uuid of the custom_predictions/custom_preferences.
    """
    sequence_id = request.args['sequence_id']
    model_name = request.args['model_name']
    custom_result_id = CustomResultData.find_one(get_db(), sequence_id, model_name)
    return make_ok_json_response({'id': custom_result_id})


@app.route('/api/v1/custom_predictions/find_for_sequence', methods=['GET'])
@app.route('/api/v1/custom_preferences/find_for_sequence', methods=['GET'])
def find_custom_results_for_sequence():
    """
    Find a custom results for a sequence_id.
    request['sequence_id'] str: sequence ids to use when searching custom results
    :return: json response with results array of dict with keys resultId,modelName,sequenceId
    """
    sequence_id = request.args.get('sequence_id')
    custom_result_ids = CustomResultData.find(get_db(), sequence_id)
    return make_ok_json_response({'results': custom_result_ids})


def get_required_json_props(request, params):
    """
    Pull required fields from request or raise ValueError if they are missing.
    :param request: request we should check
    :param params: [str] list of names we should get values for
    :return: [value] list of values associated with the params.
    """
    json_data = request.get_json()
    if not json_data:
        raise ValueError("Missing required json payload.")
    values = []
    for param in params:
        value = json_data.get(param)
        if not value:
            raise ValueError("Missing required parameter {}.".format(param))
        values.append(value)
    return values


def json_ok_result():
    return make_json_response({'status':'ok'})


@app.errorhandler(ClientException)
def handle_user_exception(error):
    return error.json_response(jsonify)


def make_ok_json_response(props={}, status_code=None):
    """
    Make a json response with status='ok' property.
    :param props: base properties (shouldn't include status)
    :param status_code: status code to return
    :return: json response
    """
    props['status'] = 'ok'
    return make_json_response(props, status_code)


def make_json_response(props, status_code=None):
    """
    Make a json response from dictionary props.
    :param props: dictionary of values to be jsonified
    :param status_code: status code to return
    :return: json response
    """
    blob = jsonify(props)
    return make_response(blob, status_code)


def make_predictions_csv_response(predictions, args):
    up = args.get_upstream()
    down = args.get_downstream()
    size = up + down + 1
    if args.is_custom_ranges_list():
        size = None
    separator = ','
    if args.get_format() == 'tsv':
        separator = '\t'
    headers = ['Name', 'ID', 'Max', 'Chromosome', 'Start', 'End']
    if args.is_custom_ranges_list():
        headers = ['Chromosome', 'Start', 'End', 'Max']
    if args.get_include_all():
        if args.is_custom_ranges_list():
            headers.append('Values')
        else:
            headers.extend([str(i) for i in range(-1*up, down+1)])
    yield separator.join(headers) + '\n'
    for prediction in predictions:
        items = []
        if args.is_custom_ranges_list():
            items = [prediction['chrom'], str(prediction['start']), str(prediction['end']), str(prediction['max'])]
        else:
            start = prediction['start']
            end = prediction['end']
            items = [
                prediction['commonName'],
                prediction['name'],
                str(prediction['max']),
                prediction['chrom'],
                str(start),
                str(end)]
        if args.get_include_all():
            items.extend(get_all_values(prediction, size))
        yield separator.join(items) + '\n'


if __name__ == '__main__':
    app.run()
