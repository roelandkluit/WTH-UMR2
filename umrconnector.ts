import { rejects } from 'assert';
import events, { EventEmitter } from 'events';
import http from 'http';
import { request } from 'http';
import { StrictEventEmitter } from 'strict-event-emitter-types';

//import { it } from 'node:test';
//import { valve } from "./umr-includes";

type UMRThermostatStatus = {
    umr_id: number;
    isOn: boolean; 
    isEco: boolean;
    setPoint: number;
    Temperature: number;
    type: string;
    activeHeat: boolean;  
    activeCool: boolean;
}


interface UMRClassEvents {
    'onNewUMRDetected': (thermostat:number) => void;
    'onUMRSetPointChanged': (Thermostat:number, SetPoint:number) => void;
    'onUMRMessuredTemperatureChanged': (Thermostat:number, Temperature:number) => void;
    'onUMROnOffChanged': (Thermostat:number, isON:boolean) => void;
    'onUMREcoChanged': (Thermostat:number, isECO:boolean) => void;    
    'onUMRHeatIsActiveChanged': (Thermostat:number, isActive:boolean) => void;    
    'onUMRCoolingIsActiveChanged': (Thermostat:number, isActive:boolean) => void;
  }

type UMRChannelEmitter = StrictEventEmitter<EventEmitter, UMRClassEvents>;

export class UMRConnect extends (EventEmitter as { new(): UMRChannelEmitter})
{
    public UMR_ECO_TEMPERATURE:number = 16.0;
    public UMR_OFF_TEMPERATURE:number = 8.0;
    public UMR2_HostName:string = "umr_2";
    public updateInterval: number = 60;

    private jsonOutputStatus:JSON;
    private jsonThermostatStatus:JSON;
    private UMRThermostats: Array<UMRThermostatStatus> = [];
    private newSetpointTemperature:number;

    private timer = ms => new Promise( res => setTimeout(res, ms));
    public isHeating: boolean;
    public isCooling: boolean;

    public async Start(): Promise<boolean>
    {
        while(!await this.downloadConfig())
        {
            await this.timer(this.updateInterval);
        }
        setInterval(() => { this.UpdateUMRStatus() }, this.updateInterval * 1000);
        return true;
    }

    public async downloadConfig(): Promise<boolean>
    {
        try {
            const inputThermostatsConfig = await this.downloadJsonFromUMR('settings.inputs.thermostats.*');
            var JsonThermostatConfig = inputThermostatsConfig['settings']['inputs']['thermostats'];

            //const outputValveConfig = await this.downloadJsonFromUMR('settings.outputs.valves.*');
            //this.jsonValfConfig = outputValveConfig['settings']['outputs']['valves'];

            //const outputChannelConfig = await this.downloadJsonFromUMR('settings.channels.*');
            //this.jsonChannelConfig = outputChannelConfig['settings']['channels'];

            JsonThermostatConfig.forEach(item => 
            {               
                switch(item.select)
                {
                    //We only use the fanlink devices, others devices cannot be controlled trough the interface
                    // or are types that i do not have
                    case("fanlink"):
                        //console.log(item);
                        var thermostat:UMRThermostatStatus = {
                            umr_id: item.index,
                            isOn: false,
                            isEco: false,
                            setPoint: -100,
                            Temperature: 0,
                            activeHeat: false,
                            activeCool: false,
                            type: item.select
                        };
                        this.UMRThermostats.push(thermostat);
                        break;
                    default:
                        break;
                }              
            });
            return true;
        } catch (error) {
            console.error(`Config Retrieval Error: ${error}`);
            return false;
        }
    }

    public async UpdateUMRStatus(): Promise<boolean> 
    {
        try {
            const outputs = await this.downloadJsonFromUMR('status.outputs.*');
            this.jsonOutputStatus = outputs['status']['outputs'];

            const thermostats = await this.downloadJsonFromUMR('status.process.thermostats.*');
            this.jsonThermostatStatus = thermostats['status']['process']['thermostats'];

            return this.processUMRdata();

        } catch (error) {
            console.error(`Status Retrieval Error: ${error}`);
            return false;
        }
    }
   
