create index if not exists gene_range_idx on {{ schema_prefix }}.gene using gist(range);
create index if not exists gene_list_chrom on {{ schema_prefix }}.gene(gene_list, chrom);

-- generate gene_id's to allow easy sorting/group by chrom, gene_begin, common_name, strand
-- combines chrom, gene_begin, common_name, strand -> gene_id
-- create table
create table unique_gene (
gene_id serial,
common_name varchar,
chrom varchar,
strand varchar,
gene_begin integer);

-- populate table filling in serial (gene_id)
insert into  unique_gene(common_name, chrom, strand, gene_begin)
select common_name, chrom, strand, gene_begin
from {{ schema_prefix }}.gene group by common_name, chrom, strand, gene_begin
order by chrom, gene_begin, common_name, strand;

-- create index to speed up next step
create index ugidx on unique_gene (common_name, chrom, strand, gene_begin);

-- put gene_id values back into gene table.
update {{ schema_prefix }}.gene set gene_id = (
select gene_id from unique_gene
where
gene.common_name = unique_gene.common_name
and
gene.chrom = unique_gene.chrom
and
gene.strand = unique_gene.strand
and
gene.gene_begin = gene_begin);

-- drop table we no longer need
drop table unique_gene;

-- create an index for lookup purposes
CREATE index gene_list_id_idx on {{ schema_prefix }}.gene(gene_id);

ANALYZE {{ schema_prefix }}.gene;
