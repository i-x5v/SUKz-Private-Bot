/**
 * ps3_bo2.ts
 * عمليات COD Black Ops 2 (COD 9) على PS3
 *
 * العناوين: BLUS30991 (US) / BLES01717 (EU) — تحقق من نسختك
 * ⚠️  ابحث عن "BO2 PS3 offsets" لتأكيد العناوين لنسختك الدقيقة
 */

import {
  writeFloat, writeInt32, writeByte, writeString,
  readFloat, readInt32, readString,
} from "./ps3_ccapi";

// ── عناوين الذاكرة ─────────────────────────────────────────────────────────────
// ⚠️  هذه عناوين مرجعية — قد تختلف حسب نسخة اللعبة والـ firmware

export const ADDR = {
  // ── اللاعب المحلي ──────────────────────────────────────────────────────────
  LOCAL_CLIENT_BASE: 0x11078E00,  // أساس بيانات اللاعب المحلي

  PLAYER_NAME:       0x110790A0,  // String (32 bytes)
  CLAN_TAG:          0x110790C4,  // String (5 bytes)

  // ── الكاميرا والرؤية ───────────────────────────────────────────────────────
  FOV:               0x110790D8,  // Float — الافتراضي: 65.0
  THIRD_PERSON:      0x110790DC,  // Int   — 0=first, 1=third
  CINEMATIC_CAM:     0x110790E0,  // Int   — 0=normal, 1=cinematic
  CROSSHAIR_HIDE:    0x11079100,  // Int   — 0=visible, 1=hidden

  // ── الإضاءة ───────────────────────────────────────────────────────────────
  FULL_BRIGHT:       0x110791A0,  // Float — 1.0=normal, 3.0=max

  // ── HUD ───────────────────────────────────────────────────────────────────
  HUD_COLOR_R:       0x110791C0,  // Float 0.0–1.0
  HUD_COLOR_G:       0x110791C4,  // Float 0.0–1.0
  HUD_COLOR_B:       0x110791C8,  // Float 0.0–1.0
  HUD_ALPHA:         0x110791CC,  // Float 0.0–1.0
  HUD_SCALE:         0x110791D0,  // Float (0.5=small, 1.0=normal, 2.0=big)

  // ── اللوبي ────────────────────────────────────────────────────────────────
  FREEZE_ALL:        0x11079200,  // Int — 0=normal, 1=freeze all
  GAME_MSG_ADDR:     0x11079280,  // String (128 bytes) — رسالة داخل اللعبة

  // ── اللاعبون (18 slot × 0x3A0 bytes) ─────────────────────────────────────
  PLAYERS_BASE:      0x11040000,  // أساس قائمة اللاعبين
  PLAYER_SLOT_SIZE:  0x3A0,       // حجم كل slot

  // ── Trickshot Tools ───────────────────────────────────────────────────────
  GRAVITY:           0x11079300,  // Float — 800.0=normal, 200.0=low
  SPEED_MULT:        0x11079304,  // Float — 1.0=normal, 1.5=fast
  JUMP_HEIGHT:       0x11079308,  // Float — 39.0=normal, 80.0=high
  NO_CLIP:           0x11079310,  // Int   — 0=normal, 1=noclip

  // ── إعادة التشغيل ─────────────────────────────────────────────────────────
  RESTART_TRIGGER:   0x11079400,  // Byte  — اكتب 1 لإعادة التشغيل
};

// ── عمليات اللاعب ─────────────────────────────────────────────────────────────

export async function setPlayerName(ip: string, name: string): Promise<void> {
  await writeString(ip, ADDR.PLAYER_NAME, name, 32);
}

export async function setClanTag(ip: string, tag: string): Promise<void> {
  const clean = tag.slice(0, 4);
  await writeString(ip, ADDR.CLAN_TAG, clean, 5);
}

export async function setFOV(ip: string, fov: number): Promise<void> {
  const clamped = Math.max(40, Math.min(120, fov));
  await writeFloat(ip, ADDR.FOV, clamped);
}

export async function setFullBright(ip: string, on: boolean): Promise<void> {
  await writeFloat(ip, ADDR.FULL_BRIGHT, on ? 3.0 : 1.0);
}

export async function setThirdPerson(ip: string, on: boolean): Promise<void> {
  await writeInt32(ip, ADDR.THIRD_PERSON, on ? 1 : 0);
}

export async function setCinematicCam(ip: string, on: boolean): Promise<void> {
  await writeInt32(ip, ADDR.CINEMATIC_CAM, on ? 1 : 0);
}

