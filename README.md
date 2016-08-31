# TF-DNA-PredictionsDB [![CircleCI](https://circleci.com/gh/Duke-GCB/TF-DNA-PredictionsDB.svg?style=svg)](https://circleci.com/gh/Duke-GCB/TF-DNA-PredictionsDB)
Tool for viewing prediction values for genes.
Currently requires bigWigToBedGraph installed in your path.
It can be downloaded from http://hgdownload.soe.ucsc.edu/admin/exe.

###Setup for Postgres

Create a postgres database:

```
create database pred;
CREATE ROLE pred_user WITH LOGIN PASSWORD <PASSWORD>;
```

Update the config file: predictionsconf.json

Populate the database with the:

Load database with prediction data:
```
python load.py 
```

Run web server:
```
# TODO
```
Open: <http://localhost:5000>

### Note:
We use schemas to seperate the different versions of the genome.
So if you want to see the hg38 tables in psql you must first do:
```
SET search_path TO hg38,public;
```


### Setup to run dev webserver:
```
npm install
npm run webpack
```
In another window:
```
python predictions.py
```


### To rebuild the docker image:
```
docker build -t jbradley/tfpred .
docker push jbradley/tfpred 
```

### To run production via docker-compose:
Download `docker-compose.yml` and `.env_sample`.
Rename `.env_sample` to `.env_`
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
Currently installing mocha globally per their docs(not sure if it is necessary).
Setup:
```
npm install -g mocha
npm install --dev
```

To run:
```
npm run test
```

### Config file updates:
Rebuild prediction based on trackup:
```
curl http://trackhub.genome.duke.edu/gordanlab/tf-dna-binding-predictions/hg38/trackDb.txt | grep 'track\|bigDataUrl' | sed -e 's/^track /name: "/' -e 's/$/"/' | sed -e 's/^bigDataUrl /url: "/'
```
Then add these to the appropriate section of the yaml file.

