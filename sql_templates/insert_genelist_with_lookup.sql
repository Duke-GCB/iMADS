{# fill gene table in a particular schema with data from two joined tables we downloaded #}

create index if not exists {{ common_lookup_table}}_idx
  on {{schema_prefix}}.{{common_lookup_table}}({{common_lookup_table_field}});

insert into {{schema_prefix}}.gene(gene_list, name, chrom, strand, txstart, txend)
      select '{{source_table}}', name, chrom, strand, txstart, txend
        from {{schema_prefix}}.{{source_table}};

update {{schema_prefix}}.gene set common_name = (
  select {{common_name}} from {{schema_prefix}}.{{common_lookup_table}} where {{common_lookup_table_field}} = gene.name)
    where gene_list = '{{source_table}}';