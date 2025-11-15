import { devices, getDeviceName } from './IbusDevices.js';
import { commands, getCommandName } from './IbusCommands.js';
import { commandTable } from './IbusCodec.js';

export default class IbusApp {
    static devices = devices;
    static commands = commands;

    static getDeviceName(key) {
        return getDeviceName(key);
    }

    static getCommandName(key) {
        return getCommandName(key);
    }

    /** Encode un message prêt à envoyer */
    static encode(commandId, params) {
        const entry = commandTable[commandId];
        if (!entry || !entry.encode) {
            throw new Error('Commande inconnue: 0x${commandId.toString(16)}');
        }
        return entry.encode({ ...params, cmd: commandId });
    }

    /** Decode un message reçu automatiquement à partir de data.msg[0] */
    static decode(data) {
        if (!data || !data.msg || data.msg.length === 0) return null;

        const cmd = data.msg[0];
        const entry = commandTable[cmd];

        let decoded;
        if (!entry || !entry.decode) {
            decoded = { ...data, raw: data.msg };
        } else {
            decoded = entry.decode(data);
            decoded.raw = data.msg; // conserve la trame brute
        }

        // Définir toString() pour affichage lisible
        Object.defineProperty(decoded, 'toString', {
            value: function () {
                const srcName = IbusApp.getDeviceName(this.src ?? -1);
                const dstName = IbusApp.getDeviceName(this.dst ?? -1);
                const cmdName = this.msg?.length
                                    ? IbusApp.getCommandName(this.msg[0])
                                    : 'Unknown';
                return `DecodedFrame {
    src: ${srcName} (${this.src}),
    dst: ${dstName} (${this.dst}),
    cmd: ${cmdName} (0x${this.msg?.[0]?.toString(16)}),
    msg: ${this.msg?.toString('hex')}
}`;
            },
            enumerable: false, // invisible dans les itérations
            configurable: true,
            writable: true
        });

        return decoded;
    }
}
