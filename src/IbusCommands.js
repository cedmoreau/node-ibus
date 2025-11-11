export const commands = {
    DeviceStatusReq:             0x01,
    DeviceStatus:                0x02,
    BusStatusReq:                0x03,
    BusStatus:                   0x04,
    DiagMemoryRead:              0x06,
    DiagMemoryWrite:             0x07,
    DiagCodingRead:              0x08,
    DiagCodingWrite:             0x09,
    VehiculeCntrl:               0x0C,
    IgnitionStatusReq:           0x10,
    IgnitionStatus:              0x11,
    SensorStatusRq:              0x12, /* IKE sensor status */
    SensorStatus:                0x13, 
    CountryCodingReq:            0x14,
    CountryCoding:               0x15,
    OdometerReq:                 0x16, /*"Odometer request"*/
    Odometer:                    0x17, /*"Odometer"*/
    SpeedRpm:                    0x18, /*"Speed/RPM"*/
    Temperature:                 0x19, /*"Temperature"*/
    TextGong:                    0x1A, /*"IKE text display/Gong"*/
    TextStatus:                  0x1B, /*"IKE text status"*/
    Gong:                        0x1C, /*"IKE Gong"*/
    TemperatureReq:              0x1D,
    TimeData:                    0x1F,
    MT:                          0x21,  /*Radio Short cuts*/
    GTChangeUIReq:               0x20,
    GTChangeUI:                  0x21,
    GTMenuBuffer:                0x22, /* Display text ack */
    GTWriteTitle:                0x23, /* Display text */
    ANZVUpdate:                  0x24, /*"Update ANZV"*/
    OBCSUpdate:                  0x2A, /*"On-Board Computer State Update"*/
    TelephoneIndicator:          0x2B, /*Telephone indicators*/
    TelephoneStatus:             0x2C,  /* telephone status */
    GTMenuSelect:                0x31,
    MFLButtons:                  0x32, /*"MFL buttons"*/
    DSPEqButton:                 0x34, /*"DSP Equalizer Button"*/
    GTDisplayRadioMenu:          0x37,
    CDStatusReq:                 0x38, /*"CD status request"*/
    CDStatus:                    0x39, /*"CD status"*/
    MFLButtons2:                 0x3B, /*"MFL buttons"*/
    SDRSStatusReq:               0x3D, /*"SDRS status request"*/
    SDRSStatus:                  0x3E, /*"SDRS status"*/
    OBCDSet:                     0x40, /*"Set On-Board Computer Data"*/
    OBCDReq:                     0x41, /*"On-Board Computer Data Request"*/
    GTScreenModeSet:             0x45,
    LCDClear:                    0x46, /* LCD Clear*/
    BMBTB0:                      0x47, /*"BMBT buttons"*/
    BMBTB1:                      0x48, /*"BMBT buttons"*/
    Knob:                        0x49, /*"KNOB button"*/ /*this is for right knob turn, pressing know is BMBTB1 and ButtonMenuKnob*/
    K7Ctrl:                      0x4a, /*Cassette control*/
    K7Status:                    0x4b, /*"Cassette Status"*/
    GTRadioTelevisionStatus:     0x4E,
    GTMonitorCtrl:               0x4F, /* RGB control */
    VehiculeDataReq:             0x53, /*"Vehicle data request"*/
    VehiculeData:                0x54, /*"Vehicle data status"*/
    LampStatusReq:               0x5A, /*"Lamp status request"*/
    LampStatus:                  0x5B, /*"Lamp Status"*/
    InstrumentLightStatus:       0x5C, /*"Instrument cluster lighting status"*/
    InstrumentLightStatusReq:	 0x5D, 
    GTWriteIndex:                0x60,
    GTWriteIndexTMC:             0x61,
    GTWriteZone:                 0x62,
    GTWriteStatic:               0x63,
    RainStatusReq:               0x71, /*"Rain sensor status request"*/
    RemoteKeyButton:             0x72, /*"Remote Key buttons"*/
    EWSKeyStatus:                0x74, /*"EWS key status"*/
    DoorsWindowsStatusReq:       0x79, /*"Doors/windows status request"*/
    DoorsWindowsStatus:          0x7A, /*"Doors/windows status"*/
    SHDStatus:                   0x7C, /*"SHD status"*/
    RDSChannels:                 0xD4,  /*RDS channel list*/
    DiagData:                    0xA0, /*"DIAG data"*/
    GTTelematicsCoordinates:     0xA2,
    GTTelematicsLocation:        0xA4,
    GTWriteWithCursor:           0xA5, /* screen text */
    SpecialIndicatorsAck:        0xA6, /* IKE special indicators ack */
    TMCStatusReq:                0xA7, /*"TMC status request"*/
    TMCStatus:                   0xA8,
    NavigationTelephoneData:     0xA9,
    NavigationCtrl:              0xAA, /*"Navigation Control"*/
    NavigationRemoteCtrl:        0xAB /* Remote control status */
};

export function getCommandName(key) {
    const hkey = parseInt(key, 16);
    for (const dkey in commands) {
        if (commands[dkey] === hkey) {
            return `${dkey} - ${key}`;
        }
    }
    return `Unknown Command - ${key}`;
}

export default {
    getCommandName,
    commands
};

