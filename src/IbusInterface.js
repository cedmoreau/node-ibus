import { SerialPort } from "serialport";
import chalk from "chalk";
import { EventEmitter } from "events";
import IbusProtocol from "./IbusProtocol.js";
import IbusDevices from "./IbusDevices.js";
import debugLib from "debug";

const debug = debugLib("IbusInterface");

export default class IbusInterface extends EventEmitter {
  constructor(devicePath = "/dev/ttyAMA0") {
    super();

    this.device = devicePath;
    this.serialPort = null;
    this.parser = null;
    this.lastActivityTime = process.hrtime();
    this.queue = [];
  }

  setDevicePath(devicePath) {
    this.device = devicePath;
  }

  initIBUS() {
    this.serialPort = new SerialPort({
      path: this.device,
      baudRate: 9600,
      parity: "none",
      stopBits: 1,
      dataBits: 8,
      autoOpen: false,
    });

    this.serialPort.open((error) => {
      debug("[IbusInterface] open");
      if (error) {
        console.log("[IbusInterface] Failed to open: " + error);
        return;
      }

      console.log("[IbusInterface] Port Open [" + this.device + "]");

      this.serialPort.on("data", (data) => {
        this.lastActivityTime = process.hrtime();
      });

      this.serialPort.on("error", (err) => {
        console.log("[IbusInterface] Error", err);
        this.shutdown(this.initIBUS.bind(this));
      });

      this.parser = new IbusProtocol();
      this.parser.on("message", this.onMessage.bind(this));

      this.serialPort.pipe(this.parser);

      this.watchForEmptyBus(this.processWriteQueue.bind(this));
    });
  }

  getHrDiffTime(time) {
    const ts = process.hrtime(time);
    return ts[0] * 1000 + ts[1] / 1000000;
  }

  watchForEmptyBus(workerFn) {
    if (this.getHrDiffTime(this.lastActivityTime) >= 20) {
      workerFn(() => {
        setImmediate(this.watchForEmptyBus.bind(this), workerFn);
      });
    } else {
      setImmediate(this.watchForEmptyBus.bind(this), workerFn);
    }
  }

  processWriteQueue(ready) {
    if (this.queue.length <= 0) {
      ready();
      return;
    }

    const dataBuf = this.queue.pop();
    debug(
      chalk.blue("[IbusInterface] Write queue length: "),
      this.queue.length
    );

    this.serialPort.write(dataBuf, (error, resp) => {
      if (error) {
        console.log("[IbusInterface] Failed to write: " + error);
      } else {
        debug(
          "[IbusInterface] ",
          chalk.white("Wrote to Device: "),
          dataBuf,
          resp
        );

        this.serialPort.drain((error) => {
          debug(chalk.white("Data drained"));
          this.lastActivityTime = process.hrtime();
          ready();
        });
      }
    });
  }

  closeIBUS(callback) {
    this.serialPort.close((error) => {
      if (error) {
        console.log("[IbusInterface] Error closing port: ", error);
      } else {
        debug("[IbusInterface] Port Closed [" + this.device + "]");
        this.parser = null;
      }
      callback();
    });
  }

  getInterface() {
    return this.serialPort;
  }

  startup() {
    this.initIBUS();
  }

  shutdown(callback) {
    debug("[IbusInterface] Shutting down Ibus device..");
    this.closeIBUS(callback);
  }

  onMessage(msg) {
    // correct msg
    if (!msg || !msg.msg || msg.msg.length === 0) {
      console.warn("[IbusInterface] Ignoring invalid message:", msg);
      return;
    }

    debug(
      "[IbusInterface] Raw Message: ",
      msg.src,
      msg.len,
      msg.dst,
      msg.msg,
      "[" + msg.msg.toString("ascii") + "]",
      msg.crc
    );
    this.emit("data", msg);
  }

  sendMessage(msg) {
    const dataBuf = IbusProtocol.createIbusMessage(msg);
    debug("[IbusInterface] Send message: ", dataBuf);

    if (this.queue.length > 1000) {
      console.log(
        "[IbusInterface] Queue too large, dropping message..",
        dataBuf
      );
      return;
    }

    this.queue.unshift(dataBuf);
  }
}
