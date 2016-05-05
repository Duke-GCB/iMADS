FROM python:2.7.11
EXPOSE 8000
ENV MYDIR /tfdnapredictions
RUN apt-get update
RUN apt-get install nodejs -y
RUN apt-get install npm -y
RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN npm install -g npm
ADD . $MYDIR
WORKDIR ${MYDIR}
RUN npm install -g
RUN ["chmod", "777", "/tfdnapredictions/clone_and_run.sh"]
ADD http://hgdownload.soe.ucsc.edu/admin/exe/linux.x86_64/bigBedToBed /usr/local/bin/bigBedToBed
RUN ["chmod", "777", "/usr/local/bin/bigBedToBed"]
RUN ["pip", "install", "-r", "requirements.txt"]
RUN ["pip", "install", "gunicorn"]
CMD ["./clone_and_run.sh"]