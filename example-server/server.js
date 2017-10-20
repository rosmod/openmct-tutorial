/**
 * Basic implementation of a history and realtime server.
 */

var SmartDrive = require('./smartdrive');
var RealtimeServer = require('./realtime-server');
var StaticServer = require('./static-server');

var expressWs = require('express-ws');
var app = require('express')();
expressWs(app);

var serialPort = '/dev/ttyUSB0';
var baudRate = 115200;

for (var i=2; i < process.argv.length; i++) {
    var arg = process.argv[i];

    if (arg == '--port') {
        i++;
        serialPort = process.argv[i];
    }
    else if (arg == '--baudrate') {
        i++;
        baudRate = int(process.argv[i]);
    }
}

//var smartDrive = new SmartDrive(serialPort, baudRate);
//var realtimeServer = new RealtimeServer(smartDrive);
var staticServer = new StaticServer();

//app.use('/realtime', realtimeServer);
app.use('/', staticServer);

var port = process.env.PORT || 8085

app.listen(port, function () {
    console.log('Open MCT hosted at http://localhost:' + port);
    console.log('Realtime hosted at ws://localhost:' + port + '/realtime');
});
