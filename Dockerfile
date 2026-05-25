FROM mysql:8

ENV MYSQL_ROOT_PASSWORD=root
ENV MYSQL_DATABASE=servicios_pro

COPY /database/ /docker-entrypoint-initdb.d/