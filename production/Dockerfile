ARG BASE_IMAGE=dukegcb/imads
FROM ${BASE_IMAGE}
LABEL maintainer="john.bradley@duke.edu"

RUN apt-get update && apt-get install -y \
  apache2 \
  apache2-dev

RUN pip install mod_wsgi==4.6.4

# Since mod_wsgi is installed in python libs directory, this command
# links it into apache for easier usage.
RUN mod_wsgi-express install-module

RUN ["pip", "install", "mod_wsgi"]

# Configure Apache
RUN a2dissite 000-default # disable default apache logging config
ADD imads.conf /etc/apache2/sites-available/imads.conf
RUN a2enmod ssl
RUN a2ensite imads

# Ensure services are stopped so that we can run them
RUN service apache2 stop

# Volume for certificates

VOLUME /etc/external/

EXPOSE 80
EXPOSE 443

ADD start-apache.sh /usr/bin/start-apache.sh
CMD ["start-apache.sh"]