    /*public printThermostats():string
    {
        var strOut:string  = "";
        this.UMRThermostats.forEach(Thermostat => {
            strOut += Thermostat.umr_id.toString() + "\t" + Thermostat.Temperature + "\n"
        });
        return strOut;
    }*/

    private processUMRdata():boolean
    {
        try{            
            this.isHeating = this.jsonOutputStatus['heater']['state'] == "on";
            this.isCooling = this.jsonOutputStatus['cooler']['state'] == "on";

            this.UMRThermostats.forEach(Thermostat => {

                var isNewDetect:boolean = false;
                if(Thermostat.setPoint != this.jsonThermostatStatus[Thermostat.umr_id].setpoint)
                {
                    if(Thermostat.setPoint == -100)
                    {
                        this.emit("onNewUMRDetected", Thermostat.umr_id);
                        isNewDetect = true;
                    }

                    //SetPoint ==  UMR_OFF_TEMPERATURE --> Thermostat is OFF
                    if(this.jsonThermostatStatus[Thermostat.umr_id].setpoint == this.UMR_OFF_TEMPERATURE)
                    {
                        if(Thermostat.isOn || isNewDetect)
                        {
                            Thermostat.isOn = false;
                            this.emit("onUMROnOffChanged", Thermostat.umr_id, Thermostat.isOn);                        
                        }                    
                    }
                    //SetPoint ==  UMR_ECO_TEMPERATURE --> Thermostat is ECO
                    else if(this.jsonThermostatStatus[Thermostat.umr_id].setpoint == this.UMR_ECO_TEMPERATURE)
                    {
                        if(!Thermostat.isEco || isNewDetect) 
                        {
                            Thermostat.isEco = true;
                            this.emit("onUMREcoChanged", Thermostat.umr_id, Thermostat.isEco);                        
                        }
                    }
                    //SetPoint ==  <OTHER> --> Thermostat is On
                    else
                    {
                        if(!Thermostat.isOn || isNewDetect)
                        {
                            Thermostat.isOn = true;
                            this.emit("onUMROnOffChanged", Thermostat.umr_id, Thermostat.isOn);                        
                        }
                        if(Thermostat.isEco || isNewDetect)
                        {
                            Thermostat.isEco = false;
                            this.emit("onUMREcoChanged", Thermostat.umr_id, Thermostat.isEco);
                        }
                        Thermostat.setPoint = this.jsonThermostatStatus[Thermostat.umr_id].setpoint
                        this.emit("onUMRSetPointChanged", Thermostat.umr_id, Thermostat.setPoint);
                    }
                    Thermostat.setPoint = this.jsonThermostatStatus[Thermostat.umr_id].setpoint                    
                }

                if(Thermostat.Temperature != this.jsonThermostatStatus[Thermostat.umr_id].temperature)
                {
                    Thermostat.Temperature = this.jsonThermostatStatus[Thermostat.umr_id].temperature;
                    this.emit("onUMRMessuredTemperatureChanged", Thermostat.umr_id, Thermostat.Temperature);
                }
                
                if(Thermostat.activeHeat != (this.jsonThermostatStatus[Thermostat.umr_id].factor > 0) && (this.isHeating))
                {
                    Thermostat.activeHeat = (this.jsonThermostatStatus[Thermostat.umr_id].factor > 0) && (this.isHeating);
                    this.emit("onUMRHeatIsActiveChanged", Thermostat.umr_id, Thermostat.activeHeat);
                }

                if(Thermostat.activeCool != (this.jsonThermostatStatus[Thermostat.umr_id].factor > 0) && (this.isCooling))
                {
                    Thermostat.activeCool = (this.jsonThermostatStatus[Thermostat.umr_id].factor > 0) && (this.isCooling);
                    this.emit("onUMRCoolingIsActiveChanged", Thermostat.umr_id, Thermostat.activeCool);                    
                }
            });
            return true;
        }
        catch(error)
        {
            console.log(`Unable to process UMR status: ${error}`);
            return false;
        }
    }

