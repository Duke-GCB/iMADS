FROM python:2.7.11
EXPOSE 8000
ENV MYDIR /tfdnapredictions
ADD http://hgdownload.soe.ucsc.edu/admin/exe/linux.x86_64/bigBedToBed /usr/local/bin/bigBedToBed
ADD . $MYDIR
RUN ["chmod", "777", "/usr/local/bin/bigBedToBed"]
WORKDIR ${MYDIR}
RUN ["pip", "install", "-r", "requirements.txt"]
RUN ["pip", "install", "gunicorn"]
CMD ["gunicorn", "--bind", "0.0.0.0:80", "predictions:app"]
