var azure = require('azure'),
    ipp = require('ipp'),
    serviceBusService,
    errorCounter = 0,
    isVerbose = false,
    printer,
    maxErrorCount = 10,
    receiveTimeoutInSeconds = 60;

if (!process.env.sbConnectionString) {
    console.error('Set the environment variable sbConnectionString to a value like \'Endpoint=sb://xxxxx-ns.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=xxxxxxxxxxxxxxxxxx\'');
    process.exit(1);
}

if (!process.env.queueName) {
    console.error('Set the environment variable queueName to a value like \'standard\'');
    process.exit(1);
}

if (!process.env.printer) {
    console.error('Set the environment variable printer to a value like \'http://localhost:631/printers/lp\'');
    process.exit(1);
}

if (process.env.maxErrorCount) {
    maxErrorCount = parseInt(process.env.maxErrorCount);
    process.exit(1);
}

if (process.env.receiveTimeoutInSeconds) {
    receiveTimeoutInSeconds = parseInt(process.env.receiveTimeoutInSeconds);
    process.exit(1);
}

if (process.argv.indexOf('-v') !== -1) {
    isVerbose = true;
}

printer = ipp.Printer(process.env.printer);

serviceBusService = azure.createServiceBusService(process.env.sbConnectionString);

function handleError(err) {
    errorCounter++;
    console.error('Error: ' + JSON.stringify(err));

    if (errorCounter < maxErrorCount) {
        startMessageReception();
    } else {
        console.error('Too many errors');
        process.exit(1);
    }
}

function startMessageReception() {

    setTimeout(() => {

        if (isVerbose) {
            console.log('try to receive message');
        }
        serviceBusService.receiveQueueMessage(process.env.queueName, {
            isPeekLock: true,
            timeoutIntervalInS: receiveTimeoutInSeconds
        }, (error, message) => {
            if (error) {

                if (error === 'No messages to receive') {

                    if (isVerbose) {
                        console.log('No messages to receive');
                    }

                    startMessageReception();

                } else {
                    handleError(error);
                }
            } else {
                // Message received
                if (isVerbose) {
                    console.log('message received: "' + JSON.stringify(message) + '"');
                    //console.log('body received:\n' + Hexdump.dump(message));
                }

                if (message && message.customProperties && message.customProperties.jobname) {

                    var jobName = typeof message.customProperties.jobname === 'string' ? message.customProperties.jobname : 'NoName';
                    console.log('Print job received: "' + jobName + '"');

                    var attribs = {
                        "requesting-user-name": 'AltirosAzureCloudPrinter',
                        "job-name": jobName,
                        "document-format": "application/octet-stream"
                    };

                    if (isVerbose) {
                        console.log('attribs: "' + JSON.stringify(attribs) + '"');
                    }

                    var data = new Buffer(message.body, 'base64');

                    var msg = {
                        "operation-attributes-tag": attribs,
                        data: data
                    };

                    printer.execute("Print-Job", msg, (err, res) => {

                        if (!err && res) {

                            if (isVerbose) {
                                console.log(res);
                            }

                            // Message deleted
                            serviceBusService.deleteMessage(message, deleteError => {
                                if (deleteError) {
                                    handleError(deleteError);
                                } else {
                                    if (isVerbose) {
                                        console.log('message deleted');
                                    }
                                    startMessageReception();
                                }
                            });
                        } else {
                            handleError(err);
                        }

                    });
                }
            }
        });
    }, 0);
}

startMessageReception();
