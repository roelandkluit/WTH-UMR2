//var os = require('os');
var http = require('http');
import { Console } from "console";
import { UMRConnect } from "./umrconnector";
import { SlowBuffer } from "buffer";


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
var delay = ms => new Promise( res => setTimeout(res, ms));

async function main()
{  
  console.log("v1.3");

  var t = await UMR.Start();
  console.log("Started");

  if (t)
  {
    console.log("SetTemp");
    UMR.ThermostatNewSetpoint(1, 8);
    await delay(500);
    UMR.ThermostatNewSetpoint(1, 9);
    console.log("SetTempDone");    
  }
}

const UMR = new UMRConnect();
UMR.on('onNewUMRDetected',(thermostat) => {
  console.log("NewDetect: " + thermostat );
});

UMR.on("onUMREcoChanged", (thermostat, eco) => {
        console.log("IsEco: " + thermostat  + " " + eco);
    });

UMR.on("onUMROnOffChanged", (thermostat, ison) => {
      console.log("IsOn: " + thermostat  + " " + ison);
  });

UMR.on("onUMRSetPointChanged", (thermostat, setpoint) => {
    console.log("Setpoint: " + thermostat  + " " + setpoint);
});

UMR.on("onUMRMessuredTemperatureChanged", (thermostat, temperature) => {
  console.log("Temperature: " + thermostat  + " " + temperature);
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