export async function setCrosshair(ip: string, visible: boolean): Promise<void> {
  await writeInt32(ip, ADDR.CROSSHAIR_HIDE, visible ? 0 : 1);
}

// ── عمليات اللوبي ─────────────────────────────────────────────────────────────

export async function freezeAll(ip: string, freeze: boolean): Promise<void> {
  await writeInt32(ip, ADDR.FREEZE_ALL, freeze ? 1 : 0);
}

export async function sendGameMessage(ip: string, text: string): Promise<void> {
  await writeString(ip, ADDR.GAME_MSG_ADDR, text, 128);
}

export async function restartGame(ip: string): Promise<void> {
  await writeByte(ip, ADDR.RESTART_TRIGGER, 1);
}

// حساب عنوان لاعب حسب الـ slot (0–17)
export function playerAddr(slot: number, offset: number): number {
  return ADDR.PLAYERS_BASE + slot * ADDR.PLAYER_SLOT_SIZE + offset;
}

export async function kickPlayer(ip: string, slot: number): Promise<void> {
  // اكتب 1 في حقل "kick" للاعب المحدد
  await writeByte(ip, playerAddr(slot, 0x10), 1);
}

export async function getPlayerName(ip: string, slot: number): Promise<string> {
  return readString(ip, playerAddr(slot, 0x18), 32);
}

// ── HUD ───────────────────────────────────────────────────────────────────────

export async function setHUD(ip: string, r: number, g: number, b: number, scale: number): Promise<void> {
  await writeFloat(ip, ADDR.HUD_COLOR_R, r   / 255);
  await writeFloat(ip, ADDR.HUD_COLOR_G, g   / 255);
  await writeFloat(ip, ADDR.HUD_COLOR_B, b   / 255);
  await writeFloat(ip, ADDR.HUD_ALPHA,   1.0      );
  await writeFloat(ip, ADDR.HUD_SCALE,   scale    );
}

// ── Trickshot ─────────────────────────────────────────────────────────────────

export type TrickshotAction =
  | "low_gravity"
  | "normal_gravity"
  | "speed_boost"
  | "normal_speed"
  | "high_jump"
  | "normal_jump"
  | "noclip_on"
  | "noclip_off";

export async function trickshotAction(ip: string, action: TrickshotAction): Promise<void> {
  switch (action) {
    case "low_gravity":    await writeFloat(ip, ADDR.GRAVITY,    200.0); break;
    case "normal_gravity": await writeFloat(ip, ADDR.GRAVITY,    800.0); break;
    case "speed_boost":    await writeFloat(ip, ADDR.SPEED_MULT,   1.5); break;
    case "normal_speed":   await writeFloat(ip, ADDR.SPEED_MULT,   1.0); break;
    case "high_jump":      await writeFloat(ip, ADDR.JUMP_HEIGHT,  80.0); break;
    case "normal_jump":    await writeFloat(ip, ADDR.JUMP_HEIGHT,  39.0); break;
    case "noclip_on":      await writeInt32(ip, ADDR.NO_CLIP,        1); break;
    case "noclip_off":     await writeInt32(ip, ADDR.NO_CLIP,        0); break;
  }
}

// ── قراءة حالة اللعبة ─────────────────────────────────────────────────────────

export interface GameStatus {
  playerName: string;
  fov:        number;
  fullBright: boolean;
  thirdPerson: boolean;
  frozen:     boolean;
  players:    string[];  // أسماء اللاعبين المتصلين
}

export async function readGameStatus(ip: string): Promise<GameStatus> {
  const [playerName, fovVal, brightVal, tpVal, frozenVal] = await Promise.all([
    readString(ip, ADDR.PLAYER_NAME, 32),
    readFloat(ip,  ADDR.FOV),
    readFloat(ip,  ADDR.FULL_BRIGHT),
    readInt32(ip,  ADDR.THIRD_PERSON),
    readInt32(ip,  ADDR.FREEZE_ALL),
  ]);

  // اقرأ أسماء أول 8 لاعبين
  const playerPromises = Array.from({ length: 8 }, (_, i) =>
    getPlayerName(ip, i).catch(() => "")
  );
  const allNames = await Promise.all(playerPromises);
  const players  = allNames.filter(n => n.trim().length > 0);

  return {
    playerName,
    fov:        Math.round(fovVal),
    fullBright: brightVal >= 2.0,
    thirdPerson: tpVal === 1,
    frozen:     frozenVal === 1,
    players,
  };
}
