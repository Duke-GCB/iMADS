CREATE TYPE job_status AS ENUM ('NEW', 'RUNNING', 'COMPLETE', 'ERROR');
CREATE TYPE job_type AS ENUM ('PREDICTION', 'PREFERENCE');

-- List of DNA sequences uploaded by a user
create table sequence_list (
  id uuid PRIMARY KEY,
  created timestamp with time zone default current_timestamp NOT NULL,
  data text NOT NULL,  --fasta format data
  title varchar NOT NULL -- user specified name of the sequence
);

-- Single sequence from the DNA sequences uploaded by a user
create table sequence_list_item (
  seq_id uuid references sequence_list(id), -- sequence this list belongs to
  idx int, -- preserves original order of this item
  name varchar NOT NULL, --name of the sequence
  sequence text NOT NULL  -- sequence data from a single item in a fasta file (ACGT)
);

create index sequence_list_item_idx on sequence_list_item(seq_id, name);

-- Jobs requested by a user
create table job (
  id uuid PRIMARY KEY, -- unique id for a job
  created timestamp with time zone default current_timestamp NOT NULL, -- when the job was created
  finished timestamp with time zone, -- filled in once the job is complete
  seq_id uuid REFERENCES sequence_list(id) NOT NULL, -- DNA Sequence to use in job
  status job_status NOT NULL, -- NEW, RUNNING, etc
  type job_type NOT NULL, -- PREFERENCE or PREDICTION
  model_name varchar NOT NULL, -- name of the model we want built
  error_msg varchar, -- error message filled in
  UNIQUE(seq_id, type, model_name)
);

-- Result of job requested by a user
create table custom_result (
  id uuid PRIMARY KEY,
  job_id uuid references job(id) NOT NULL,
  model_name varchar NOT NULL
);

create index custom_result_search_idx on custom_result(model_name, job_id, id);

create table custom_result_row (
  result_id uuid references custom_result(id),
  name varchar NOT NULL,
  start integer NOT NULL,
  stop integer NOT NULL,
  value numeric NOT NULL
);

create index custom_result_row_name_idx on custom_result_row(result_id, name);
create index custom_result_row_value_idx on custom_result_row(result_id, abs(value) DESC);

