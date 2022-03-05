#!/bin/sh -l


#SSH Key Vars
SSH_PATH="$HOME/.ssh"
SSH_KEY_NAME="id_rsa"
KNOWN_HOSTS_PATH="$SSH_PATH/known_hosts"
ONE_SSH_KEY_PRIVATE_PATH="$SSH_PATH/${SSH_KEY_NAME}"
ONE_SSH_KEY_PUBLIC_PATH="$SSH_PATH/${SSH_KEY_NAME}.pub"

set -e

: ${ONE_DOMAIN_NAME?Required environment name variable not set.}
: ${ONE_SSH_KEY_PRIVATE?Required environment name variable not set.}
: ${ONE_SSH_KEY_PUBLIC?Required environment name variable not set.}


mkdir -p "$SSH_PATH"
touch "$SSH_PATH/known_hosts"
touch "${ONE_SSH_KEY_PRIVATE_PATH}"
touch "${ONE_SSH_KEY_PUBLIC_PATH}"

#Copy Secret Keys to container
if [ -z $(cat "$ONE_SSH_KEY_PRIVATE_PATH") ]; then
  echo -e "$ONE_SSH_KEY_PRIVATE" > "$ONE_SSH_KEY_PRIVATE_PATH"
  #echo -e "*********private_key****************"
  #cat "$ONE_SSH_KEY_PRIVATE_PATH"
  #echo -e "***********************'$ONE_SSH_KEY_PRIVATE'*************"
fi
if [ -z $(cat "$ONE_SSH_KEY_PUBLIC_PATH") ]; then
  echo -e "$ONE_SSH_KEY_PUBLIC" > "$ONE_SSH_KEY_PUBLIC_PATH"
  #echo -e "*********public_key***************"
  #cat "$ONE_SSH_KEY_PUBLIC_PATH"
  #echo -e "***********************'$ONE_SSH_KEY_PUBLIC'***********"
fi

#Set Key Perms
chmod 700 "${SSH_PATH}"
chmod 600 "${ONE_SSH_KEY_PRIVATE_PATH}"
chmod 600 "${ONE_SSH_KEY_PUBLIC_PATH}"
chmod 600 "${SSH_PATH}/known_hosts"

ls $GITHUB_WORKSPACE/*/**
echo "cp -rf $GITHUB_WORKSPACE/* /usr/src/simulators"
cp -rf $GITHUB_WORKSPACE/* /usr/src/simulators
#ls /usr/src/simulators/*/**

# run docs
cd /usr/src/simulators
#ls */**
npm run installDocs
npm run build --if-present
npm run docs --if-present
rm -Rf node_modules

#echo "$ONE_DOMAIN_NAME"

#Deploy Vars
ONE_SSH_HOST="ssh.$ONE_DOMAIN_NAME"
if [ -n "$TPO_PATH" ]; then
    DIR_PATH="$TPO_PATH"
else
    DIR_PATH="simulators"
fi

if [ -n "$TPO_SRC_PATH" ]; then
    SRC_PATH="$TPO_SRC_PATH"
else
    SRC_PATH="./"
fi


ONE_SSH_USER="$ONE_DOMAIN_NAME"@ssh."$ONE_DOMAIN_NAME"
ONE_DESTINATION="$ONE_SSH_USER":/../../www/"$DIR_PATH"

echo "SRC: $SRC_PATH"
echo "DEST: $ONE_DESTINATION"

# Setup our SSH Connection & use keys
mkdir -p "$SSH_PATH"
if [ ! -s "$KNOWN_HOSTS_PATH" ]; then
  ssh-keyscan -t rsa "$ONE_SSH_HOST" >> "$KNOWN_HOSTS_PATH"
  #echo "***known hosts*************************"
  #cat "$KNOWN_HOSTS_PATH"
fi

# Deploy via SSH
echo "\n\nrsync -e \"ssh -v -p 22 -i ${ONE_SSH_KEY_PRIVATE_PATH} -o StrictHostKeyChecking=no\" -a --out-format=\"%n\" --exclude=\".*\" $SRC_PATH $ONE_DESTINATION"
rsync -e "ssh -v -p 22 -i ${ONE_SSH_KEY_PRIVATE_PATH} -o StrictHostKeyChecking=no" -a --out-format="%n" --exclude=".git*" "$SRC_PATH" "$ONE_DESTINATION"

# Clear cache
echo "\n\nssh -v -p 22 -i ${ONE_SSH_KEY_PRIVATE_PATH} -o StrictHostKeyChecking=no $ONE_SSH_USER \"cache-purge\""
ssh -v -p 22 -i ${ONE_SSH_KEY_PRIVATE_PATH} -o StrictHostKeyChecking=no $ONE_SSH_USER "cache-purge"

echo "\n\nSUCCESS: Site has been deployed and cache has been flushed."