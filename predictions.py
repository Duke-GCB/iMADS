#!/usr/bin/env python
from __future__ import print_function
import psycopg2
import psycopg2.extras
from flask import Flask, request, render_template, jsonify, g, make_response, redirect, Response
from config import parse_config, CONFIG_FILENAME

app = Flask(__name__)

g_config = parse_config(CONFIG_FILENAME)
g_dbconfig = g_config.dbconfig


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = psycopg2.connect('host=' + g_dbconfig.host +
                                            ' dbname=' + g_dbconfig.dbname +
                                            ' user=' + g_dbconfig.user +
                                            ' password=' + g_dbconfig.password)
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


class PredictionQueryBuilder(object):
    SET_SCHEMA_SQL = "SET search_path TO %s,public"
    WITH_MAX_PRED_SQL = """with max_prediction_names as (
 select name from gene_prediction"""
    WHERE_BASE = """where
 gene_list = %s
 and
 model_name = %s
 and
 case strand when '+' then
  (txstart - %s) < start_range and (txstart + %s) > start_range
 else
  (txend - %s) < end_range and (txend + %s) > end_range
 end"""
    VALUE_GT_SQL = " and value > %s"
    GROUP_BY_NAME_SQL = " group by name"
    QUERY_BASE = """select name, max(value) max_value, max(strand) as strand,
 max(case strand when '+' then txstart else txend end) as gene_start,
 json_agg(json_build_object('value', value,
  'start', (case strand when '+' then start_range else end_range end))) as pred
 from gene_prediction
 """ + WHERE_BASE
    NAME_IN_MAX_NAMES_SQL = "and name in (select name from max_prediction_names)"
    ORDER_BY_NAME = " order by name"
    ORDER_BY_MAX = " order by max(value) desc"
    ORDER_BY_MAX_AND_NAME = " order by max(value) desc, name"
    LIMIT_OFFSET_SQL = " limit %s offset %s"

    def __init__(self, genome, gene_list, model_name):
        self.genome = genome
        self.gene_list = gene_list
        self.model_name = model_name
        self.limit = None
        self.offset = None
        self.max_value_guess = None
        self.main_query_func = self.sql_query_by_name
        self.params = []

    def set_main_query_func(self, query_func):
        self.main_query_func = query_func

    def set_limit_and_offset(self, limit, offset):
        self.limit = limit
        self.offset = offset

    def set_max_value_guess(self, guess):
        self.max_value_guess = guess

    def join_with_limit(self, parts):
        if self.limit and self.offset:
            parts.append(self._sql_limit_and_offset())
        return self.join(parts)

    def join(self, parts):
        return '\n'.join(parts)

    def make_query_and_params(self, upstream, downstream):
        self.params = []
        parts = [self._sql_set_search_path(),
                 self.main_query_func(upstream, downstream)]
        query = "\n".join(parts) + ";"
        return query, self.params

    def _sql_set_search_path(self):
        self.params.append(self.genome)
        return self.SET_SCHEMA_SQL + ";"

    def sql_query_by_name(self, upstream, downstream):
        self.params.extend([self.gene_list, self.model_name, upstream, downstream, downstream, upstream])
        return self.join_with_limit([self.QUERY_BASE, self.GROUP_BY_NAME_SQL, self.ORDER_BY_NAME])

    def sql_query_by_max(self, upstream, downstream):
        self.params.extend([self.gene_list, self.model_name, upstream, downstream, downstream, upstream])
        parts = [self.WITH_MAX_PRED_SQL, self.WHERE_BASE]
        if self.max_value_guess:
            self.params.append(self.max_value_guess)
            parts.append(self.VALUE_GT_SQL)
        parts.extend([self.GROUP_BY_NAME_SQL, self.ORDER_BY_MAX])
        with_clause = self.join_with_limit(parts)
        with_clause += "\n)"
        self.params.extend([self.gene_list, self.model_name, upstream, downstream, downstream, upstream])
        return self.join([with_clause, self.QUERY_BASE, self.NAME_IN_MAX_NAMES_SQL,
                          self.GROUP_BY_NAME_SQL, self.ORDER_BY_MAX_AND_NAME])

    def _sql_limit_and_offset(self):
        self.params.extend([self.limit, self.offset])
        return self.LIMIT_OFFSET_SQL


