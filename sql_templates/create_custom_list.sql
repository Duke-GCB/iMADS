CREATE TYPE custom_list_type AS ENUM ('range', 'gene_list');

create table custom_list (
  id bigserial PRIMARY KEY,
  uploaded timestamp with time zone default current_timestamp NOT NULL,
  user_info varchar NOT NULL,
  type custom_list_type NOT NULL
);

create table custom_range_list (
  id bigint references custom_list(id) ON DELETE CASCADE,
  seq integer NOT NULL,
  chrom varchar NOT NULL,
  range int4range NOT NULL,
  PRIMARY KEY(id, seq)
);
create index custom_range_list_range_idx on custom_range_list using gist(range);

create table custom_gene_list (
  id bigint references custom_list(id) ON DELETE CASCADE,
  gene_name varchar,
  seq integer NOT NULL,
  PRIMARY KEY(id, seq)
);