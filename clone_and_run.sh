#!/bin/bash
git clone https://github.com/Duke-GCB/TF-DNA-PredictionsDB.git
cd TF-DNA-PredictionsDB
npm install
npm install webpack -g
webpack
gunicorn --bind 0.0.0.0:80 webserver:app
