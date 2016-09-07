FROM dukegcb/tf-dna-predictions
MAINTAINER john.bradley@duke.edu
# apache2
RUN apt-get update \
  && apt-get install -y apache2 apache2-utils libapache2-mod-wsgi\
  && apt-get clean

# Configure Apache
ADD tfpredictions.conf /etc/apache2/sites-available/tfpredictions.conf
RUN a2enmod ssl
RUN a2ensite tfpredictions

# Ensure services are stopped so that we can run them
RUN service apache2 stop

# Volume for certificates

VOLUME /etc/external/

EXPOSE 80
EXPOSE 443

# create password for worker user and run apache in the foreground
CMD htpasswd -cdb /etc/apache2/.htpasswd $WORKER_USERNAME $WORKER_PASSWORD && apachectl -DFOREGROUND
