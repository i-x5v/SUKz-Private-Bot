/**
 * ps3_store.ts
 * تخزين بيانات الأجهزة المتصلة لكل سيرفر / مستخدم
 */

export interface PS3Device {
  ip:          string;
  nickname:    string;          // اسم ودّي للجهاز
  connectedAt: number;          // timestamp
  userId:      string;          // من وصل الجهاز
  guildId:     string;
}

// guildId → device
const deviceStore = new Map<string, PS3Device>();

// سجل الأوامر: guildId → آخر timestamp للأمر (حماية spam)
const cmdCooldowns = new Map<string, number>();
const CMD_COOLDOWN_MS = 1_500; // 1.5 ثانية بين كل أمر

export const ps3Store = {

  connect(guildId: string, userId: string, ip: string, nickname: string): void {
    deviceStore.set(guildId, { ip, nickname, connectedAt: Date.now(), userId, guildId });
  },

  disconnect(guildId: string): void {
    deviceStore.delete(guildId);
  },

  get(guildId: string): PS3Device | undefined {
    return deviceStore.get(guildId);
  },

  isConnected(guildId: string): boolean {
    return deviceStore.has(guildId);
  },

  // حماية spam — true = على cooldown
  isOnCooldown(guildId: string): boolean {
    const last = cmdCooldowns.get(guildId);
    return !!last && Date.now() - last < CMD_COOLDOWN_MS;
  },

  setCooldown(guildId: string): void {
    cmdCooldowns.set(guildId, Date.now());
  },

  getAll(): PS3Device[] {
    return [...deviceStore.values()];
  },
};
