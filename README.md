# Altiros Azure Cloud Printer

## Install Nodejs

Go to the Node.JS web site and follow the installation rules for your operating system.

## Install CUPS

`sudo apt install cups`

## Install all the printers you need in CUPS

### For example: Add a Network Printer:
`sudo lpadmin -p mynetworkprinter -E -v socket://192.168.0.10:9100`

### For example: Add a Dummy Printer:
`sudo lpadmin -p dummy -E -v file:///dev/null`

## Create a user
`sudo useradd -m cloudprn`

## Login as new user
`sudo su - cloudprn`

## Install the npm package
`npm i altiros-azure-cloud-printer`

## Create a shell script for each printer queue you want to print from

For example: Create the file `/home/cloudprn/cloudprn-standard.sh`

Adjust the settings for `sbConnectionString`, `queueName` and `printer`!

```
#!/bin/bash

export sbConnectionString='Endpoint=sb://xxxxxxxxxxxxxxxx.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=xxxxxxxxxx='
export queueName='standard'
export printer='http://localhost:631/printers/dummy'
logfolder=/home/cloudprn/logs

[ -d ${logfolder} ] || mkdir ${logfolder}

/usr/bin/node /home/cloudprn/node_modules/altiros-azure-cloud-printer/app.js -v >> ${logfolder}/${queueName}.log 2>&1 &
```
## Make each shell script executable

`chmod +x /home/cloudprn/cloudprn-standard.sh`

## Create a service manifest for each printer (with sudo) 

For example: Create the file `/etc/systemd/system/cloudprn-standard.service`

```
[Unit]
Description=cloudprn-standard

[Service]
Type=forking
User=cloudprn
ExecStart=/home/cloudprn/cloudprn-standard.sh
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

## Enable and start the services for each printer (with sudo) 

`sudo systemctl enable cloudprn-standard`

`sudo systemctl start cloudprn-standard`
