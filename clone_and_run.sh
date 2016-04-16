#!/bin/bash
git clone https://github.com/Duke-GCB/TF-DNA-PredictionsDB.git
cd TF-DNA-PredictionsDB && gunicorn --bind 0.0.0.0:80 webserver:app
