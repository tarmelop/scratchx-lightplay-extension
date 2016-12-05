(function(ext) {

    var PLUGIN_URL = 'http://localhost:8000';
    //Device UUID and Characteristics
    var UUID = "6e400001b5a3f393e0a9e50e24dcca9e";
    var RX = "6e400003b5a3f393e0a9e50e24dcca9e";
    var TX = "6e400002b5a3f393e0a9e50e24dcca9e";

    var PROTOCOL = {
        
        MOTOR: 1,
        LIGHT: 2,
        OTHER: 3,

        LIGHTCOMMAND: {
            SETCOLOR: 0,
            OFF: 1,
            FADECOLOR: 2,
            FADEOUT: 3,
            SETBRIGHTNESS: 4,
            SETFADESPEED: 5
        },
    
        MOTORCOMMAND: {
            THISWAY: 0,
            THATWAY: 1,
            OFF: 2,
            SETMOTORSPEED: 3
        },

        OTHERCOMMAND: {
            RESET: 0,
            STOPFADES: 1
        },
    
        CHANNEL: {
            ALL: 0,
            ONE: 1,
            TWO: 2,
            THREE: 3,
            MOTOR: 4
        }
    };

    var CHANNELS = ["all lights", "light 1", "light 2", "light 3"];

    var COLORS = {
        red: [15, 255, 0, 0, 0, 0, 0, 0],
        orange: [15, 255, 7, 255 ,0, 0, 0, 0],
        yellow: [15, 255, 15, 255 ,0, 0, 7, 255],
        green: [0, 0, 15, 255 ,0, 0, 0, 0],
        blue: [0, 0, 0, 0, 15, 255 ,0, 0],
        purple: [15, 255, 0, 0, 15, 255 ,0, 0],
        white: [0, 0 ,0, 0, 0, 0, 15, 255],
        surprise: null
    };

    var MOTOR_SPEEDS = {
        slow: 5,
        faster: 7,
        fastest: 10
    };

    var FADE_TIMEOUTS = {
        slow: 10100, 
        faster: 5100,
        fastest: 1100
    };


    var BRIGHTNESS = {
        low: 1,
        medium: 5,
        high: 9
    };
    

    var device = null;
    var current_colors = [null, null, null];

    ext._shutdown = function () {
        if (device) {
            if (device.is_open()){
                device.disconnect();
            }
            device = null;
        }
    }

    ext._getStatus = function () {

        if (device) {
            if (device.is_open()) {
                return {status: 2, msg: 'Lightplay connected'};
            }
            else {
                return {status: 1, msg: 'Lightplay connecting...'};
            }
        }
        else {
            return {status: 1, msg: 'Lightplay disconnected'};
        }
    };

    ext._deviceConnected = function (dev) {
        if (device) return;
        console.log(dev.ext_name + " gotten by extension");
        device = dev;
        device.open(function (d) {
            if (device == d) {
                //device.set_sensor_handler(null);
            }
            else if (d) {
                console.log('Received open callback for wrong device');
            }
            else {
                console.log('Opening device failed');
                device = null;
            }
        });
    };

     ext._deviceRemoved = function (dev) {
        if (device != dev) return;
        device = null;
    };


    function compile (type, channel, action){
        return (type << 5) | (channel << 3) | action;
    }

    function send_to_channel(type, channel, action) {
        
        if (CHANNELS.indexOf(channel) >= 0) {
            channel = CHANNELS.indexOf(channel);
        } else {
            channel = 0;
        }

        device.emit('write', {uuid: TX, bytes: [compile(type, channel, action)]});
    }

    function send_color(color, channel){
        
        if (color == 'surprise'){
            var keys = Object.keys(COLORS);
            color = keys[Math.floor(Math.random() * (keys.length - 1))];
        }    
        
        device.emit('write', {uuid: TX, bytes: COLORS[color]});

        // update current colors
        if (channel == 0){
            current_colors[0] = current_colors[1] = current_colors [2] = color;
        } else {
            current_colors[channel-1] = color;
        }

    }

    ext.set_color = function(channel, color, callback) {
        send_to_channel(PROTOCOL.LIGHT, channel, PROTOCOL.LIGHTCOMMAND.SETCOLOR, color);
        send_color(color);
        if (callback) callback();
    };

    ext.send_off = function(channel, callback) {
        send_to_channel(PROTOCOL.LIGHT, channel, PROTOCOL.LIGHTCOMMAND.OFF);
        if (callback) callback();
    };

    /*

    ext.send_toggle = function(channel, callback) {
        send_to_channel(PROTOCOL.LIGHT, channel, PROTOCOL.LIGHTCOMMAND.TOGGLE, callback);
    };

    ext.send_motor_on = function(callback) {
        send_to_channel(PROTOCOL.MOTOR, 0, PROTOCOL.MOTORCOMMAND.ON, callback);
    };

    ext.send_motor_off = function(callback) {
        send_to_channel(PROTOCOL.MOTOR, 0, PROTOCOL.MOTORCOMMAND.OFF, callback);
    };

    ext.send_motor_toggle = function(callback) {
        send_to_channel(PROTOCOL.MOTOR, 0, PROTOCOL.MOTORCOMMAND.TOGGLE, callback);
    };

    ext.set_speed = function(level, callback) {
        send_to_channel(PROTOCOL.MOTOR, 0, MOTOR_SPEEDS[level], callback);
    };

    ext.send_motor_rev = function(callback) {
        send_to_channel(PROTOCOL.MOTOR, 0, PROTOCOL.MOTORCOMMAND.REVERSE, callback);
    };

    ext.poll_sensor = function(sensor, callback) {
        if (descriptor.menus.sensors.indexOf(sensor) >= 0) {
            var sensorID = descriptor.menus.sensors.indexOf(sensor) / 2;
            var action = descriptor.menus.sensors.indexOf(sensor) % 2;
            device.once(RX, function(data){
                callback({
                predicate: "predicate",
                });
            });
        }
    };

    ext.predicate = function(sensor, evt){
        return true;
    };

    ext.set_power = function(channel, level, callback) {
        send_to_channel(PROTOCOL.LIGHT, channel, BRIGHTNESS[level], callback);
    };

    ext.set_fade_speed = function(speed, callback) {
        ext.fade_speed = FADE_TIMEOUTS[speed];
        send_to_channel(PROTOCOL.OTHER, FADE_SPEEDS[speed], PROTOCOL.OTHERCOMMAND.FADE, callback);
    };

    ext.set_rgb_color = function(channel, red, green, blue, white, callback) {
        send_to_channel(PROTOCOL.LIGHT, channel, PROTOCOL.OTHERCOMMAND.RGB);
        device.emit('write', {uuid: TX, bytes: [red, green, blue]});
        if (callback)
            callback()
    };

    ext.fade_in = function(channel, callback) {
        send_to_channel(PROTOCOL.LIGHT, channel, PROTOCOL.LIGHTCOMMAND.FADE_IN, function(data) {
            setTimeout(callback, ext.fade_speed, data);
        });

    };

    ext.fade_out = function(channel, callback) {
        send_to_channel(PROTOCOL.LIGHT, channel, PROTOCOL.LIGHTCOMMAND.FADE_OUT, function(data) {
            setTimeout(callback, ext.fade_speed, data);
        });
    };

    ext.set_color = function(channel, color, callback) {
        send_to_channel(PROTOCOL.SET, channel, COLORS[color], callback);
    };

    ext.fade_color = function(channel, color, callback) {
        send_to_channel(PROTOCOL.FADE_TO, channel, COLORS[color], function(data) {
            setTimeout(callback, ext.fade_speed, data);
        });
    };

    */

    var descriptor = {
        blocks: [
            // Light cmds
            //['w', 'turn on  %m.lights', 'send_on', "all lights"],
            //['w', 'toggle  %m.lights', 'send_toggle', "all lights"],
            ['w', 'set  color of %m.lights to %m.colors', 'set_color', "all lights", "red"],
            ['w', 'turn off  %m.lights', 'send_off', "all lights"],
           /* ['w', 'fade %m.lights to %m.colors', 'fade_color', "all lights", "red"],
            ['w', 'fade in %m.lights', 'fade_in', "all lights"],
            ['w', 'fade out %m.lights ', 'fade_out', "all lights"],
            ['w', 'set  fade speed to %m.speeds', 'set_fade_speed', 'slow'],
            //['w', 'set  %m.lights color to %n %n %n', 'set_rgb_color', "all lights", '100', '100', '100'],
            ['w', 'set  brightness of %m.lights to %m.power', 'set_power', "all lights", 'high'],
            // Motor cmds
            ['w', 'turn on motor', 'send_motor_on'],
            ['w', 'turn off motor', 'send_motor_off'],
            ['w', 'reverse motor direction', 'send_motor_rev'],
            ['w', 'toggle motor', 'send_motor_toggle'],
            ['w', 'set motor speed %m.speeds', 'set_speed', "slow"],
            // Sensor cmds
            ['H', 'when %m.sensors', 'poll_sensor', "sensor clips are connected"],*/
        ],

        url: 'https://github.com/tarmelop/scratchx-lightplay-extension',
        menus: {
            power: ['low', 'medium', 'high'],
            colors: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'white', 'surprise'],
            lights: ["all lights", "light 1", "light 2", "light 3"],
            speeds: ["slow", "faster", "fastest"],
            sensors: ["sensor clips are connected", "sensor clips are disconnected", "light shines on sensor", "shadow falls on sensor"]
        }
    };

    // Register the extension..
    var device_info = {uuid: [UUID]};
    var rx = {}
    rx[RX] = {notify: true},
    device_info["read_characteristics"] = rx;
    var tx = {};
    tx[TX] = {};
    device_info["write_characteristics"] = tx;
    ScratchExtensions.register('Lightplay', descriptor, ext, { info: device_info, type: 'ble' });

})({});