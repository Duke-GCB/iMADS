create index if not exists gene_prediction_grouped_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, chrom, txstart, common_name, strand, txend);

create index if not exists gene_prediction_value_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, value DESC);

analyze {{ schema_prefix }}.gene_prediction;