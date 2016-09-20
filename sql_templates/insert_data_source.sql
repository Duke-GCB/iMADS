{# record info about a file we downloaded #}

insert into public.data_source(url, description, data_source_type, downloaded, group_name)
values('{{ url }}','{{ description }}','{{ data_source_type }}', '{{ downloaded }}', '{{group_name}}');