import { rejects } from 'assert';
import { EventEmitter } from 'events';
import * as http from 'http';
import { StrictEventEmitter } from 'strict-event-emitter-types';

type UMRThermostatStatus = {
    umr_id: number;
    isOn: boolean; 
    isEco: boolean;
    setPoint: number;
    Temperature: number;
    type: string;
    activeHeat: boolean;  
    activeCool: boolean;
    isNewlyCreated: boolean;
}

interface UMRClassEvents {
    'onNewUMRDetected': (thermostat:number, InitialSetPoint:number) => void;
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
    public updateInterval: number = 60;
    public newDeviceNotificatonInterval: number = 10;

    private jsonOutputStatus:JSON = {} as JSON;
    private jsonThermostatStatus:JSON = {} as JSON;
    private UMRThermostats: Array<UMRThermostatStatus> = [];
    private newSetpointTemperature:number = 0;
    private UMR2_HostName:string = "umr_2";
    private isStarted:boolean = false; 

    private timer = (ms:any) => new Promise( (res:any) => setTimeout(res, ms));
    public isHeating: boolean = false;
    public isCooling: boolean = false;

    public async Start(): Promise<boolean>
    {
        while(!await this.downloadConfig())
        {
            await this.timer(this.updateInterval);
        }
        while(!await this.NotifyInitialDevices())
        {
            await this.timer(this.newDeviceNotificatonInterval * 1000);
        }
        console.log("Init completed");
        this.isStarted = true;
        setInterval(() => { this.UpdateUMRStatus() }, this.updateInterval * 1000);
        return true;
    }

    public SetHostname(hostname:string)
    {
        if(this.isStarted)
            throw new Error("Cannot change hostname when connected");

        if(hostname == "")
            this.UMR2_HostName = "umr_2";
        else
            this.UMR2_HostName = hostname;
    }

