#!/bin/bash
git clone https://github.com/Duke-GCB/TF-DNA-PredictionsDB.git
cd TF-DNA-PredictionsDB
npm install
npm install --dev
npm install webpack -g
webpack
TIMEOUT=180
gunicorn --bind 0.0.0.0:80 \
         --timeout $TIMEOUT \
         --log-level=debug \
         webserver:app
