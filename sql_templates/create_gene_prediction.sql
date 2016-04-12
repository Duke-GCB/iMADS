{# creates/fills gene_prediction table and associated indexes in a particular schema #}

select gene.gene_list, name, common_name, gene.chrom, strand, txstart, txend, prediction.model_name, value,
       start_range, end_range
 into {{ schema_prefix }}.gene_prediction
 from {{ schema_prefix }}.gene
    inner join {{ schema_prefix }}.prediction
    on gene.range && prediction.range
    and gene.chrom = prediction.chrom;

create index if not exists gene_prediction_name_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, name);

create index if not exists gene_prediction_value_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, value DESC);

analyze {{ schema_prefix }}.gene_prediction;