    private async downloadJsonFromUMR(jsonPartion:string)
    {
        var i:number = 0;

        // The connection on the UMR is closed to quickly. Therefore timing might infuence download behavour.
        // An socket hang up error can be thrown, added retry to overcome this.
        while(true)
        {
            try
            {
                var url = `http://${this.UMR2_HostName}/get.json?f=\$.${jsonPartion}`;
                return await this.downloadJson(url);
            }
            catch(error)
            {
                //console.warn(`Retry Download (${i}): ${error}`);
                await this.timer(500);
                i++;
                if(i == 10)
                    throw error;
            }
        }        
    }

    public async ThermostatNewSetpoint(thermostat:number, newTemperature:number):Promise<boolean>
    {
        if (newTemperature >= 5 && newTemperature < 35)
        {
            this.newSetpointTemperature = newTemperature;
            await this.timer(2000);
            if(newTemperature != this.newSetpointTemperature)
            {
                console.log("Setpoint changed during wait");
                return false;
            }
            else
            {
                console.log("Setpoint is beeing updated");
                try
                {
                    var dottetedTemp:string = newTemperature.toLocaleString('en-us', {minimumFractionDigits: 1})
                    var postBody:string = '{"status":{"process":{"thermostats":[{"index":' + thermostat + ',"setpoint":' + dottetedTemp + '}]}}}';
                    console.log(postBody);
                    this.postUMRSetting(this.UMR2_HostName, postBody);
                    return true;
                }
                catch
                {
                    return false;
                }
            }
        }
        else
        {
            console.log("Invalid Temperature: " + newTemperature);
            return false;
        }
    }

    /*
    private async DoHTTPPost(url: string, postdata:string): Promise<any>
    {
        var UTFstring = new TextEncoder().encode(" + postdata);
        const formData = new FormData()
        formData.set('', postdata)        
        postUMRSetting
        console.log("HTTPREsponse: " + response.status);      
        console.log("HTTPREsponse: " + response.text);      
    }*/

    /*
    private async downloadJson(url: string) : Promise<JSON>
    {
        var response = await fetch(url);
        var data = await response.json();
        return data;
    }*/

    private async postUMRSetting(host:string, postData:string)
    {
        var i:number = 0;

        // The connection on the UMR is closed to quickly. Therefore timing might infuence set_config behavour.
        // An socket hang up error can be thrown, added retry to overcome this.
        while(true)
        {
            try
            {
                return await this.postUMRSettingToHost(host, postData);
            }
            catch(error)
            {
                console.warn(`Set_config (${i}): ${error}`);
                await this.timer(500);
                i++;
                if(i == 10)
                    return false;
            }
        }        
    }    
    
    private async postUMRSettingToHost(host:string, postData:string): Promise<any>
    {   
        return new Promise((resolve, reject) => {
        var options = {
          hostname: host,
          keepAlive: false,
          port: 80,
          path: '/set_config.cgi',
          method: 'POST',
          headers: {
            'Content-Length': Buffer.byteLength(postData),
          },
        };
       
        const req = http.request(options, (res) => {
          //console.log(`STATUS: ${res.statusCode}`);
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
          });
          res.on('end', () => {
            //console.log('No more data in response.');
            resolve(true);
          });
        });
       
        req.on('error', (e) => {
          console.error(`problem with request: ${e.message}`);
          reject(e);
        });
       
        // Write data to request body      
        req.write(postData);
        req.end();
        });
    }
    
    private async downloadJson(url: string): Promise<any>
    {
        return new Promise((resolve, reject) => {
        var request = http.get(url,{"method": "get", "headers": {"Connection":"close", "User-Agent":"ABBFAH"}}, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('close', () => {
                //console.log("closed");
            });
            res.on('end', () => {
                //console.log('Download successful');
                resolve(JSON.parse(data));
            });      
            }).on('error', (err) => {                
                //console.log(`Error: ${err.message}`);
                reject(err);
            });
            request.shouldKeepAlive = false;
            request.end();            
        });        
    }
}