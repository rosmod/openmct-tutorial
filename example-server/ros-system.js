/*
  Ros.js uses roslib.js to connect to a rosbridge instance and provide telemetry.
*/

var ROSLIB = require('roslib');
var Q = require('q');
var fs = require('fs');


function RosSystem(rosurl, rosbridgeport) {
    var self = this;
    var rosurl = 'ws://' + rosurl + ':' + rosbridgeport;
    self.subscribers = [];
    self.listeners = [];
    
    self.connectRos(rosurl)
        .then(function(){
            self.getDictionary()
                .then(function(dict){
                    self.dictionary = dict;
                    console.log("Dictionary: ");
                    console.log(self.dictionary);
                    fs.writeFile('dict.json', JSON.stringify(self.dictionary, null, 2) , 'utf-8');
                });
        });
    /*
      self.subscriber.forEach(function(s){
      s.subscribe(function (message){
      console.log('Recevied message on ' + s.name + ': ' +  message.data);
      var timestamp = Date.now();
      var id = s.name;
      var state = { timestamp: timestamp, value: message.data, id: s.name};
      console.log(state);
      self.notify(state);
      });
      })*/
    

    

};

RosSystem.prototype.notify = function (point) {
    var self = this;
    self.listeners.forEach(function (l) {
        l(point);
    });
};

RosSystem.prototype.listen = function (listener) {
    var self = this;
    self.listeners.push(listener);
    return function () {
        self.listeners = self.listeners.filter(function (l) {
            return l !== listener;
        });
    }.bind(self);
};

RosSystem.prototype.connectRos = function (rosurl){
    var self = this;
    var deferred = Q.defer();
    self.ros = new ROSLIB.Ros({
        url : rosurl
    });

    self.ros.on('connection', function() {
        console.log('Connected to rosbridge websocket server at ' + rosurl );
        deferred.resolve();
    });

    self.ros.on('error', function(error) {
        console.log('Error connecting to rosbridge websocket server at ' + rosurl +' : ', error);
        deferred.reject();
    });

    self.ros.on('close', function() {
        console.log('Connection to rosbridge websocket server at ' + rosurl + ' closed.');
    });
    return deferred.promise;
};

RosSystem.prototype.parseDetails = function(details) {
    var self = this;
    var parsed = [];

    var formatConversionMap = {
        "uint64": "int",
        "int64": "int",
        "uint32": "int",
        "int32": "int",
        "uint16": "int",
        "int16": "int",
        "uint8": "int",
        "int8": "int",

        "float32": "float",
        "float64": "float",

        "byte": "byte",
        "string": "string",
    };

    details.map(function(detail) {
        for (var i=0; i<detail.fieldtypes.length; i++) {
            var fieldtype = detail.fieldtypes[i];
            var name = detail.fieldnames[i];
            var converted = formatConversionMap[fieldtype];
            if (converted != undefined) {
                var value = {
                    key: name,
                    name: name,
                    units: "None",
                    format: converted,
                    hints: {
                        range: 1,
                    }
                };
                parsed.push(value);
            }
        }
    });

    var timeval = {
        key: "utc",
        source: "timestamp",
        name: "Timestamp",
        format: "utc",
        hints: {
            domain: 1
        }
    };
    parsed.push(timeval);

    console.log("PARSED DETAILS");
    console.log(parsed);

    return parsed;
};

RosSystem.prototype.getDictionary = function(){
    var self = this;
    function getTopics() {
        var deferred = Q.defer();
        self.ros.getTopics(function(topics) {
            deferred.resolve(topics);
        });
        return deferred.promise;
    };

    dict = {
        "name" : "Ros System",
        "key" : "rs",
        "topics" : []
    };
    
    return getTopics()
        .then(function(topics){
            var tasks = topics.map(function(topic){
                var deferred = Q.defer();
                var topicEntry = {
                    "name" : topic,
                    "key" : topic,
                    "values" : []
                };
                self.ros.getTopicType(topic, function(type){
                    self.ros.getMessageDetails(type, function(details){
                        // return the details
                        deferred.resolve(details);
                    });
                })
                return deferred.promise
                    .then(function(details) {
                        // parse details
                        console.log("GOT DETAILS:");
                        console.log(details);
                        topicEntry.values = self.parseDetails(details);
                        return topicEntry;
                    });
            });
            return Q.all(tasks)
                .then(function(topicEntryArray) {
                    dict.topics = topicEntryArray;
                    return dict;
                });
        })


    /*
      return getTopics()
      .then(function(topics) { //get topic types
      var tasks = topics.map(function(topic) {
      dict.topics.push({
      "name" : topic,
      "key" : topic,
      "values": []
      });
      var deferred = Q.defer();
      self.ros.getTopicType(topic, function(type) {
      deferred.resolve(type);
      });
      return deferred.promise;
      });
      return Q.all(tasks);
      })
      .then(function(topicTypes) { //get message details for topic type
      var tasks = topicTypes.map(function(topicType) {
      var deferred = Q.defer();
      self.ros.getMessageDetails(topicType, function(deets) {
      
      deferred.resolve();
      });
      return deferred.promise;
      });
      return Q.all(tasks);
      })
      .then(function() { //assemble dictionary
      
      return dict;
      });*/

};



module.exports = function (rosurl, rosbridgeport) {
    return new RosSystem(rosurl, rosbridgeport )
};
