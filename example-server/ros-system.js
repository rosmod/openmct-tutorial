/*
 Ros.js uses roslib.js to connect to a rosbridge instance and provide telemetry.
*/

var test = require('./rosTopicsList');


function RosSystem(ros, rosTopicsList) {
    var self = this;
    console.log(test);

    self.rosTopicsList = rosTopicsList;
    self.ros = ros;
    console.log(self.rosTopicsList);
    console.log(self.ros);
    self.subscribers = [];
    self.listeners = [];

    Object.keys(rosTopicsList).forEach( function(topic) {
        self.subscribers.push(new ROSLIB.Topic({
            ros : self.ros,
            name : topic,
            messageType : rosTopicsList(topic)
        }));
    });

    self.subscribers.forEach(function(s){
        s.subscribe(function (message){
            console.log('Recevied message on ' + s.name + ': ' +  message.data);
            var timestamp = Date.now();
            var id = s.name;
            var state = { timestamp: timestamp, value: message.data, id: s.name};    
            self.notify(state);
        });
    });

};

RosSystem.prototype.notify = function (point) {
    var self = this;
    self.listeners.forEach(function (l) {
        l(point);
    });
};

RosSystem.prototype.listen = function (listener) {
    var self = this
    self.listeners.push(listener);
    return function () {
        self.listeners = self.listeners.filter(function (l) {
            return l !== listener;
        });
    }.bind(self);
};

module.exports = function () {
    return new RosSystem()
};
