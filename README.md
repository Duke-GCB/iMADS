# TF-DNA-PredictionsDB
Tool for extracting prediction values from a BigWig file for various ranges.

###Setup for Postgres

Create a postgres database:

```
create database pred;
CREATE ROLE pred_user WITH LOGIN PASSWORD 'bw4life';
```

Setup environment variable pointing to the database:
```
export PRED_DB=postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/pred
```

Load database with prediction data:
```
python predictions.py --web
```
