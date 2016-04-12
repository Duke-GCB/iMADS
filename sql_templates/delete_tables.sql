{# drops a list of tables in a particular schema #}

{% for table_name in delete_tables %}
  drop table {{ schema_prefix }}.{{ table_name}};
{% endfor %}