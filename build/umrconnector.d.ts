/// <reference types="node" />
import { EventEmitter } from 'events';
import { StrictEventEmitter } from 'strict-event-emitter-types';
interface UMRClassEvents {
    'onNewUMRDetected': (thermostat: number, InitialSetPoint: number) => void;
    'onUMRSetPointChanged': (Thermostat: number, SetPoint: number) => void;
    'onUMRMessuredTemperatureChanged': (Thermostat: number, Temperature: number) => void;
    'onUMROnOffChanged': (Thermostat: number, isON: boolean) => void;
    'onUMREcoChanged': (Thermostat: number, isECO: boolean) => void;
    'onUMRHeatIsActiveChanged': (Thermostat: number, isActive: boolean) => void;
    'onUMRCoolingIsActiveChanged': (Thermostat: number, isActive: boolean) => void;
}
type UMRChannelEmitter = StrictEventEmitter<EventEmitter, UMRClassEvents>;
declare const UMRConnect_base: new () => UMRChannelEmitter;
export declare class UMRConnect extends UMRConnect_base {
    UMR_ECO_TEMPERATURE: number;
    UMR_OFF_TEMPERATURE: number;
    updateInterval: number;
    newDeviceNotificatonInterval: number;
    private jsonOutputStatus;
    private jsonThermostatStatus;
    private UMRThermostats;
    private newSetpointTemperature;
    private UMR2_HostName;
    private isStarted;
    private timer;
    isHeating: boolean;
    isCooling: boolean;
    Start(): Promise<boolean>;
    SetHostname(hostname: string): void;
    private downloadConfig;
    private GetThermostatFromArray;
    private NotifyInitialDevices;
    private UpdateUMRStatus;
    private processUMRdata;
    private downloadJsonFromUMR;
    SetEco(thermostat: number): Promise<void>;
    SetEcoEnds(thermostat: number, temperature: number): Promise<void>;
    SetOn(thermostat: number, temperature: number): Promise<void>;
    SetOff(thermostat: number): Promise<void>;
    ThermostatNewSetpoint(thermostat: number, newTemperature: number): Promise<boolean>;
    private postUMRSetting;
    private postUMRSettingToHost;
    private downloadJson;
}
export {};
//# sourceMappingURL=umrconnector.d.ts.map