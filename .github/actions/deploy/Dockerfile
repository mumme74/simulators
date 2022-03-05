FROM instrumentisto/rsync-ssh:alpine3.15
RUN apk add --update --no-cache npm \
     && rm -rf /var/cache/apk/*

LABEL "com.github.actions.name"="GitHub Action for One.com deployer"
LABEL "com.github.actions.description"="An action to deploy your repository to One.com via SSH"
LABEL "com.github.actions.icon"="upload-cloud"
LABEL "com.github.actions.color"="green"
LABEL "repository"="https://github.com/mumme74/simulators"
LABEL "maintainer"="Fredrik Johansson"

WORKDIR /usr/src

COPY entrypoint.sh  /usr/src/entrypoint.sh
RUN chmod 744 /usr/src/entrypoint.sh


ADD htaccess_lib /usr/src/simulators/lib/.htaccess
ADD htaccess_root /usr/src/simulators/.htaccess

RUN echo "PubkeyAcceptedKeyTypes +ssh-rsa" >> /etc/ssh/ssh_config

ENTRYPOINT [ "/usr/src/entrypoint.sh" ]