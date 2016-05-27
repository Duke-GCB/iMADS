{# creates prediction and gene tables inside a particular schema #}

CREATE TYPE {{ schema_prefix }}.model_type AS ENUM ({{ model_types }});

create table {{ schema_prefix }}.prediction (
  chrom varchar NOT NULL,
  start_range int NOT NULL,
  end_range int NOT NULL,
  value numeric NOT NULL,
  model_name {{ schema_prefix }}.model_type NOT NULL,
  range int4range,
  PRIMARY KEY (model_name, chrom, start_range)
);
GRANT ALL PRIVILEGES ON {{ schema_prefix }}.prediction TO pred_user;
CREATE index pred_idx on {{ schema_prefix }}.prediction(chrom, start_range, end_range);

CREATE TABLE {{ schema_prefix }}.gene (
  gene_list varchar NOT NULL,
  name varchar NOT NULL,
  common_name varchar,
  chrom varchar NOT NULL,
  strand char(1) NOT NULL,
  txstart int NOT NULL,
  txend int NOT NULL,
  range int4range
);
GRANT ALL PRIVILEGES ON {{ schema_prefix }}.gene TO pred_user;
CREATE index gene_list_idx on {{ schema_prefix }}.gene(gene_list);


CREATE TABLE {{ schema_prefix }}.gene_prediction (
  gene_list varchar NOT NULL,
  name varchar NOT NULL,
  common_name varchar,
  chrom varchar NOT NULL,
  strand char(1) NOT NULL,
  txstart int NOT NULL,
  txend int NOT NULL,
  model_name {{ schema_prefix }}.model_type NOT NULL,
  value numeric NOT NULL,
  start_range int NOT NULL,
  end_range int NOT NULL
);
GRANT ALL PRIVILEGES ON {{ schema_prefix }}.gene_prediction TO pred_user;
