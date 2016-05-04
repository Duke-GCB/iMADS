FROM python:2.7.11
EXPOSE 8000
ENV MYDIR /tfdnapredictions
RUN apt-get update
RUN apt-get install nodejs -y
RUN apt-get install npm -y
RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN npm install -g npm
ADD ./package.json $MYDIR/package.json
WORKDIR ${MYDIR}
RUN npm install -g
ADD ./requirements.txt $MYDIR/requirements.txt
ADD ./clone_and_run.sh $MYDIR/clone_and_run.sh
RUN ["chmod", "777", "/tfdnapredictions/clone_and_run.sh"]
ADD http://hgdownload.soe.ucsc.edu/admin/exe/linux.x86_64/bigBedToBed /usr/local/bin/bigBedToBed
RUN ["chmod", "777", "/usr/local/bin/bigBedToBed"]
ADD http://hgdownload.soe.ucsc.edu/admin/exe/linux.x86_64/twoBitToFa /usr/local/bin/twoBitToFa
RUN ["chmod", "777", "/usr/local/bin/twoBitToFa"]
RUN ["pip", "install", "-r", "requirements.txt"]
RUN ["pip", "install", "gunicorn"]
CMD ["./clone_and_run.sh"]