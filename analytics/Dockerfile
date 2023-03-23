# Get the mysqladmin binary
FROM mysql:8-debian as mysql

# Build the matomo container
FROM matomo:4.14.1 as build
ENV VERSION=4.14.1
RUN set -x; \
  apt-get update \
  && apt-get install -y --no-install-recommends \
    git \
    wget
# Maybe don't need here?
# Get mysqladmin command
COPY --from=mysql /usr/bin/mysqladmin /usr/bin/mysqladmin
# Install composer
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
  &&  php -r "if (hash_file('sha384', 'composer-setup.php') === '55ce33d7678c5a611085589f1f3ddf8b3c52d662cd01d4ba75c0ee0459970c2200a51f492d557530c71c15d8dba01eae') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;" \
  && php composer-setup.php \
  && php -r "unlink('composer-setup.php');" \
  && mv composer.phar /usr/local/bin/composer
# Install matomo composer.json
RUN wget "https://raw.githubusercontent.com/matomo-org/matomo/$VERSION/composer.json"
# Install ExtraTools
RUN git clone https://github.com/digitalist-se/extratools.git plugins/ExtraTools

FROM matomo:4.14.1 as prod
COPY --from=mysql /usr/bin/mysqladmin /usr/bin/mysqladmin
COPY --from=build /usr/local/bin/composer /usr/local/bin/composer
COPY --from=build /var/www/html/composer.json .
COPY --from=build /var/www/html/plugins/ExtraTools plugins/ExtraTools
COPY docker-entrypoint.sh /entrypoint.sh
