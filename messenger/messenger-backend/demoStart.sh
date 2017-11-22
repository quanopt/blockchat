#!/bin/bash

docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
docker pull hyperledger/fabric-ccenv:x86_64-1.0.0  # Needed for fast enough CC docker deploy

rm -f ./users.json
rm -f ./started.json

echo '{"started": false}' > started.json

docker-compose -f ./network/docker-compose.yaml up -d
npm start
