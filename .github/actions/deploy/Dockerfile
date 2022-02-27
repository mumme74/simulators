FROM instrumentisto/rsync-ssh:alpine3.13-r4
RUN apk add --update --no-cache npm \
 && rm -rf /var/cache/apk/*

LABEL "com.github.actions.name"="GitHub Action for One.com deployer"
LABEL "com.github.actions.description"="An action to deploy your repository to One.com via SSH"
LABEL "com.github.actions.icon"="upload-cloud"
LABEL "com.github.actions.color"="green"
LABEL "repository"="https://github.com/mumme74/simulators"
LABEL "maintainer"="Fredrik Johansson"

ARG ONE_SSH_KEY_PRIVATE
ARG ONE_SSH_KEY_PUBLIC
ARG ONE_DOMAIN_NAME
ARG SSH_PATH="/root/.ssh"
ARG SSH_KEY_NAME="id_rsa"

RUN mkdir "$SSH_PATH"
#Copy Secret Keys to container
RUN echo "$ONE_SSH_KEY_PRIVATE" > "${SSH_PATH}/${SSH_KEY_NAME}"
RUN echo "$ONE_SSH_KEY_PUBLIC" > "${SSH_PATH}/${SSH_KEY_NAME}.pub"
RUN touch "$SSH_PATH/known_hosts"


#Set Key Perms
RUN chmod 700 "${SSH_PATH}"
RUN chmod 600 "${SSH_PATH}/${SSH_KEY_NAME}"
RUN chmod 600 "${SSH_PATH}/${SSH_KEY_NAME}.pub"
RUN chmod 600 "${SSH_PATH}/known_hosts"


WORKDIR /usr/src

RUN echo "$ONE_DOMAIN_NAME" > domainname


ADD simulators simulators

WORKDIR /usr/src/simulators
ADD htaccess_lib lib/.htaccess
ADD htaccess_root .htaccess

RUN npm install --save-dev
RUN npm run build -if-present
RUN npm run docs -if-present
RUN rm -Rf node_modules
WORKDIR /usr/src


COPY entrypoint.sh entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
