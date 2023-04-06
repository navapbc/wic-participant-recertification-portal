FROM matomo:4.14.1 as prod

# Set an environment variable that defaults to a non-privileged port
ENV PORT 8080

# Overwrite apache default port 80 by adding a sed command to the entrypoint file.
RUN tail -n 1 /entrypoint.sh > /tmp/tmp-tail \
  && head -n -2 /entrypoint.sh > /tmp/tmp-entrypoint.sh \
  && echo 'sed -i "s/80/$PORT/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf' >> /tmp/tmp-entrypoint.sh \
  && cat /tmp/tmp-tail >> /tmp/tmp-entrypoint.sh \
  && cat /tmp/tmp-entrypoint.sh > /entrypoint.sh \
  && rm /tmp/tmp-tail /tmp/tmp-entrypoint.sh
