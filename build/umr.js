"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
//var os = require('os');
var http = require('http');
var umrconnector_1 = require("./umrconnector");
/*var hostname:string = "0.0.0.0";
var port = 3001;

// Printing os.loadavg() value
var avg_load = os.loadavg();
var retString:string;*/
/*
async function updateUMRstatus()
{
  const ok = UMR.UpdateUMRStatus();
  if(ok)
  {
    console.log(UMR.printThermostats());
  }
}
*/
var delay = function (ms) { return new Promise(function (res) { return setTimeout(res, ms); }); };
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var t;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("v1.3");
                    return [4 /*yield*/, UMR.Start()];
                case 1:
                    t = _a.sent();
                    console.log("Started");
                    if (!t) return [3 /*break*/, 3];
                    console.log("SetTemp");
                    UMR.ThermostatNewSetpoint(1, 8);
                    return [4 /*yield*/, delay(500)];
                case 2:
                    _a.sent();
                    UMR.ThermostatNewSetpoint(1, 9);
                    console.log("SetTempDone");
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
var UMR = new umrconnector_1.UMRConnect();
UMR.on('onNewUMRDetected', function (thermostat) {
    console.log("NewDetect: " + thermostat);
});
UMR.on("onUMREcoChanged", function (thermostat, eco) {
    console.log("IsEco: " + thermostat + " " + eco);
});
UMR.on("onUMROnOffChanged", function (thermostat, ison) {
    console.log("IsOn: " + thermostat + " " + ison);
});
UMR.on("onUMRSetPointChanged", function (thermostat, setpoint) {
    console.log("Setpoint: " + thermostat + " " + setpoint);
});
UMR.on("onUMRMessuredTemperatureChanged", function (thermostat, temperature) {
    console.log("Temperature: " + thermostat + " " + temperature);
});
main();
//const http = require('node:http');
/*
const postData = '{"status":{"process":{"thermostats":[{"index":1,"setpoint":8.0}]}}}';
     
      const options = {
        hostname: 'umr_2',
        keepAlive: false,
        port: 80,
        path: '/set_config.cgi',
        method: 'POST',
        headers: {
          'Content-Length': Buffer.byteLength(postData),
        },
      };
     
      const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
          console.log('No more data in response.');
        });
      });
     
      req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
      });
     
      // Write data to request body
      req.write(postData);
      req.end();
*/
/*
const server = http.createServer((req:any, res:any) => {
    retString = "<html><title>Test</title>Load average (1 minute): " + String(avg_load[0]) + '<br>';
    retString += "Load average (5 minute): " + String(avg_load[1])+ '<br>';
    retString += "Load average (15 minute): " + String(avg_load[2])+ '<br>';
    retString += "totalmem: " + os.totalmem()+ '<br>';
    retString += "freemem: " + os.freemem()+ '<br>';
    for (const [key, value] of Object.entries(process.env))
    {
      retString += (key + "=" + value + "<br>");
    }
    retString += '</html>';
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(retString);
  });
  
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });*/ 
//# sourceMappingURL=umr.js.map