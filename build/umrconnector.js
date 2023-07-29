"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UMRConnect = void 0;
var events_1 = require("events");
var http_1 = __importDefault(require("http"));
var UMRConnect = /** @class */ (function (_super) {
    __extends(UMRConnect, _super);
    function UMRConnect() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.UMR_ECO_TEMPERATURE = 16.0;
        _this.UMR_OFF_TEMPERATURE = 8.0;
        _this.UMR2_HostName = "umr_2";
        _this.updateInterval = 60;
        _this.UMRThermostats = [];
        _this.timer = function (ms) { return new Promise(function (res) { return setTimeout(res, ms); }); };
        return _this;
    }
    UMRConnect.prototype.Start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.downloadConfig()];
                    case 1:
                        if (!!(_a.sent())) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.timer(this.updateInterval)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 0];
                    case 3:
                        setInterval(function () { _this.UpdateUMRStatus(); }, this.updateInterval * 1000);
                        return [2 /*return*/, true];
                }
            });
        });
    };
    UMRConnect.prototype.downloadConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var inputThermostatsConfig, JsonThermostatConfig, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.downloadJsonFromUMR('settings.inputs.thermostats.*')];
                    case 1:
                        inputThermostatsConfig = _a.sent();
                        JsonThermostatConfig = inputThermostatsConfig['settings']['inputs']['thermostats'];
                        //const outputValveConfig = await this.downloadJsonFromUMR('settings.outputs.valves.*');
                        //this.jsonValfConfig = outputValveConfig['settings']['outputs']['valves'];
                        //const outputChannelConfig = await this.downloadJsonFromUMR('settings.channels.*');
                        //this.jsonChannelConfig = outputChannelConfig['settings']['channels'];
                        JsonThermostatConfig.forEach(function (item) {
                            switch (item.select) {
                                //We only use the fanlink devices, others devices cannot be controlled trough the interface
                                // or are types that i do not have
                                case ("fanlink"):
                                    //console.log(item);
                                    var thermostat = {
                                        umr_id: item.index,
                                        isOn: false,
                                        isEco: false,
                                        setPoint: -100,
                                        Temperature: 0,
                                        activeHeat: false,
                                        activeCool: false,
                                        type: item.select
                                    };
                                    _this.UMRThermostats.push(thermostat);
                                    break;
                                default:
                                    break;
                            }
                        });
                        return [2 /*return*/, true];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Config Retrieval Error: ".concat(error_1));
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    UMRConnect.prototype.UpdateUMRStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var outputs, thermostats, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.downloadJsonFromUMR('status.outputs.*')];
                    case 1:
                        outputs = _a.sent();
                        this.jsonOutputStatus = outputs['status']['outputs'];
                        return [4 /*yield*/, this.downloadJsonFromUMR('status.process.thermostats.*')];
                    case 2:
                        thermostats = _a.sent();
                        this.jsonThermostatStatus = thermostats['status']['process']['thermostats'];
                        return [2 /*return*/, this.processUMRdata()];
                    case 3:
                        error_2 = _a.sent();
                        console.error("Status Retrieval Error: ".concat(error_2));
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /*public printThermostats():string
    {
        var strOut:string  = "";
        this.UMRThermostats.forEach(Thermostat => {
            strOut += Thermostat.umr_id.toString() + "\t" + Thermostat.Temperature + "\n"
        });
        return strOut;
    }*/
    UMRConnect.prototype.processUMRdata = function () {
        var _this = this;
        try {
            this.isHeating = this.jsonOutputStatus['heater']['state'] == "on";
            this.isCooling = this.jsonOutputStatus['cooler']['state'] == "on";
            this.UMRThermostats.forEach(function (Thermostat) {
                var isNewDetect = false;
                if (Thermostat.setPoint != _this.jsonThermostatStatus[Thermostat.umr_id].setpoint) {
                    if (Thermostat.setPoint == -100) {
                        _this.emit("onNewUMRDetected", Thermostat.umr_id);
                        isNewDetect = true;
                    }
                    //SetPoint ==  UMR_OFF_TEMPERATURE --> Thermostat is OFF
                    if (_this.jsonThermostatStatus[Thermostat.umr_id].setpoint == _this.UMR_OFF_TEMPERATURE) {
                        if (Thermostat.isOn || isNewDetect) {
                            Thermostat.isOn = false;
                            _this.emit("onUMROnOffChanged", Thermostat.umr_id, Thermostat.isOn);
                        }
                    }
                    //SetPoint ==  UMR_ECO_TEMPERATURE --> Thermostat is ECO
                    else if (_this.jsonThermostatStatus[Thermostat.umr_id].setpoint == _this.UMR_ECO_TEMPERATURE) {
                        if (!Thermostat.isEco || isNewDetect) {
                            Thermostat.isEco = true;
                            _this.emit("onUMREcoChanged", Thermostat.umr_id, Thermostat.isEco);
                        }
                    }
                    //SetPoint ==  <OTHER> --> Thermostat is On
                    else {
                        if (!Thermostat.isOn || isNewDetect) {
                            Thermostat.isOn = true;
                            _this.emit("onUMROnOffChanged", Thermostat.umr_id, Thermostat.isOn);
                        }
                        if (Thermostat.isEco || isNewDetect) {
                            Thermostat.isEco = false;
                            _this.emit("onUMREcoChanged", Thermostat.umr_id, Thermostat.isEco);
                        }
                        Thermostat.setPoint = _this.jsonThermostatStatus[Thermostat.umr_id].setpoint;
                        _this.emit("onUMRSetPointChanged", Thermostat.umr_id, Thermostat.setPoint);
                    }
                    Thermostat.setPoint = _this.jsonThermostatStatus[Thermostat.umr_id].setpoint;
                }
                if (Thermostat.Temperature != _this.jsonThermostatStatus[Thermostat.umr_id].temperature) {
                    Thermostat.Temperature = _this.jsonThermostatStatus[Thermostat.umr_id].temperature;
                    _this.emit("onUMRMessuredTemperatureChanged", Thermostat.umr_id, Thermostat.Temperature);
                }
                if (Thermostat.activeHeat != (_this.jsonThermostatStatus[Thermostat.umr_id].factor > 0) && (_this.isHeating)) {
                    Thermostat.activeHeat = (_this.jsonThermostatStatus[Thermostat.umr_id].factor > 0) && (_this.isHeating);
                    _this.emit("onUMRHeatIsActiveChanged", Thermostat.umr_id, Thermostat.activeHeat);
                }
                if (Thermostat.activeCool != (_this.jsonThermostatStatus[Thermostat.umr_id].factor > 0) && (_this.isCooling)) {
                    Thermostat.activeCool = (_this.jsonThermostatStatus[Thermostat.umr_id].factor > 0) && (_this.isCooling);
                    _this.emit("onUMRCoolingIsActiveChanged", Thermostat.umr_id, Thermostat.activeCool);
                }
            });
            return true;
        }
        catch (error) {
            console.log("Unable to process UMR status: ".concat(error));
            return false;
        }
    };
    UMRConnect.prototype.downloadJsonFromUMR = function (jsonPartion) {
        return __awaiter(this, void 0, void 0, function () {
            var i, url, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 7];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 6]);
                        url = "http://".concat(this.UMR2_HostName, "/get.json?f=$.").concat(jsonPartion);
                        return [4 /*yield*/, this.downloadJson(url)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_3 = _a.sent();
                        //console.warn(`Retry Download (${i}): ${error}`);
                        return [4 /*yield*/, this.timer(500)];
                    case 5:
                        //console.warn(`Retry Download (${i}): ${error}`);
                        _a.sent();
                        i++;
                        if (i == 10)
                            throw error_3;
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 1];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    UMRConnect.prototype.ThermostatNewSetpoint = function (thermostat, newTemperature) {
        return __awaiter(this, void 0, void 0, function () {
            var dottetedTemp, postBody;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(newTemperature >= 5 && newTemperature < 35)) return [3 /*break*/, 2];
                        this.newSetpointTemperature = newTemperature;
                        return [4 /*yield*/, this.timer(2000)];
                    case 1:
                        _a.sent();
                        if (newTemperature != this.newSetpointTemperature) {
                            console.log("Setpoint changed during wait");
                            return [2 /*return*/, false];
                        }
                        else {
                            console.log("Setpoint is beeing updated");
                            try {
                                dottetedTemp = newTemperature.toLocaleString('en-us', { minimumFractionDigits: 1 });
                                postBody = '{"status":{"process":{"thermostats":[{"index":' + thermostat + ',"setpoint":' + dottetedTemp + '}]}}}';
                                console.log(postBody);
                                this.postUMRSetting(this.UMR2_HostName, postBody);
                                return [2 /*return*/, true];
                            }
                            catch (_b) {
                                return [2 /*return*/, false];
                            }
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        console.log("Invalid Temperature: " + newTemperature);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
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
    UMRConnect.prototype.postUMRSetting = function (host, postData) {
        return __awaiter(this, void 0, void 0, function () {
            var i, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 7];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, this.postUMRSettingToHost(host, postData)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_4 = _a.sent();
                        console.warn("Set_config (".concat(i, "): ").concat(error_4));
                        return [4 /*yield*/, this.timer(500)];
                    case 5:
                        _a.sent();
                        i++;
                        if (i == 10)
                            return [2 /*return*/, false];
                        return [3 /*break*/, 6];
                    case 6: return [3 /*break*/, 1];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    UMRConnect.prototype.postUMRSettingToHost = function (host, postData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
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
                        var req = http_1.default.request(options, function (res) {
                            //console.log(`STATUS: ${res.statusCode}`);
                            res.setEncoding('utf8');
                            res.on('data', function (chunk) {
                                console.log("BODY: ".concat(chunk));
                            });
                            res.on('end', function () {
                                //console.log('No more data in response.');
                                resolve(true);
                            });
                        });
                        req.on('error', function (e) {
                            console.error("problem with request: ".concat(e.message));
                            reject(e);
                        });
                        // Write data to request body      
                        req.write(postData);
                        req.end();
                    })];
            });
        });
    };
    UMRConnect.prototype.downloadJson = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var request = http_1.default.get(url, { "method": "get", "headers": { "Connection": "close", "User-Agent": "ABBFAH" } }, function (res) {
                            var data = '';
                            res.on('data', function (chunk) {
                                data += chunk;
                            });
                            res.on('close', function () {
                                //console.log("closed");
                            });
                            res.on('end', function () {
                                //console.log('Download successful');
                                resolve(JSON.parse(data));
                            });
                        }).on('error', function (err) {
                            //console.log(`Error: ${err.message}`);
                            reject(err);
                        });
                        request.shouldKeepAlive = false;
                        request.end();
                    })];
            });
        });
    };
    return UMRConnect;
}(events_1.EventEmitter));
exports.UMRConnect = UMRConnect;
//# sourceMappingURL=umrconnector.js.map