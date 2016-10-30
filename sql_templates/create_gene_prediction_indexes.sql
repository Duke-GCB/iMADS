create index if not exists gene_prediction_grouped_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, gene_id);

create index if not exists gene_prediction_value_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, abs(value) DESC);

create index if not exists gene_prediction_max_sort_idx
 on {{ schema_prefix }}.gene_prediction(gene_list, model_name, common_name);

-- for custom gene list speedup
create index gene_prediction_common_name_search_idx
 on {{ schema_prefix }}.gene_prediction(upper(common_name));

analyze {{ schema_prefix }}.gene_prediction;