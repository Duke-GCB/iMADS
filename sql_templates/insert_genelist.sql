{# fill gene table in a particular schema with data from another we downloaded #}

insert into {{schema_prefix}}.gene(gene_list, name, common_name, chrom, strand, txstart, txend)
  select '{{source_table}}', name, {{common_name}}, chrom, strand, txstart, txend
    from {{schema_prefix}}.{{source_table}};
