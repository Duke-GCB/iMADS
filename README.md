# iMADS [![CircleCI](https://circleci.com/gh/Duke-GCB/iMADS.svg?style=svg)](https://circleci.com/gh/Duke-GCB/iMADS)

Website for searching and creating transcription factor predictions/preferences.
Searches predictions and prerference data by gene lists and custom ranges.
Creates predictions/preferences for user uploaded DNA sequences.


## Major Components
__Predictions Config File__ 

predictionsconf.yaml - this config file determines what will be downloaded and how prediction database will work

__Predictions Database__

Postgres database contains indexed gene lists, custom user data and predicitions data for use by webserver.py

__Database Loading Script__

load.py - downloads files and loads the database based on predictionsconf.yaml

__Webserver__

webserver.py serves web portal and API for accessing the 'pred' database

__Database Vacuum Script__

vacuum.py deletes old user data from the 'pred' database

__Web Portal__

Directory portal/ contains the reactjs project that builds static/js/bunde.js for webserver.py to serve.

__Custom Prediction/Preference Worker__

Calculates predictions and preferences for user uploaded sequences.
https://github.com/Duke-GCB/Predict-TF-Binding-Worker

## Running:

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


## Javascript unit tests:
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

## Python unit tests:
From the root directory run this:
```
nosetests
```
Integration tests are skipped (they are run by circleci).
See tests/test_integration.py skip_postgres_tests for instructions for running them manually.

## Config file updates:
Under the `util` directory there is a python script for updating the config file.
It can be run like so:
```
cd util
python create_conf.py
```
This will lookup the latest predictions based on the __DATA_SOURCE_URL__ in create_conf.yaml.
If you want to add a new gene list you will need to update __GENOME_SPECIFIC_DATA__ in create_conf.yaml.
