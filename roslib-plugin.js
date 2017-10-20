
var RoslibPlugin = function (openmct){
    var ros = new ROSLIB.Ros({
        url: 'ws://localhost:9090'
    })

    return function install (openmct){
        openmct.ros = ros;
        console.log(openmct.ros);
    };
    
    
};
