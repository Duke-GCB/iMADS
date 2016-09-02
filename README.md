# TF-DNA-PredictionsDB [![CircleCI](https://circleci.com/gh/Duke-GCB/TF-DNA-PredictionsDB.svg?style=svg)](https://circleci.com/gh/Duke-GCB/TF-DNA-PredictionsDB)
Tool for viewing transcription factor prediction for gene lists and custom DNA sequences.

### Major Components
* __predictionsconf.yaml__ - this config file determines what will be downloaded and how prediction database will work
* __'pred' database__ - postgres contains indexed gene lists and predicitions data for use by webserver.py
* __load.py__ - downloads files and loads the database based on predictionsconf.yaml
* __webserver.py__ - serves web portal and API for accessing the 'pred' database
* __vacuum.py__ - deletes old data from the 'pred' database
* __portal__ - reactjs project that builds static/js/bunde.js for webserver.py to serve


### Running:

__Deployment__
We use playbook tf_dna_predictions.yml from https://github.com/Duke-GCB/gcb-ansible.

__Run via docker-compose__
Download `docker-compose.yml` and `.env_sample`.
Rename `.env_sample` to `.env`
Change DB_PASS_ENV and POSTGRES_PASSWORD to be whatever password you want.
Start the database and webserver.
```
docker-compose up -d
```
Populate the database. (This will take quite a while depending upon predictionsconf.yaml)
```
docker-compose run --no-deps --rm web python load.py 
```


### Javascript unit tests:
Requires mocha and chai.
Setup:
```
cd portal
npm install -g mocha
npm install --dev
```

To run:
```
cd portal
npm run test
```

### Python unit tests:
From the root directory run this:
```
nosetests
```
Integration tests are skipped (they are run by circleci).
See tests/test_integration.py skip_postgres_tests for instructions for running them manually.

### Config file updates:
Under the `util` directory there is a python script for updating the config file.
It can be run like so:
```
cd util
python create_conf.py
```
This will lookup the latest predictions based on the __DATA_SOURCE_URL__ in create_conf.yaml.
If you want to add a new gene list you will need to update __GENOME_SPECIFIC_DATA__ in create_conf.yaml.
