# Hyperledger samples

## Overview

This is a "blockchat" service based on Hyperledger Fabric 1.0. The service illustrates how to use blockchain as a reliable, non-repudiable distributed "log" service for critical communication. The demo is created by experts of [Quanopt Ltd.](http://quanopt.com/)

## Note

This is a filtered snapshot of our internal repo. If you've not seen the link during a presentation, the project might seem to contain a bit of slack here and there -- this is mostly because it's a filtered version with lots of extra components removed. We've done a quick cleanup, but might've missed a few parts.

The current version is mainly to be used on Ubuntu 16.04. Ubuntu 17.10 is tested, and is a viable option with a few modifications to the setup script.

## Setup

Install git and clone the repository *in the home folder* of your user, in case you haven't already. Run setup.sh in the root directory of the repository -- sudo is used, so run any command with sudo beforehand to cache the access rights (few minutes usually).

The setup script should install all necessary software, and now you're all set to start.

## Starting the Messenger sample

All subsequent commands must be executed from the specified folder, in a separate terminal.

* Start the network and the backend by running demoStart.sh from the messeger-backend directory
* There's a sporadic error upon first start, so if that happened, start demoStart.sh once more (will be debugged soon)
* Start the messenger-frontend by running npm start from the messenger-frontend directory
* Connect to the messenger frontend by opening http://localhost:8080
