{# creates data_source tables in public schema #}

CREATE TYPE data_source_type AS ENUM ('prediction', 'genelist', 'model');

create table public.data_source (
  url varchar NOT NULL,
  data_source_type data_source_type,
  description varchar NOT NULL,
  downloaded timestamp with time zone NOT NULL default current_timestamp,
  group_name varchar,
  PRIMARY KEY (url)
);