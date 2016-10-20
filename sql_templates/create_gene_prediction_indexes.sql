create index if not exists gene_prediction_grouped_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, chrom, gene_begin, common_name, strand);

create index if not exists gene_prediction_value_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, abs(value) DESC);

create index if not exists gene_prediction_max_sort_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, common_name);

create index if not exists gene_prediction_name_idx
 on hg19.gene_prediction(model_name, upper(common_name));

analyze {{ schema_prefix }}.gene_prediction;