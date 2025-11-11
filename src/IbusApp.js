import { devices } from './IbusDevices.js';
import { commands } from './IbusCommands.js';
import { encodeMessage, decodeMessage } from './IbusCodec.js';

export class IbusApp {
    static devices = devices;
    static commands = commands;

   /** Encode un message prêt à envoyer */
    static encode(commandId, params) {
        const entry = commandTable[commandId];
        if (!entry || !entry.encode) {
            throw new Error(`Commande inconnue: 0x${commandId.toString(16)}`);
        }
        return entry.encode({ ...params, cmd: commandId });
    }

    /** Decode un message reçu automatiquement à partir de data.msg[0] */
    static decode(data) {
        if (!data || !data.msg || data.msg.length === 0) return null;

        const cmd = data.msg[0];
        const entry = commandTable[cmd];
        if (!entry || !entry.decode) return { ...data, raw: data.msg };

        return entry.decode(data);
    }
}
