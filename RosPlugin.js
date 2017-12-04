/**
 * Plugin to interface with a realtime server running roslib.js, that itself is interfacing rosbridge ros component
*/
/* global require, module */

var RosPlugin = function (openmct){
    return function install (openmct){
        // open websocket to roslib server
        var telemetrysocket = new WebSocket(location.origin.replace(/^http/, 'ws') + '/realtime/');
        var listener = {};
        var dictionaryPromise = Q.defer();

        telemetrysocket.onmessage = function (event) {
            var message = JSON.parse(event.data);
            console.log('Received telemetry message of type: ' + message.type);
            console.log('Message contents: ');
            console.log(message.value);

            if(message.type){
                handler = handlers[message.type];
                if(handler){
                    handler(message.value);
                }
            }
        };

        telemetrysocket.onopen = function() {
          telemetrysocket.send('dictionary');
        };

        var handlers = { //handlers for telemetry mesages
            dictionary: function(dict) {
                //console.log("dictionary resolved!");
                //console.log(dict);
                dictionaryPromise.resolve(dict);
            },
            point: function(point) {
                if (listener[point.id]) {
                    listener[point.id](point);
                }

            }
        }

        // define dictionary, and object providers
        function getDictionary() {
            
            //console.log("Blargh");
            //console.log(dictionaryPromise);
            return dictionaryPromise.promise;
            /*
            return http.get('/dict.json')
                .then(function (result) {
                    return result.data;
                });
            */
        };

        var objectProvider = {
            get: function (identifier) {
                return getDictionary().then(function (dictionary) {
                    //console.log("object provider's dictionary");
                    //console.log(dictionary);
                    if (identifier.key === 'rossystem') {
                        return {
                            identifier: identifier,
                            name: dictionary.name,
                            type: 'folder',
                            location: 'ROOT'
                        };
                    } else {
                        var topic = dictionary.topics.filter(function (m) {
                            return m.key === identifier.key;
                        })[0];
                        //console.log("Identifier Key: " + identifier.key);
                        //console.log("Topic: " + topic)
                        return {
                            identifier: identifier,
                            name: topic.name,
                            type: 'ros.telemetry',
                            telemetry: {
                                values: topic.values
                            },
                            location: 'ros.taxonomy:rossystem'
                        };
                    }
                });
            }
        };

        var compositionProvider = {
            appliesTo: function (domainObject) {
                return domainObject.identifier.namespace === 'ros.taxonomy' &&
                    domainObject.type === 'folder';
            },
            load: function (domainObject) {
                return getDictionary()
                    .then(function (dictionary) {
                        return dictionary.topics.map(function (m) {
                            return {
                                namespace: 'ros.taxonomy',
                                key: m.key
                            };
                        });
                    });
            }
        };

        /* set up telemetry provider */ 

        
        var telemetryProvider = {
            supportsSubscribe: function (domainObject) {
                return domainObject.type === 'ros.telemetry';
            },
            subscribe: function (domainObject, callback) {
                listener[domainObject.identifier.key] = callback;
                telemetrysocket.send('subscribe ' + domainObject.identifier.key);
                return function unsubscribe() {
                    delete listener[domainObject.identifier.key];
                    telemetrysocket.send('unsubscribe ' + domainObject.identifier.key);
                };
            }
        };
        
        /* install all components into openmct object */
                
        openmct.objects.addRoot({
            namespace: 'ros.taxonomy',
            key: 'rossystem'
        });

        openmct.objects.addProvider('ros.taxonomy', objectProvider);

        openmct.composition.addProvider(compositionProvider);

        openmct.types.addType('ros.telemetry', {
            name: 'Ros Telemetry Point',
            description: 'Ros telemetry provide by roslib.',
            cssClass: 'icon-telemetry'
        });

        openmct.telemetry.addProvider(telemetryProvider);
        
    };
};
