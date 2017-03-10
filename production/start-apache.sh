#!/usr/bin/env bash

# Apache gets grumpy about PID files pre-existing
if [ -e /var/run/apache2/apache2.pid ]; then
  echo "Removing stale apache2.pid"
  rm -f /var/run/apache2/apache2.pid
fi

# create password for worker user
echo "Creating /etc/apache2/.htpasswd file"
htpasswd -cdb /etc/apache2/.htpasswd $WORKER_USERNAME $WORKER_PASSWORD

# Run apache in foreground
echo "Starting httpd"
/usr/sbin/apachectl -DFOREGROUND
