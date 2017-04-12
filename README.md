# Altiros Azure Cloud Printer

## Install Nodejs

## Install CUPS

### Add a Network Printer:
`sudo lpadmin -p mynetworkprinter -E -v socket://192.168.0.10:9100`

### Add a Dummy Printer:
`sudo lpadmin -p dummy -E -v file:///dev/null`

## Create a user
`sudo useradd -m cloudprn`

## Login as new user
`sudo su - cloudprn`

## Install the npm package
`npm i altiros-azure-cloud-printer`

## Create a shell script for each printer queue you want to print from

For example: Create the file /home/cloudprn/cloudprn-standard.sh
Adjust the settings for sbConnectionString, queueName and printer!

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

`chmod +x cloudprn-standard`

## Create a service manifest for each printer (with sudo) 

For example: Create the file /etc/systemd/system/cloudprn-standard.service

```
[Unit]
Description=cloudprnr-standard

[Service]
Type=forking
User=cloudprnr
ExecStart=/home/cloudprn/cloudprn-standard.sh
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

## Enable and start the services for each printer (with sudo) 

`sudo systemctl enable cloudprnr-standard`

`sudo systemctl start cloudprnr-standard`
