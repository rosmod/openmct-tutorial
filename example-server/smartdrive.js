/*
 Smartdrive.js simulates a small spacecraft generating telemetry.
*/

function Smartdrive() {
    this.state = {
        "case.speed": 0,
        "case.acceleration": 0,
        "motor.speed": 0,
        "motor.acceleration": 0,
        "smartdrive.telemetry", "OFF"
    };
    this.history = {};
    this.listeners = [];
    Object.keys(this.state).forEach(function (k) {
        this.history[k] = [];
    }, this);

    setInterval(function () {
        this.updateState();
        this.generateTelemetry();
    }.bind(this), 1000);

    console.log("Smartdrive telemetry initialized");
    console.log("Press Enter to toggle telemetry stream.");

    process.stdin.on('data', function () {
        this.state['smartdrive.telemetry'] =
            (this.state['smartdrive.telemetry'] === "OFF") ? "ON" : "OFF";
        this.state['comms.recd'] += 32;
        console.log("Telemetry Stream:  " + this.state["smartdrive.telemetry"]);
        this.generateTelemetry();
    }.bind(this));
};

Smartdrive.prototype.updateState = function () {

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
        this.state["comms.sent"] += JSON.stringify(state).length;
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
