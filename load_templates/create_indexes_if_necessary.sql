{# creates indexes on prediction and gene tables in a particular schema #}

create index if not exists pred_range_idx on {{ schema_prefix }}.prediction using gist(range);
create index if not exists gene_range_idx on {{ schema_prefix }}.gene using gist(range);
create index if not exists gene_list_chrom on {{ schema_prefix }}.gene(gene_list, chrom);
ANALYZE {{ schema_prefix }}.gene;
ANALYZE {{ schema_prefix }}.prediction;
