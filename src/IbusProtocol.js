import { Transform } from 'stream';
import debugLib from 'debug';
import chalk from 'chalk';

const debug = debugLib('IbusProtocol');

export default class IbusProtocol extends Transform {
    constructor(options = {}) {
        super(options);

        this._buffer = Buffer.alloc(0);
        this._processId = 0;
        this._isProcessing = false;
    }

    _transform(chunk, encoding, done) {
        if (this._isProcessing) {
            console.log('[IbusProtocol]', chalk.red('Error. This _transform function should NOT be running..'));
        }

        this._isProcessing = true;
        debug('[IbusProtocol]', chalk.white('Processing: '), this._processId);
        debug('[IbusProtocol]', 'Current buffer: ', this._buffer);
        debug('[IbusProtocol]', 'Current chunk: ', chunk);

        this._processId++;
        this._buffer = Buffer.concat([this._buffer, chunk]);

        const cchunk = this._buffer;

        if (cchunk.length >= 5) {
            debug('[IbusProtocol]', 'Analyzing: ', cchunk);

            const messages = [];
            let endOfLastMessage = -1;

            for (let i = 0; i < cchunk.length - 5; i++) {
                const mSrc = cchunk[i + 0];
                const mLen = cchunk[i + 1];
                const mDst = cchunk[i + 2];

                if (cchunk.length >= (i + 2 + mLen)) {
                    const mMsg = cchunk.slice(i + 3, i + 3 + mLen - 2);
                    const mCrc = cchunk[i + 2 + mLen - 1];

                    let crc = mSrc ^ mLen ^ mDst;
                    for (let j = 0; j < mMsg.length; j++) crc ^= mMsg[j];

                    if (crc === mCrc) {
                        messages.push({
                            id: Date.now(),
                            src: mSrc.toString(16),
                            len: mLen.toString(16),
                            dst: mDst.toString(16),
                            msg: mMsg,
                            crc: mCrc.toString(16)
                        });

                        endOfLastMessage = i + 2 + mLen;
                        i = endOfLastMessage - 1;
                    }
                }
            }

            if (messages.length > 0) {
                messages.forEach(message => this.emit('message', message));
            }

            if (endOfLastMessage !== -1) {
                this._buffer = cchunk.slice(endOfLastMessage);
                debug('[IbusProtocol]', chalk.yellow('Sliced data: '), endOfLastMessage, this._buffer);
            } else if (this._buffer.length > 500) {
                console.log('[IbusProtocol]', 'dropping some data..');
                this._buffer = cchunk.slice(chunk.length - 300);
            }
        }

        debug('[IbusProtocol]', 'Buffered messages size: ', this._buffer.length);

        this._isProcessing = false;
        done();
    }

    static createIbusMessage(msg) {
        const packetLength = 4 + msg.msg.length;
        const buf = Buffer.alloc(packetLength);

        buf[0] = msg.src;
        buf[1] = msg.msg.length + 2;
        buf[2] = msg.dst;

        for (let i = 0; i < msg.msg.length; i++) {
            buf[3 + i] = msg.msg[i];
        }

        let crc = 0x00;
        for (let i = 0; i < buf.length - 1; i++) crc ^= buf[i];

        buf[3 + msg.msg.length] = crc;

        return buf;
    }
}

