
 /*This program is free software: you can redistribute it and/or modify
 *it under the terms of the GNU General Public License as published by
 *the Free Software Foundation, either version 3 of the License, or
 *(at your option) any later version.
 *
 *This program is distributed in the hope that it will be useful,
 *but WITHOUT ANY WARRANTY; without even the implied warranty of
 *MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *GNU General Public License for more details.
 *
 *You should have received a copy of the GNU General Public License
 *along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function(ext) {

    var UUID = "a56ada00ed0911e59c970002a5d5c51b",
        COLOR_READ = "a56ada04ed0911e59c970002a5d5c51b";


    var device_info = {uuid: [UUID]};
    var rx = {};
    rx[COLOR_READ] = {notify: true};
    device_info["read_characteristics"] = rx;

    var connected = false;
    var socket = null;
    var device = null;
    var currentColor = [0, 0, 0];
    var colorChanged = false;

    ext._getStatus = function () {
        if (device) {
            if (device.is_open()) {
                return {status: 2, msg: 'Arduino connected'};
            }
            else {
                return {status: 1, msg: 'Arduino connecting...'};
            }
        }
        else {
            return {status: 1, msg: 'Arduino disconnected'};
        }
    };

    ext._deviceConnected = function (dev) {
        if (device) return;
        device = dev;
        listen();
        device.open(function (d) {
            if (device == d) {
                device.set_sensor_handler(null);
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

    ext.getCurrentColorRed = function() {
        return currentColor[0];
    };

    ext.getCurrentColorGreen = function() {
        return currentColor[1];
    };

    ext.getCurrentColorBlue = function() {
        return currentColor[2];
    };



    ext.colorChanged = function() {
        var retVal = colorChanged;
        colorChanged = false;
        return retVal;
    };


    function listen() {
        device.on(COLOR_READ, function(bytes){
            colorChanged = true;
            currentColor = bytes.data;
        });
    }

    ext._shutdown = function() {
      // TODO: Bring all pins down
      if (device) device.close();
      if (poller) clearInterval(poller);
      device = null;
    };
    
    // Check for GET param 'lang'
    var paramString = window.location.search.replace(/^\?|\/$/g, '');
    var vars = paramString.split("&");
    var lang = 'en';
    for (var i=0; i<vars.length; i++) {
      var pair = vars[i].split('=');
      if (pair.length > 1 && pair[0]=='lang')
        lang = pair[1];
    }

    var blocks = {
      en: [
        ['r', 'Current color red', 'getCurrentColorRed'],
        ['r', 'Current color green', 'getCurrentColorGreen'],
        ['r', 'Current color blue', 'getCurrentColorBlue'],
        ['h', 'When color changed', 'colorChanged']
      ],
      
    };
    
    var descriptor = {
      blocks: blocks[lang],
      url: 'http://khanning.github.io/scratch-arduino-extension'
    };

ScratchExtensions.register('Lightplay Controller', descriptor, ext, {info: device_info, type: 'ble'});
})({});