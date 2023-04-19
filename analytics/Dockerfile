FROM matomo:4.14.1 as prod

# Set an environment variable that defaults to a non-privileged port
# Using a privileged port (>=1024) can cause issues, including on ECS
# Fargate and for running as a non-root user.
ENV PORT 8080

# Overwrite apache default port 80.
RUN sed -i "s/80/$PORT/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# Don't run as root.
USER www-data