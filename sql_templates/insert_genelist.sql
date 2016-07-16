{# fill gene table in a particular schema with data from another we downloaded #}

insert into {{schema_prefix}}.gene(gene_list, name, common_name, chrom, strand, txstart, txend, gene_begin)
  select '{{source_table}}', name, {{common_name}}, chrom, strand, txstart, txend, case strand when '+' then txstart else txend end
    from {{schema_prefix}}.{{source_table}};
