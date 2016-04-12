{# populate the range field for gene table in  a particular schema #}

update {{ schema_prefix }}.gene set range = int4range(txstart-%s, txstart+%s, '[]') where strand = '+';
update {{ schema_prefix }}.gene set range = int4range(txend-%s, txend+%s, '[]') where strand = '-';