/*
 Smartdrive.js simulates a small spacecraft generating telemetry.
*/

var SerialPort = require('serialport');
var ROSLIB = require('roslib');

console.log(ROSLIB);

function Smartdrive(portName = '/dev/ttyUSB0', baudRate=115200) {
    this.state = {
        "case.speed": 0,
        "case.acceleration": 0,
        "motor.speed": 0,
        "motor.acceleration": 0,
        "smartdrive.telemetry": "OFF"
    };

    this.history = {};
    this.listeners = [];
    Object.keys(this.state).forEach(function (k) {
        this.history[k] = [];
    }, this);

    setInterval(function () {
        this.generateTelemetry();
    }.bind(this), 100);

    this.port = new SerialPort(portName, {
        baudRate: baudRate
    });

    this.port.on('error', function(err) {
        console.error('ERROR: '+err.message);
    });

    var self = this;
    this.port.on('data', function(data) {
        self.updateState(data);
    });    

    console.log("Smartdrive telemetry initialized");
    console.log("Press Enter to toggle telemetry stream.");

    process.stdin.on('data', function () {
        this.state['smartdrive.telemetry'] =
            (this.state['smartdrive.telemetry'] === "OFF") ? "ON" : "OFF";
        console.log("Telemetry Stream:  " + this.state["smartdrive.telemetry"]);
        this.generateTelemetry();
    }.bind(this));
};

Smartdrive.prototype.updateState = function (data) {
    var re = /\s*,\s*/;
    if (data && data.length > 0) {
        values = data.toString().split(re);
        if (values.length == 4) {
            this.state['case.speed']         = parseFloat(values[0]);
            this.state['case.acceleration']  = parseFloat(values[1]);
            this.state['motor.speed']        = parseFloat(values[2]);
            this.state['motor.acceleration'] = parseFloat(values[3]);
        }
    }
};

/**
 * Takes a measurement of spacecraft state, stores in history, and notifies 
 * listeners.
 */
Smartdrive.prototype.generateTelemetry = function () {
    var timestamp = Date.now(), sent = 0;
    Object.keys(this.state).forEach(function (id) {
        var state = { timestamp: timestamp, value: this.state[id], id: id};
        this.notify(state);
        this.history[id].push(state);
    }, this);
};

Smartdrive.prototype.notify = function (point) {
    this.listeners.forEach(function (l) {
        l(point);
    });
};

Smartdrive.prototype.listen = function (listener) {
    this.listeners.push(listener);
    return function () {
        this.listeners = this.listeners.filter(function (l) {
            return l !== listener;
        });
    }.bind(this);
};

module.exports = function () {
    return new Smartdrive()
};
