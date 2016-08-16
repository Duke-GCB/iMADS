FROM python:2.7.11
EXPOSE 80
ENV MYDIR /tfdnapredictions
RUN apt-get update
RUN apt-get install nodejs -y
RUN apt-get install npm -y
RUN ln -s /usr/bin/nodejs /usr/bin/node
ADD . $MYDIR
WORKDIR ${MYDIR}
RUN npm install -g npm
RUN npm install --dev
RUN npm install webpack -g
RUN webpack
RUN npm install -g
ADD http://hgdownload.soe.ucsc.edu/admin/exe/linux.x86_64/bigBedToBed /usr/local/bin/bigBedToBed
RUN ["chmod", "777", "/usr/local/bin/bigBedToBed"]
RUN ["pip", "install", "-r", "requirements.txt"]
RUN ["pip", "install", "gunicorn"]
CMD ["gunicorn", "--bind", "0.0.0.0:80", "--timeout", "180", "--log-level=debug", "webserver:app"]