create index if not exists gene_prediction_name_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, name);

create index if not exists gene_prediction_value_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, value DESC);

analyze {{ schema_prefix }}.gene_prediction;