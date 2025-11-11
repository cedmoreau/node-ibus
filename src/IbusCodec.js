import { devices } from './IbusDevices.js';
import { commands } from './IbusCommands.js';

// --- Exemple d'utilisation ---
//const buf = encodeMessage(0x01, { src: 0x30, day: 11, month: 11, year: 2025 });
//console.log("Encodé:", buf);
//
//const decoded = decodeMessage(0x01, buf);
//console.log("Décodé:", decoded);

export const commandTable = {
    [commands.DeviceStatusReq]: {
        encode: ({ src, dst }) => ({ src, dst, msg: Buffer.from([commands.DeviceStatusReq]) }),
        decode: (data) => ({ ...data, cmd: data.msg[0] }),
    },
    [commands.DeviceStatus]: {
        encode: ({ src, dst, status }) => ({ src, dst, msg: Buffer.from([commands.DeviceStatus, status]) }),
        decode: (data) => ({ ...data, cmd: data.msg[0], status: data.msg[1] }),
    },
    [commands.GTMonitorCtrl]: {
    /* ED 05 F0 4F 12 11 54
     * ! VID  --> BMBT: RGB control, LCD_on GT */
    /* ED 05 F0 4F 11 12 54
     * ! VID  --> BMBT:q RGB control, LCD_on TV */
    /* 3B 05 BB 4F 02 00 C8
     * ! GT   --> NAJ : RGB control, LCD_off GT */
    /* 3B 05 BB 4F 01 00 CB
     * ! GT   --> NAJ : RGB control, LCD_off TV */
        // power: off(0), on(1); source: NavGT(0), TV(1), VidGT(2); encoding: NTSC(1), PAL(2); aspect: 4:3(0), 16:9(1), zoom(3)
        encode: ({ src, dst, power, source, encoding, aspect }) => {
            const data1 = ((power << 4) & 0x10) || (source & 0x03);
            const data2 = ((aspect << 4) & 0x30) || (encoding & 0x03);
            return { src, dst, Buffer.from([commands.GTMonitorCtrl, data1, data2])};
        },
        decode: (data) => {
            const data1 = data.msg[1];
            const data2 = data.msg[2];
            ...data,
            cmd: data.msg[0],
            source: (data1 & 0x03),
            power: ((data1 & 0x10) >> 4),
            aspect: ((data2 & 0x30) >> 4),
            encoding: (data2 & 0x03)
        }),
    },
};

