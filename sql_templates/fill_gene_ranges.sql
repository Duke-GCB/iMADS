{# populate the range field for gene table in  a particular schema #}

update {{ schema_prefix }}.gene set range = int4range(txstart-{{ binding_max_offset }}, txstart+{{ binding_max_offset }}, '[]') where strand = '+';
update {{ schema_prefix }}.gene set range = int4range(txend-{{ binding_max_offset }}, txend+{{ binding_max_offset }}, '[]') where strand = '-';