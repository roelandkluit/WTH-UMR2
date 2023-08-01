Module to connect to WTH-UMR2 heating controll system.

Copyright:
 2023, Roeland Kluit

Installation:
 npm i nodejs-wth-umr-connect

Source:
 https://github.com/roelandkluit/WTH-UMR2

Usage:

import { UMRConnect } from "nodejs-wth-umr-connect";

async function main()
{  
  var UMR = new UMRConnect();

  UMR.SetHostname("172.16.16.63");

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

  var t = await UMR.Start();
  console.log("Started");  
}

try {
    main();    
}
catch (error) {
    console.error(error);
}