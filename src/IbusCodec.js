import { devices } from "./IbusDevices.js";
import { commands } from "./IbusCommands.js";

// --- Exemple d'utilisation ---
//const buf = encodeMessage(0x01, { src: 0x30, day: 11, month: 11, year: 2025 });
//console.log("Encodé:", buf);
//
//const decoded = decodeMessage(0x01, buf);
//console.log("Décodé:", decoded);

export const commandTable = {
  [commands.DeviceStatusReq]: {
    encode: ({ src, dst }) => ({
      src,
      dst,
      msg: Buffer.from([commands.DeviceStatusReq]),
    }),
    decode: (data) => ({ ...data, cmd: data.msg[0] }),
  },
  [commands.DeviceStatus]: {
    encode: ({ src, dst, status }) => ({
      src,
      dst,
      msg: Buffer.from([commands.DeviceStatus, status]),
    }),
    decode: (data) => ({ ...data, cmd: data.msg[0], status: data.msg[1] }),
  },
  [commands.GTMonitorCtrl]: {
    // ED 05 F0 4F 12 11 54
    // ! VID  --> BMBT: RGB control, LCD_on GT
    // ED 05 F0 4F 11 12 54
    // ! VID  --> BMBT:q RGB control, LCD_on TV
    // 3B 05 BB 4F 02 00 C8
    // ! GT   --> NAJ : RGB control, LCD_off GT
    // 3B 05 BB 4F 01 00 CB
    // ! GT   --> NAJ : RGB control, LCD_off TV
    // power: off(0), on(1); source: NavGT(0), TV(1), VidGT(2); encoding: NTSC(1), PAL(2); aspect: 4:3(0), 16:9(1), zoom(3)
    encode: ({ src, dst, power, source, encoding, aspect }) => {
      const data1 = ((power << 4) & 0x10) | (source & 0x03);
      const data2 = ((aspect << 4) & 0x30) | (encoding & 0x03);
      return {
        src,
        dst,
        msg: Buffer.from([commands.GTMonitorCtrl, data1, data2]),
      };
    },
    decode: (data) => {
      const data1 = data.msg[1];
      const data2 = data.msg[2];
      return {
        ...data,
        cmd: data.msg[0],
        source: data1 & 0x03,
        power: (data1 & 0x10) >> 4,
        aspect: (data2 & 0x30) >> 4,
        encoding: data2 & 0x03,
      };
    },
  },
  [commands.Knob]: {
    // F0 04 3B 49 81 07
    // ! BMBT --> GT  : BM_Knob, Right 1 step
    // F0 04 3B 49 01 87
    // ! BMBT --> GT  : BM_Knob, Left 1 step
    // turn: left(0),right(1); step: 7f
    encode: ({ src, dst, turn, step }) => {
      const data1 = ((turn << 7) & 0x80) | (step & 0x7f);
      return { src, dst, msg: Buffer.from([commands.Knob, data1]) };
    },
    decode: (data) => {
      const data1 = data.msg[1];
      return {
        ...data,
        cmd: data.msg[0],
        turn: (data1 & 0x80) >> 7,
        step: data1 & 0x7f,
      };
    },
  },
  [commands.BMBTB0]: {
    // F0 04 3B 48 05 82
    // ! BMBT --> GT  : BM Button, BM_Knob_pressed
    // F0 04 3B 48 85 02
    // ! BMBT --> GT  : BM Button, BM_Knob_released
    // relased: 0/1, hold: 0/1, id: 3F
    encode: ({ src, dst, released, hold, id }) => {
      const data1 =
        ((release << 7) & 0x80) | ((hold << 6) & 0x40) | (id & 0x3f);
      return { src, dst, msg: Buffer.from([commands.BMBTB0, data1]) };
    },
    decode: (data) => {
      const data1 = data.msg[1];
      return {
        ...data,
        cmd: data.msg[0],
        relase: (data1 & 0x80) >> 7,
        hold: (data1 & 0x40) >> 6,
        id: data1 & 0x3f,
      };
    },
  },
  [commands.BMBTB1]: {
    // relased: 0/1, hold: 0/1, id: 3F
    encode: ({ src, dst, released, hold, id }) => {
      const data1 =
        ((release << 7) & 0x80) | ((hold << 6) & 0x40) | (id & 0x3f);
      return { src, dst, msg: Buffer.from([commands.BMBTB1, data1]) };
    },
    decode: (data) => {
      const data1 = data.msg[1];
      return {
        ...data,
        cmd: data.msg[0],
        relase: (data1 & 0x80) >> 7,
        hold: (data1 & 0x40) >> 6,
        id: data1 & 0x3f,
      };
    },
  },
  [commands.ANZVUpdate]: {
    encode: ({ src, dst, sub, data }) => {
      // Look up sub-command handler
      const subEntry = commandTable.ANZVUpdate.subCommands[sub];
      if (!subEntry) throw new Error(`Unknown ANZV sub-command: ${sub}`);
      const msg = subEntry.encode(data);
      return {
        src,
        dst,
        msg: Buffer.concat([Buffer.from([commands.ANZVUpdate, sub]), msg]),
      };
    },
    decode: (data) => {
      const sub = data.msg[1]; // second byte = sub-command
      const subEntry = commandTable.ANZVUpdate.subCommands[sub];
      if (!subEntry) return { ...data, cmd: data.msg[0], sub };
      const decoded = subEntry.decode(data.msg.slice(2));
      return { ...data, cmd: data.msg[0], sub, ...decoded };
    },
    subCommands: {
      0x01: {
        // Time
        // 80 0C E7 24 01 00 31 36 3A 32 31 20 20 70
        // ! IKE  --> ANZV: Update Text, Layout=Time  Flags=  F0="16:21  " */
        encode: ({ hours, minutes, seconds }) => {
          const buf = Buffer.alloc(6); // 3 champs × 2 caractères ASCII chacun
          buf[0] = ((hours / 10) | 0) + 0x30;
          buf[1] = (hours % 10) + 0x30;
          buf[2] = ((minutes / 10) | 0) + 0x30;
          buf[3] = (minutes % 10) + 0x30;
          buf[4] = ((seconds / 10) | 0) + 0x30;
          buf[5] = (seconds % 10) + 0x30;
          return buf;
        },
        decode: (buf) => ({
          hours: (buf[0] - 0x30) * 10 + (buf[1] - 0x30),
          minutes: (buf[2] - 0x30) * 10 + (buf[3] - 0x30),
          seconds: (buf[4] - 0x30) * 10 + (buf[5] - 0x30),
        }),
      },
      0x02: {
        // Date
        // 80 0F E7 24 02 00 30 39 2E 30 33 2E 32 30 32 34 40
        // ! IKE  --> ANZV: Update Text, Layout=Date  Flags=  F0="09.03.2024" */
        encode: ({ day, month, year }) => {
          const buf = Buffer.alloc(8); // day(2) + month(2) + year(4)
          buf[0] = ((day / 10) | 0) + 0x30;
          buf[1] = (day % 10) + 0x30;
          buf[2] = ((month / 10) | 0) + 0x30;
          buf[3] = (month % 10) + 0x30;
          buf[4] = ((year / 1000) | 0) + 0x30;
          buf[5] = (((year % 1000) / 100) | 0) + 0x30;
          buf[6] = (((year % 100) / 10) | 0) + 0x30;
          buf[7] = (year % 10) + 0x30;
          return buf;
        },
        decode: (buf) => ({
          day: (buf[0] - 0x30) * 10 + (buf[1] - 0x30),
          month: (buf[2] - 0x30) * 10 + (buf[3] - 0x30),
          year:
            (buf[4] - 0x30) * 1000 +
            (buf[5] - 0x30) * 100 +
            (buf[6] - 0x30) * 10 +
            (buf[7] - 0x30),
        }),
      },
    },
  },
};
