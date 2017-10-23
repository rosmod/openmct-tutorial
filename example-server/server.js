/**
 * Basic implementation of a history and realtime server.
 */

var ROSLIB = require('roslib');
var RosSystem = require('./ros-system');
var RealtimeServer = require('./realtime-server');
var StaticServer = require('./static-server');

var expressWs = require('express-ws');
var app = require('express')();
expressWs(app);

var url = 'localhost';
var rosbridgeport = '9090'; 

for (var i=2; i < process.argv.length; i++) {
    var arg = process.argv[i];

    if (arg == '--port') {
        i++;
        rosbridgeport = process.argv[i];
    }
    else if (arg == '--url') {
        i++;
        url = process.argv[i];
    }
}

var ros = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
});

ros.on('connection', function() {
    console.log('Connected to rosbridge websocket server.');
});

ros.on('error', function(error) {
    console.log('Error connecting to rosbridge websocket server: ', error);
});

ros.on('close', function() {
    console.log('Connection to rosbridge websocket server closed.');
});

var rosTopicsList = require('./rosTopicsList');
console.log(rosTopicsList);
console.log(ros);

var rossystem = new RosSystem(ros, rosTopicsList);
var realtimeServer = new RealtimeServer(rossystem);
var staticServer = new StaticServer();

app.use('/realtime', realtimeServer);
app.use('/', staticServer);

var port = process.env.PORT || 8085

app.listen(port, function () {
    console.log('Open MCT hosted at http://localhost:' + port);
    console.log('Realtime hosted at ws://localhost:' + port + '/realtime');
});
