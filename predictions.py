#!/usr/bin/env python
from __future__ import print_function
import psycopg2
import psycopg2.extras
from flask import Flask, request, render_template, jsonify, g, make_response, redirect, Response
from config import parse_config, CONFIG_FILENAME
import time
import csv
import math

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


@app.route('/', methods=['GET'])
def root():
    return redirect("/static/src/index.html", code=302)

def show_main(selected_genome, warning=''):
    assemblies = get_genomes()
    proteins = get_models(selected_genome)
    gene_lists = get_gene_lists(selected_genome)
    return render_template('index.html', warning='',
                           assemblies=assemblies, proteins=proteins, gene_lists=gene_lists)


@app.route('/search', methods=['POST'])
def search():
    assembly = request.form.get('assembly', '')
    protein = request.form.get('protein', '')
    gene_list = request.form.get('gene_list', '')
    upstream = request.form.get('upstream', '')
    downstream = request.form.get('downstream', '')
    page = int(request.form.get('page', '1'))
    per_page = int(request.form.get('per_page', '20'))
    if not assembly or not protein or not gene_list or not upstream or not downstream:
        return show_main('hg38', warning='Please fill out all fields.')
    else:
        title = "TF binding predictions for {}.{} for protein {} +{}/-{}".format(
            assembly, gene_list, protein, upstream, downstream)
        predictions = get_predictions(assembly, protein, gene_list, upstream, downstream)
        return render_template('search_results.html',
                               title=title,
                               predictions=predictions,
                               predictions_len=len(predictions))


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

#@app.route('/genomes/<genome>')
#def genome_info(genome):
##    try:
#        return json_format(get_genome_data(genome))
#    except ValueError as e:
#        return json_format({"Error": str(e)}), 404


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
            next_pages = str(count_next_pages(genome, base_sql, base_params, offset, per_page, 5))
        blob = jsonify({
            'predictions': predictions,
            'next_pages': next_pages
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

    #Max sorting query
    """
select name,
    max(value) max_value,
    max(strand) as strand,
    max(case strand when '+' then txstart else txend end) as gene_start,
    json_agg(value) as pred_value,
    json_agg(case strand when '+' then start_range else end_range end) as pred_start
from gene_prediction
where
gene_list = 'knowngene'
and
model_name = 'E2F1'
and
  case strand when '+' then
      (txstart - 200) < start_range and (txstart + 200) > start_range
    else
      (txend - 200) < end_range and (txend + 200) > end_range
    end
and name in (
  select name
  from gene_prediction
  where
  gene_list = 'knowngene'
  and
  model_name = 'E2F1'
  and value > 0.5
  and
  case strand when '+' then
      (txstart - 200) < start_range and (txstart + 200) > start_range
    else
      (txend - 200) < end_range and (txend + 200) > end_range
    end
  group by name
  order by max(value) desc, name
  limit 100)

group by name
order by max(value) desc;
    """

@app.route('/genomes/<genome>/prediction2', methods=['POST','GET'])
def prediction_search2(genome):
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
    select name, common_name, chrom, round(max(value),3), min(start_range), max(end_range),
(select json_agg(json_build_object('value', round(value, 3), 'start', case strand when '+' then start_range else end_range end))
 from gene_prediction as gp2 where gp2.gene_list = gp1.gene_list and gp2.model_name = gp1.model_name and gp1.name = gp2.name
and case strand when '+' then
      (txstart - 200) < start_range and (txstart + 200) > start_range
    else
      (txend - 200) < end_range and (txend + 200) > end_range
    end  )
    from gene_prediction as gp1
    where
    gene_list = %s
    and model_name = %s
    and
    case strand when '+' then
      (txstart - %s) < start_range and (txstart + %s) > start_range
    else
      (txend - %s) < end_range and (txend + %s) > end_range
    end

    group by name, gene_list, model_name, common_name, chrom, strand, txstart, txend


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
                'other': row[6],
            }
            predictions.append(data)
        next_pages = 0
        if per_page != '':
            offset = int(per_page) * (int(page) - 1)
            next_pages = count_next_pages(genome, base_sql, base_params, offset, per_page, 5)
        blob = jsonify({
            'predictions': predictions,
            'next_pages': '1'
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

def count_next_pages(genome, sql, params, offset, per_page, max_next_pages=3):
    count_offset = int(offset) + int(per_page)
    count_limit = int(per_page) * max_next_pages
    count_params = params[:]
    count_params.extend([count_limit, count_offset])
    sql = "select count(*) from ({} limit %s offset %s ) as foo".format(sql)
    for row in query_generator(genome, sql, count_params):

        return math.ceil((float(row[0]) - count_offset) / int(per_page))
    return 0


def get_predictions(assembly, protein, gene_list, upstream, downstream, limit, offset):
    sql = """
    select * from gene_prediction
    where
    gene_list = %s
    and model_name = %s
    and
    case strand when '+' then
      (txstart - %s) < start_range and (txstart + %s) > end_range
    else
      (txend - %s) < start_range and (txend + %s) > end_range
    end

    order by name
    limit %s offset %s

    """
    params = [
        gene_list,
        protein,
        upstream,
        downstream,
        upstream,
        downstream,
        limit,
        offset
    ]
    prediction_range_result_set = query_generator(assembly, sql, params)
    return combine_prediction_ranges(prediction_range_result_set)


def combine_prediction_ranges(prediction_range_result_set):
    result = []
    last = None
    for row in prediction_range_result_set:
        if last and last['gene_name'] == row['name']:
            last['start_range'] = min(last['start_range'], row['start_range'])
            last['end_range'] = max(last['end_range'], row['end_range'])
        else:
            data = {
                'gene_name': row['name'],
                'common_gene_name': row['common_name'],
                'strand': row['strand'],
                'txstart': row['txstart'],
                'txend': row['txend'],
                'chrom': row['chrom'],
                'start_range': row['start_range'],
                'end_range': row['end_range'],
                'value': row['value'],
                'max': row['value'],
            }
            result.append(data)
            last = data
    return result


def query_predictions(genome, gene_list, chorm, model_name, upstream, downstream, page, per_page):
    sql = """
    select * from gene
    inner join prediction
    on gene.range && prediction.range
    and gene.chrom = prediction.chrom
    where
    gene.gene_list = %s
    and gene.chrom = %s
    and prediction.model_name = %s
    and
    case strand when '+' then
      (txstart - %s) < start_range and (txstart + %s) > end_range
    else
      (txend - %s) < start_range and (txend + %s) > end_range
    end
    """
    params = [
        gene_list,
        chorm,
        model_name,
        upstream,
        downstream,
        upstream,
        downstream,
    ]
    if per_page and per_page != -1:
        sql += "LIMIT %s OFFSET %s"
        params.append(per_page)
        params.append(page - 1)

    #qgen = query_generator(genome, sql, params)
    for row in qgen:
        break
    return []
    #return process_q(qgen)

def process_q(qgen):
    result = []
    for row in qgen:
        data = {
            'gene': {
                'gene_list': row['gene_list'],
                'gene_name': row['name'],
                'common_gene_name': row['common_name'],
                'strand': row['strand'],
                'txstart': row['txstart'],
                'txend': row['txend'],
                'chrom': row['chrom'],


            },
            'prediction': {
                'start_range': row['start_range'],
                'end_range': row['end_range'],
                'value': row['value'],
            }
        }
        result.append(data)
    return result

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
