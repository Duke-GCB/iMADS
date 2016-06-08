create index if not exists gene_prediction_grouped_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, common_name, chrom, strand, txstart, txend);

create index if not exists gene_prediction_value_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, value DESC);

analyze {{ schema_prefix }}.gene_prediction;