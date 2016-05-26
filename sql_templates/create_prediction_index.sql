create index if not exists pred_range_idx on {{ schema_prefix }}.prediction using gist(range);
ANALYZE {{ schema_prefix }}.prediction;
