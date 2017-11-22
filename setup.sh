#!/bin/bash

# Curl and other deps...
sudo apt update
sudo apt upgrade
# Yes, this contains some extras
sudo apt install -y curl build-essential libssl-dev libusb-1.0-0-dev swig cmake libconfuse-dev libboost-all-dev doxygen python-dev python-pip python-smbus
# Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
apt-cache policy docker-ce
sudo apt-get install -y docker-ce
sudo usermod -aG docker ${USER}
# Docker composer
sudo curl -o /usr/local/bin/docker-compose -L "https://github.com/docker/compose/releases/download/1.15.0/docker-compose-$(uname -s)-$(uname -m)"
sudo chmod +x /usr/local/bin/docker-compose
# Setting up env variables
echo "export HLBCBIN=/home/$USER/blockchat/fabric-bin/bin" >> ~/.bashrc
echo "export PATH=\$PATH:\$HLBCBIN" >> ~/.bashrc
source ~/.bashrc
# Node
curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt install nodejs
source ~/.profile
source ~/.bashrc
# NPM installs
cd ~/blockchat/messenger/messenger-frontend
npm i
cd ../messenger-backend
npm i
cd ~
