app.factory('bridge', ['$window', function(win) {
	var fs = require('fs');
	var net = require('net');
	var p = require("node-protobuf") 
	var util = require('util')
	var EventEmitter = require("events").EventEmitter;
	var pb = new p(fs.readFileSync("messages.desc"))

	var localBridge = {
		connect: function(callback) {
			throw "Not implemented";
		}
	}
	var remoteBridge = {
		connect: function(callback) {
			Device = function(socket){
				EventEmitter.call(this);
				this.disconnect = function(){
					this.emit('close');
					socket.end();
				}
				this.start = function() {
					var start_message = pb.serialize({action: "START"}, "DeviceControl");
					socket.write(start_message);
					this.emit('start');
				}

				this.stop = function() {
					var stop_message = pb.serialize({action: "STOP"}, "DeviceControl");
					socket.write(stop_message);
					this.emit('stop');
				}

				this.set = function(id, config) {
					var msg = pb.serialize({action: "SET_CONFIG", config: config}, "DeviceControl");
					socket.write(msg);
				}
			};
			util.inherits(Device, EventEmitter);

			var deviceDetected = false;
			var configReceived = false;
			var client = new net.Socket();
			var dev_handle = new Device(client);
			dev_handle.on('connect', function() {
				var config = pb.serialize({action: "GET_CONFIG"}, "DeviceControl");
				client.write(config);
			});

			client.connect(5000, '127.0.0.1', function() {
				console.log('Connected');
			});

			client.on('readable', function() {
			  var chunk, msg_len;
			  while (null !== (chunk = client.read(4))) {
				msg_len = chunk.readUInt16LE();
				data = client.read(msg_len);    
				if (!deviceDetected) {
					try {
						var device_ident = pb.parse(data, "DeviceInfo")
					}  catch (e) {
						console.log("Invalid device identifier: " + e);
						dev_handle.emit('close');
					}

					deviceDetected = true;
					dev_handle.emit('connect', device_ident);
				} else if(!configReceived) {
					try {
						var configuration = pb.parse(data, "DeviceConfiguration")
						dev_handle.emit('configuration', configuration);
					} catch (e) {
						console.log("Invalid configuration")
						dev_handle.emit('close');
					}
					configReceived = true;
				} else {
					// Receive sensor updates
					var update = pb.parse(data, "SensorUpdate");
					dev_handle.emit('update', update);
				}
			  }
			});
			 
			client.on('error', function() {
				console.log('Disconnected.');
				dev_handle.emit("close");

			});

			client.on('close', function() {
				console.log('Connection closed.');
				dev_handle.emit("close");
			});

			callback(dev_handle);
		}
	}

	return {
		createLocalBridge: function(){
			return localBridge;
		},
		createRemoteBridge: function(){
			return remoteBridge;
		}
	}

}]);