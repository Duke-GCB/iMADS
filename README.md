# TF-DNA-PredictionsDB
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
webpack --progress --colors --watch
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

### To run the docker image:
```
docker-compose up
```