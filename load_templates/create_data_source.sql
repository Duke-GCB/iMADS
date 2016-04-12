{# creates data_source tables in public schema #}

create table public.data_source (
  url varchar NOT NULL,
  description varchar NOT NULL,
  downloaded timestamp with time zone NOT NULL default current_timestamp,
  PRIMARY KEY (url)
);