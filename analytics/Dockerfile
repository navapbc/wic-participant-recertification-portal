FROM matomo:4.14.1 as prod

# Set an environment variable that defaults to a non-privileged port
# Using a privileged port (>=1024) causes issues on aws ecs fargate
# This may not be necessary if deploying to a non-fargate host
ENV PORT 8080

RUN sed -i "s/80/$PORT/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# Overwrite apache default port 80 by adding a sed command to the upstream matomo entrypoint file.
# RUN tail -n 1 /entrypoint.sh > /tmp/tmp-tail \
#   && head -n -2 /entrypoint.sh > /tmp/tmp-entrypoint.sh \
#   && echo 'sed -i "s/80/$PORT/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf' >> /tmp/tmp-entrypoint.sh \
#   && cat /tmp/tmp-tail >> /tmp/tmp-entrypoint.sh \
#   && cat /tmp/tmp-entrypoint.sh > /entrypoint.sh \
#   && rm /tmp/tmp-tail /tmp/tmp-entrypoint.sh

COPY docker-entrypoint.sh /entrypoint.sh