@app.route('/', methods=['GET'])
def root():
    return redirect("/static/src/index.html", code=302)


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




@app.route('/genomes/<genome>/prediction', methods=['POST','GET'])
def prediction_search(genome):
    print("finding predictions.")

    # assembly, protein, gene_list, upstream, downstream, limit, offset
    protein = request.args.get('protein', '')
    gene_list = request.args.get('gene_list', '')
    upstream = request.args.get('upstream', '')
    downstream = request.args.get('downstream', '')
    per_page = request.args.get('per_page', '')
    page = request.args.get('page', '1')
    format = request.args.get('format', 'json')
    max_prediction_sort = request.args.get('max_prediction_sort', 'false')
    base_sql = """
    select name, common_name, chrom, max(value), min(start_range), max(end_range) from gene_prediction
    where
    gene_list = %s
    and model_name = %s
    and
    case strand when '+' then
      (txstart - %s) < start_range and (txstart + %s) > start_range
    else
      (txend - %s) < end_range and (txend + %s) > end_range
    end

    group by name, common_name, chrom


    """
    base_params = [
        gene_list,
        protein,
        upstream,
        downstream,
        upstream,
        downstream,
    ]
    if max_prediction_sort == 'true':
        base_sql += " order by max(value) desc"
    else:
        base_sql += " order by name "
    sql = base_sql
    params = base_params[:]
    if per_page != '':
        sql += ' limit %s offset %s '
        offset = int(per_page) * (int(page) - 1)
        params.extend([per_page, offset])

    r = None
    if format == 'json':
        predictions = []
        for row in query_generator(genome, sql, params):
            data = {
                'name': row[0],
                'common_name': row[1],
                'chrom': row[2],
                'max': str(row[3]),
                'start': row[4],
                'end': row[5],
            }
            predictions.append(data)
        next_pages = 0
        if per_page != '':
            offset = int(per_page) * (int(page) - 1)
        blob = jsonify({
            'predictions': predictions,
        })
        r = make_response(blob)
    else:
        sep = ','
        if format == 'tsv':
            sep = '\t'
        results = list(query_generator(genome, sql, params))
        def generateit():
            for row in results:
                yield sep.join(map(str, row)) + '\n'
        r = Response(generateit(), mimetype='text/' + format)
    r.headers['Access-Control-Allow-Origin'] = '*'



    print("returning predictions.")
    return r

def get_genomes():
    genomes = []
    for genome_data in g_config.genome_data_list:
        genome = genome_data.genomename
        genomes.append(genome)
    #sql = "select schema_name from information_schema.schemata where schema_owner = %s"
    #for row in query_generator(None, sql, [g_dbconfig.user]):
    #    genomes.append(row[0])
    return genomes


def is_good_schema(schema):
    return schema in get_genomes()

def get_genome_data(genome):
    return {
        'models': get_models(genome),
        'gene_lists': get_gene_lists(genome),
    }

def get_models(genome):
    models = []
    sql = "select distinct(model_name) from prediction;"
    for row in query_generator(genome, sql):
        models.append(row[0])
    return models


def get_gene_lists(genome):
    models = []
    sql = "select distinct(gene_list) from gene;"
    for row in query_generator(genome, sql):
        models.append(row[0])
    return models


def json_format(result):
    results = {
        "results": result
    }
    return jsonify(result)


def query_generator(schema, query, params=[]):
    db = get_db()
    cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
    set_schema(cur, schema)
    cur.execute(query, params)
    for row in cur.fetchall():
        yield row
    cur.close()


def set_schema(cur, schema):
    if schema:
        if not is_good_schema(schema):
            raise ValueError("Schema not found:" + schema)
        cur.execute('SET search_path TO %s,public;', [schema])
    else:
        cur.execute('SET search_path TO public;')

if __name__ == '__main__':
    app.debug = True
    app.run()
