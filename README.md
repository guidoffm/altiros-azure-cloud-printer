# Altiros Azure Cloud Printer

## Install Node.js®

Go to the Node.js® web site https://nodejs.org and follow the installation rules for your operating system.

## Install CUPS

`sudo apt install cups`

## Install all the printers you need in CUPS

### For example: Add a Network Printer:
`sudo lpadmin -p mynetworkprinter -E -v socket://192.168.0.10:9100`

### For example: Add a Serial Printer Connected Using a USB Serial Converter:
`sudo lpadmin -p myusbserialprinter -E -v serial:/dev/ttyUSB0?baud=9600+size=8+parity=none+flow=soft`

### For example: Add a Dummy Printer:
`sudo lpadmin -p dummy -E -v file:///dev/null`

## Run the Service with Docker

```
docker run -d \
-e sbConnectionString="Endpoint=sb://xxxxxxxxxxxxxxxx.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=xxxxxxxxxx=" \
-e queueName=standarddrucker \
-e printer='http://localhost:631/printers/dummy' \
--restart always \
--name altiros-azure-cloud-printer-standarddrucker \
altiros/rpi-altiros-azure-cloud-printer
```

## Run the Service without Docker

### Create a user
`sudo useradd -m cloudprn`

### Login as new user
`sudo su - cloudprn`

### Install the npm package
`npm i altiros-azure-cloud-printer`

### Create a shell script for each printer queue you want to print from

For example: Create the file `/home/cloudprn/cloudprn-standard.sh`

Adjust the settings for `sbConnectionString`, `queueName` and `printer`!

- Get the `sbConnectionString` and `queueName` values from Azure Portal https://portal.azure.com
- For `printer` use the CUPS URL for the printer you want to use, e.g. use `http://localhost:631/printers/mynetworkprinter` when you have named your printer `mynetworkprinter`. This is the `-p` option for the `lpadmin` command when you have created your printer.

```
#!/bin/bash

export sbConnectionString='Endpoint=sb://xxxxxxxxxxxxxxxx.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=xxxxxxxxxx='
export queueName='standard'
export printer='http://localhost:631/printers/mynetworkprinter'
logfolder=/home/cloudprn/logs

[ -d ${logfolder} ] || mkdir ${logfolder}

/usr/bin/node /home/cloudprn/node_modules/altiros-azure-cloud-printer/app.js -v >> ${logfolder}/${queueName}.log 2>&1 &
```
### Make each shell script executable

`chmod +x /home/cloudprn/cloudprn-standard.sh`

### Create a service manifest for each printer (with sudo) 

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

### Enable and start the services for each printer (with sudo) 

`sudo systemctl enable cloudprn-standard`

`sudo systemctl start cloudprn-standard`
