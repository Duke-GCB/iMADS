insert into  {{ schema_prefix }}.gene_prediction
select gene.gene_list, name, common_name, gene.chrom, strand, gene_id, gene_begin, prediction.model_name, value,
       start_range, end_range
 from {{ schema_prefix }}.gene
    inner join {{ schema_prefix }}.prediction
    on gene.range && prediction.range
    and gene.chrom = prediction.chrom
    where gene.chrom = '{{ chromosome }}'
        and model_name = '{{ model_name }}';