    private async downloadConfig(): Promise<boolean>
    {
        try {
            const inputThermostatsConfig = await this.downloadJsonFromUMR('settings.inputs.thermostats.*');
            var JsonThermostatConfig = inputThermostatsConfig['settings']['inputs']['thermostats'];

            const thermostats = await this.downloadJsonFromUMR('status.process.thermostats.*');
            this.jsonThermostatStatus = thermostats['status']['process']['thermostats'];

            //const outputValveConfig = await this.downloadJsonFromUMR('settings.outputs.valves.*');
            //this.jsonValfConfig = outputValveConfig['settings']['outputs']['valves'];

            //const outputChannelConfig = await this.downloadJsonFromUMR('settings.channels.*');
            //this.jsonChannelConfig = outputChannelConfig['settings']['channels'];

            JsonThermostatConfig.forEach((item:any) => 
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
                            type: item.select,
                            isNewlyCreated: false
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

    private GetThermostatFromArray(ThermostatId:Number): UMRThermostatStatus | undefined
    {
        var FoundThermostat:(UMRThermostatStatus | undefined) = undefined;

        this.UMRThermostats.forEach(Thermostat => {
                          
            //console.log("Looking: " + Thermostat.umr_id + "==" + ThermostatId);
            if(Thermostat.umr_id == ThermostatId)
            {
                //console.log("Found: " + Thermostat.umr_id + "==" + ThermostatId);
                FoundThermostat = Thermostat;                
                return FoundThermostat; //Note, this returns only the forEach statement!
            }
        });
        return FoundThermostat;
    }

    private async NotifyInitialDevices(): Promise<boolean>
    {
        var retval:boolean = true;
        this.UMRThermostats.forEach(Thermostat => {
                  
            if(retval)
            {
                if(Thermostat.setPoint != (this.jsonThermostatStatus as any)[Thermostat.umr_id].setpoint)
                {
                    if(Thermostat.setPoint == -100)
                    {
                        Thermostat.setPoint = 0;
                        Thermostat.isNewlyCreated = true;
                        this.emit("onNewUMRDetected", Thermostat.umr_id, (this.jsonThermostatStatus as any)[Thermostat.umr_id].setpoint);
                        //console.log("Created new thermostat" + Thermostat.umr_id);
                        retval = false;
                    }
                }
            }
        });
        return retval;
    }

    private async UpdateUMRStatus(): Promise<boolean> 
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
            this.isHeating = (this.jsonOutputStatus as any)['heater']['state'] != "off";
            this.isCooling = (this.jsonOutputStatus as any)['cooler']['state'] != "off";

            this.UMRThermostats.forEach(Thermostat => {
                                
                if(Thermostat.setPoint != (this.jsonThermostatStatus as any)[Thermostat.umr_id].setpoint)
                {
                    //console.log("Thermostat" + Thermostat.umr_id + " Setpointoff");
                    if(Thermostat.setPoint == -100)
                    {
                        Thermostat.setPoint = 0;
                        Thermostat.isNewlyCreated = true;
                        this.emit("onNewUMRDetected", Thermostat.umr_id, (this.jsonThermostatStatus as any)[Thermostat.umr_id].setpoint);
                        //console.log("Created new thermostat" + Thermostat.umr_id + ", not updating properties at this moment");
                        return true;
                    }
                    else
                    {
                        //console.log("Thermostat" + Thermostat.umr_id + " processing");

                        //SetPoint ==  UMR_OFF_TEMPERATURE --> Thermostat is OFF
                        if((this.jsonThermostatStatus as any)[Thermostat.umr_id].setpoint == this.UMR_OFF_TEMPERATURE)
                        {
                            if(Thermostat.isOn || Thermostat.isNewlyCreated)
                            {
                                Thermostat.isOn = false;
                                Thermostat.isEco = false;
                                this.emit("onUMROnOffChanged", Thermostat.umr_id, Thermostat.isOn);
                            }                    
                        }
                        //SetPoint ==  UMR_ECO_TEMPERATURE --> Thermostat is ECO
                        else if((this.jsonThermostatStatus as any)[Thermostat.umr_id].setpoint == this.UMR_ECO_TEMPERATURE)
                        {
                            if(!Thermostat.isEco || Thermostat.isNewlyCreated)
                            {
                                Thermostat.isEco = true;
                                this.emit("onUMREcoChanged", Thermostat.umr_id, Thermostat.isEco);                        
                            }
                        }
                        //SetPoint ==  <OTHER> --> Thermostat is On
                        else
                        {
                            if(!Thermostat.isOn || Thermostat.isNewlyCreated)
                            {
                                Thermostat.isOn = true;
                                this.emit("onUMROnOffChanged", Thermostat.umr_id, Thermostat.isOn);                        
                            }
                            if(Thermostat.isEco || Thermostat.isNewlyCreated)
                            {
                                Thermostat.isEco = false;
                                this.emit("onUMREcoChanged", Thermostat.umr_id, Thermostat.isEco);
                            }
                            Thermostat.setPoint = (this.jsonThermostatStatus as any)[Thermostat.umr_id].setpoint
                            this.emit("onUMRSetPointChanged", Thermostat.umr_id, Thermostat.setPoint);
                        }
                        Thermostat.setPoint = (this.jsonThermostatStatus as any)[Thermostat.umr_id].setpoint
                        Thermostat.isNewlyCreated = false;
                    }
                }

                if(Thermostat.Temperature != (this.jsonThermostatStatus as any)[Thermostat.umr_id].temperature)
                {
                    Thermostat.Temperature = (this.jsonThermostatStatus as any)[Thermostat.umr_id].temperature;
                    this.emit("onUMRMessuredTemperatureChanged", Thermostat.umr_id, Thermostat.Temperature);
                }
                
                if(Thermostat.activeHeat != (((this.jsonThermostatStatus as any)[Thermostat.umr_id].factor > 0) && (this.isHeating)))
                {
                    Thermostat.activeHeat = (((this.jsonThermostatStatus as any)[Thermostat.umr_id].factor > 0) && (this.isHeating));
                    this.emit("onUMRHeatIsActiveChanged", Thermostat.umr_id, Thermostat.activeHeat);
                }

                if(Thermostat.activeCool != (((this.jsonThermostatStatus as any)[Thermostat.umr_id].factor > 0) && (this.isCooling)))
                {
                    Thermostat.activeCool = (((this.jsonThermostatStatus as any)[Thermostat.umr_id].factor > 0) && (this.isCooling));
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

    public async SetEco(thermostat:number)
    {
        console.log("SetEco " + thermostat);
        var oThermostat = this.GetThermostatFromArray(thermostat);
        if(oThermostat == undefined)
        {
            console.error("thermostat not found " + thermostat);
        }
        else
        {
            oThermostat.isEco = true;
            this.ThermostatNewSetpoint(thermostat, this.UMR_ECO_TEMPERATURE);
        }
    }

    public async SetEcoEnds(thermostat:number, temperature:number)
    {
        console.log("EcoEnd " + thermostat);
        var oThermostat = this.GetThermostatFromArray(thermostat);
        if(oThermostat == undefined)
        {
            console.error("thermostat not found " + thermostat);
        }
        else
        {        
            oThermostat.isEco = false;
            this.ThermostatNewSetpoint(thermostat, temperature);
        }
    }

    public async SetOn(thermostat:number, temperature:number)
    {
        console.log("SetOn " + thermostat);
        var oThermostat = this.GetThermostatFromArray(thermostat);
        if(oThermostat == undefined)
        {
            console.error("thermostat not found " + thermostat);
        }
        else
        {        
            if(!oThermostat.isEco)
            {            
                this.ThermostatNewSetpoint(thermostat, temperature);
                console.log("On");
            }
        }
    }

    public async SetOff(thermostat:number)
    {
        console.log("Off " + thermostat);
        this.ThermostatNewSetpoint(thermostat, this.UMR_OFF_TEMPERATURE);
    }

    public async ThermostatNewSetpoint(thermostat:number, newTemperature:number):Promise<boolean>
    {
        if (newTemperature >= 5 && newTemperature < 35)
        {
            this.newSetpointTemperature = newTemperature;
            await this.timer(5000);
            if(newTemperature != this.newSetpointTemperature)
            {
                //console.log("Setpoint changed during wait");
                return false;
            }
            else
            {
                //console.log("Setpoint is beeing updated");
                try
                {
                    var dottetedTemp:string = newTemperature.toLocaleString('en-us', {minimumFractionDigits: 1})
                    var postBody:string = '{"status":{"process":{"thermostats":[{"index":' + thermostat + ',"setpoint":' + dottetedTemp + '}]}}}';
                    this.postUMRSetting(this.UMR2_HostName, postBody);
                    this.UMRThermostats[thermostat].setPoint = 0; //Force update of setpoint from UMR
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
                //console.warn(`Set_config (${i}): ${error}`);
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
                resolve(JSON.parse(data));
            });      
            }).on('error', (err) => {                
                reject(err);
            });
            request.shouldKeepAlive = false;
            request.end();            
        });        
    }
}