/**
 * ps3_ccapi.ts
 * CCAPI TCP Client — يتصل بـ PS3 عبر الشبكة ويقرأ/يكتب الذاكرة
 *
 * يتطلب تشغيل CCAPI payload على الـ PS3 (CFW فقط)
 * Port افتراضي: 6333
 */

import net from "net";

const CCAPI_PORT    = 6333;
const TIMEOUT_MS    = 8_000;

// ── أوامر CCAPI ───────────────────────────────────────────────────────────────
const CMD = {
  GET_FIRMWARE:  0x00000003,
  GET_TEMP:      0x00000004,
  GET_MEM:       0x00000008,   // اقرأ الذاكرة
  SET_MEM:       0x00000009,   // اكتب الذاكرة
  RING_BUZZER:   0x00000012,
  SHUTDOWN:      0x00000015,
  NOTIFY:        0x00000016,
};

// ── إرسال أمر TCP وانتظار الرد ───────────────────────────────────────────────

function sendCommand(ip: string, commandId: number, body: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const header = Buffer.alloc(8);
    header.writeUInt32BE(body.length + 4, 0);   // حجم الباقي
    header.writeUInt32BE(commandId, 4);

    const packet = Buffer.concat([header, body]);

    const socket = new net.Socket();
    socket.setTimeout(TIMEOUT_MS);

    let responseChunks: Buffer[] = [];

    socket.connect(CCAPI_PORT, ip, () => {
      socket.write(packet);
    });

    socket.on("data", (chunk) => {
      responseChunks.push(chunk);
    });

    socket.on("end", () => {
      const response = Buffer.concat(responseChunks);
      socket.destroy();
      resolve(response);
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Connection timeout — تأكد من تشغيل CCAPI على الـ PS3"));
    });

    socket.on("error", (err) => {
      socket.destroy();
      reject(new Error(`Connection error: ${err.message}`));
    });
  });
}

// ── اختبار الاتصال ────────────────────────────────────────────────────────────

export async function pingPS3(ip: string): Promise<{ firmware: string; temp: number }> {
  // Get Firmware
  const fwBody = Buffer.alloc(0);
  const fwResp = await sendCommand(ip, CMD.GET_FIRMWARE, fwBody);

  // استخرج الـ firmware version من الرد (bytes 8+)
  const firmware = fwResp.length >= 12
    ? `${fwResp.readUInt8(8)}.${fwResp.readUInt8(9)}.${fwResp.readUInt8(10)}`
    : "?.??.??";

  // Get Temperature
  const tempResp = await sendCommand(ip, CMD.GET_TEMP, Buffer.alloc(0));
  const temp = tempResp.length >= 12 ? tempResp.readUInt32BE(8) / 256 : 0;

  return { firmware, temp };
}

// ── قراءة الذاكرة ─────────────────────────────────────────────────────────────

export async function getMemory(ip: string, address: number, size: number): Promise<Buffer> {
  const body = Buffer.alloc(8);
  body.writeUInt32BE(address, 0);
  body.writeUInt32BE(size, 4);

  const resp = await sendCommand(ip, CMD.GET_MEM, body);

  // تخطى header الرد (8 bytes) وارجع البيانات
  if (resp.length < 8) throw new Error("Invalid response from PS3");
  return resp.slice(8);
}

// ── كتابة الذاكرة ─────────────────────────────────────────────────────────────

export async function setMemory(ip: string, address: number, data: Buffer): Promise<void> {
  const body = Buffer.alloc(4 + data.length);
  body.writeUInt32BE(address, 0);
  data.copy(body, 4);

  const resp = await sendCommand(ip, CMD.SET_MEM, body);
  const status = resp.length >= 8 ? resp.readUInt32BE(4) : -1;
  if (status !== 0) throw new Error(`setMemory failed — status: ${status}`);
}

// ── مساعدات للأنواع الشائعة ───────────────────────────────────────────────────

export async function writeFloat(ip: string, address: number, value: number): Promise<void> {
  const buf = Buffer.alloc(4);
  buf.writeFloatBE(value, 0);
  await setMemory(ip, address, buf);
}

export async function writeInt32(ip: string, address: number, value: number): Promise<void> {
  const buf = Buffer.alloc(4);
  buf.writeInt32BE(value, 0);
  await setMemory(ip, address, buf);
}

export async function writeByte(ip: string, address: number, value: number): Promise<void> {
  await setMemory(ip, address, Buffer.from([value & 0xFF]));
}

export async function writeString(ip: string, address: number, str: string, maxLen: number): Promise<void> {
  const buf = Buffer.alloc(maxLen, 0);
  const encoded = Buffer.from(str, "utf8");
  encoded.copy(buf, 0, 0, Math.min(encoded.length, maxLen - 1));
  await setMemory(ip, address, buf);
}

export async function readFloat(ip: string, address: number): Promise<number> {
  const buf = await getMemory(ip, address, 4);
  return buf.readFloatBE(0);
}

export async function readInt32(ip: string, address: number): Promise<number> {
  const buf = await getMemory(ip, address, 4);
  return buf.readInt32BE(0);
}

export async function readString(ip: string, address: number, maxLen = 32): Promise<string> {
  const buf = await getMemory(ip, address, maxLen);
  const end = buf.indexOf(0);
  return buf.slice(0, end === -1 ? maxLen : end).toString("utf8");
}

// ── إشعار داخل اللعبة (SHM / CCAPI Notify) ──────────────────────────────────

export async function sendNotify(ip: string, message: string): Promise<void> {
  const msgBuf = Buffer.from(message + "\x00", "utf8");
  const body   = Buffer.alloc(4 + msgBuf.length);
  body.writeUInt32BE(0, 0);   // icon type
  msgBuf.copy(body, 4);
  await sendCommand(ip, CMD.NOTIFY, body);
}
