/**
 * ps3_tool.ts
 * أمر /ps3 — التحكم الكامل بـ PS3 CFW / COD 9 (Black Ops 2) من داخل Discord
 */

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  Colors,
  PermissionFlagsBits,
} from "discord.js";
import { logger } from "../../lib/logger";
import { ps3Store } from "./ps3_store";
import { pingPS3, sendNotify } from "./ps3_ccapi";
import {
  setPlayerName, setClanTag, setFOV,
  setFullBright, setThirdPerson, setCinematicCam, setCrosshair,
  freezeAll, sendGameMessage, restartGame, kickPlayer,
  setHUD, trickshotAction, readGameStatus,
} from "./ps3_bo2";

// ── ألوان الـ embed ────────────────────────────────────────────────────────────
const C = {
  ok:      0x00D166,
  err:     0xFF3333,
  info:    0x5865F2,
  warn:    0xFFA500,
  ps3:     0x003087,  // أزرق PlayStation
};

// ── مساعدات ──────────────────────────────────────────────────────────────────

function ok(title: string, desc: string): EmbedBuilder {
  return new EmbedBuilder().setColor(C.ok).setTitle(`✅ ${title}`).setDescription(desc).setTimestamp();
}
function err(desc: string): EmbedBuilder {
  return new EmbedBuilder().setColor(C.err).setTitle("❌ خطأ").setDescription(desc).setTimestamp();
}
function info(title: string, desc: string): EmbedBuilder {
  return new EmbedBuilder().setColor(C.ps3).setTitle(title).setDescription(desc).setTimestamp();
}

/** تحقق من وجود اتصال نشط، وإلا رد بالخطأ */
async function requireDevice(
  interaction: ChatInputCommandInteraction
): Promise<string | null> {
  const device = ps3Store.get(interaction.guildId!);
  if (!device) {
    await interaction.reply({
      embeds: [err("لا يوجد جهاز متصل.\nاستخدم `/ps3 connect ip:<IP>`")],
      flags:  MessageFlags.Ephemeral,
    });
    return null;
  }
  return device.ip;
}

/** تنفيذ أمر مع معالجة الأخطاء وسجل اللوق */
async function runCmd(
  interaction: ChatInputCommandInteraction,
  label: string,
  fn: (ip: string) => Promise<void>
): Promise<void> {
  const ip = await requireDevice(interaction);
  if (!ip) return;

  if (ps3Store.isOnCooldown(interaction.guildId!)) {
    await interaction.reply({
      embeds: [err("⏳ انتظر ثانية قبل إرسال أمر آخر.")],
      flags:  MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply();
  ps3Store.setCooldown(interaction.guildId!);

  try {
    await fn(ip);
    logger.info({ cmd: label, ip, user: interaction.user.tag }, "PS3 command executed");
    await interaction.editReply({
      embeds: [ok(label, `تم تنفيذ الأمر بنجاح على \`${ip}\``)],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn({ cmd: label, ip, err: msg }, "PS3 command failed");
    await interaction.editReply({
      embeds: [err(`فشل الأمر: \`${msg}\``)],
    });
  }
}

// ── تعريف الأمر ───────────────────────────────────────────────────────────────

export const ps3Command = {
  data: new SlashCommandBuilder()
    .setName("ps3")
    .setDescription("🎮 التحكم بـ PS3 CFW / COD Black Ops 2 عبر CCAPI")

    // ── الاتصال ───────────────────────────────────────────────────────────────
    .addSubcommand(s => s
      .setName("connect")
      .setDescription("🔌 اتصل بالـ PS3 عبر IP")
      .addStringOption(o => o.setName("ip").setDescription("عنوان IP للـ PS3").setRequired(true))
      .addStringOption(o => o.setName("name").setDescription("اسم ودّي للجهاز (اختياري)").setRequired(false)))

    .addSubcommand(s => s
      .setName("disconnect")
      .setDescription("🔴 قطع الاتصال بالجهاز الحالي"))

    .addSubcommand(s => s
      .setName("status")
      .setDescription("📊 حالة اللعبة والاتصال الحالي"))

    // ── اللاعب ────────────────────────────────────────────────────────────────
    .addSubcommand(s => s
      .setName("name")
      .setDescription("✏️ تغيير اسم اللاعب داخل اللعبة")
      .addStringOption(o => o.setName("value").setDescription("الاسم الجديد").setRequired(true)))

    .addSubcommand(s => s
      .setName("clan")
      .setDescription("🏷️ تغيير الـ Clan Tag (4 أحرف)")
      .addStringOption(o => o.setName("value").setDescription("الـ tag الجديد").setRequired(true)))

    .addSubcommand(s => s
      .setName("fov")
      .setDescription("👁️ تغيير الـ FOV (مجال الرؤية)")
      .addIntegerOption(o => o.setName("value").setDescription("القيمة (40–120)، الافتراضي 65").setRequired(true).setMinValue(40).setMaxValue(120)))

    // ── المرئيات ──────────────────────────────────────────────────────────────
    .addSubcommand(s => s
      .setName("fullbright")
      .setDescription("💡 Full Bright — إضاءة كاملة")
      .addStringOption(o => o.setName("toggle").setDescription("تشغيل أو إيقاف").setRequired(true)
        .addChoices({ name: "🟢 تشغيل", value: "on" }, { name: "🔴 إيقاف", value: "off" })))

    .addSubcommand(s => s
      .setName("thirdperson")
      .setDescription("📷 Third Person — كاميرا ثالثة")
      .addStringOption(o => o.setName("toggle").setDescription("تشغيل أو إيقاف").setRequired(true)
        .addChoices({ name: "🟢 تشغيل", value: "on" }, { name: "🔴 إيقاف", value: "off" })))

    .addSubcommand(s => s
      .setName("cinematic")
      .setDescription("🎬 Cinematic Camera — كاميرا السينما للتصوير")
      .addStringOption(o => o.setName("toggle").setDescription("تشغيل أو إيقاف").setRequired(true)
        .addChoices({ name: "🟢 تشغيل", value: "on" }, { name: "🔴 إيقاف", value: "off" })))

    .addSubcommand(s => s
      .setName("crosshair")
      .setDescription("🎯 Crosshair — إخفاء أو إظهار التسديد")
      .addStringOption(o => o.setName("toggle").setDescription("إظهار أو إخفاء").setRequired(true)
        .addChoices({ name: "👁️ إظهار", value: "show" }, { name: "🚫 إخفاء", value: "hide" })))

    .addSubcommand(s => s
      .setName("hud")
      .setDescription("🎨 تعديل لون وحجم الـ HUD")
      .addIntegerOption(o => o.setName("r").setDescription("أحمر 0–255").setRequired(true).setMinValue(0).setMaxValue(255))
      .addIntegerOption(o => o.setName("g").setDescription("أخضر 0–255").setRequired(true).setMinValue(0).setMaxValue(255))
      .addIntegerOption(o => o.setName("b").setDescription("أزرق 0–255").setRequired(true).setMinValue(0).setMaxValue(255))
      .addNumberOption(o => o.setName("scale").setDescription("الحجم (0.5=صغير, 1.0=عادي, 2.0=كبير)").setRequired(false).setMinValue(0.5).setMaxValue(3.0)))

    // ── اللوبي ────────────────────────────────────────────────────────────────
    .addSubcommand(s => s
      .setName("freeze")
      .setDescription("🧊 تجميد / تحرير اللاعبين داخل اللوبي")
      .addStringOption(o => o.setName("toggle").setDescription("تجميد أو تحرير").setRequired(true)
        .addChoices({ name: "🧊 تجميد الجميع", value: "on" }, { name: "▶️ تحرير الجميع", value: "off" })))

    .addSubcommand(s => s
      .setName("kick")
      .setDescription("👢 طرد لاعب من اللوبي")
      .addIntegerOption(o => o.setName("slot").setDescription("رقم الـ slot (0–17)").setRequired(true).setMinValue(0).setMaxValue(17)))

    .addSubcommand(s => s
      .setName("restart")
      .setDescription("🔄 إعادة تشغيل الجولة الحالية"))

    .addSubcommand(s => s
      .setName("message")
      .setDescription("💬 إرسال رسالة داخل اللعبة")
      .addStringOption(o => o.setName("text").setDescription("نص الرسالة").setRequired(true)))

    // ── Trickshot ─────────────────────────────────────────────────────────────
    .addSubcommand(s => s
      .setName("trickshot")
      .setDescription("🤸 أدوات الـ Trickshot")
      .addStringOption(o => o.setName("action").setDescription("اختر الإعداد").setRequired(true)
        .addChoices(
          { name: "🪂 جاذبية منخفضة",   value: "low_gravity"    },
          { name: "⬇️ جاذبية عادية",     value: "normal_gravity" },
          { name: "⚡ سرعة عالية",       value: "speed_boost"    },
          { name: "🚶 سرعة عادية",       value: "normal_speed"   },
          { name: "🦘 قفز عالي",         value: "high_jump"      },
          { name: "🦶 قفز عادي",         value: "normal_jump"    },
          { name: "👻 NoClip تشغيل",     value: "noclip_on"      },
          { name: "🚷 NoClip إيقاف",     value: "noclip_off"     },
        )))

    // ── إشعار ─────────────────────────────────────────────────────────────────
    .addSubcommand(s => s
      .setName("notify")
      .setDescription("📣 إرسال إشعار على شاشة الـ PS3")
      .addStringOption(o => o.setName("text").setDescription("نص الإشعار").setRequired(true))),

  // ── التنفيذ ───────────────────────────────────────────────────────────────

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sub     = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    // ── تحقق صلاحيات الأدمن للأوامر الحساسة ─────────────────────────────────
    const sensitiveCommands = ["freeze", "kick", "restart", "connect", "disconnect"];
    if (sensitiveCommands.includes(sub)) {
      const member = interaction.member;
      const isAdmin =
        (member?.permissions as import("discord.js").PermissionsBitField)
          ?.has(PermissionFlagsBits.Administrator) ||
        (member?.permissions as import("discord.js").PermissionsBitField)
          ?.has(PermissionFlagsBits.ManageGuild);

      if (!isAdmin) {
        await interaction.reply({
          embeds: [err("تحتاج صلاحية **Administrator** أو **Manage Server** لهذا الأمر.")],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // connect
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "connect") {
      const ip       = interaction.options.getString("ip",   true).trim();
      const nickname = interaction.options.getString("name", false)?.trim() ?? ip;

      // تحقق أن الـ IP صحيح
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
        await interaction.reply({ embeds: [err("عنوان IP غير صحيح.")], flags: MessageFlags.Ephemeral });
        return;
      }

      await interaction.deferReply();

      try {
        const { firmware, temp } = await pingPS3(ip);
        ps3Store.connect(guildId, interaction.user.id, ip, nickname);

        logger.info({ ip, firmware, user: interaction.user.tag }, "PS3 connected");

        const embed = new EmbedBuilder()
          .setColor(C.ps3)
          .setTitle("🔌 تم الاتصال بالـ PS3!")
          .addFields(
            { name: "📡 الـ IP",        value: `\`${ip}\``,          inline: true },
            { name: "🏷️ الاسم",        value: `\`${nickname}\``,     inline: true },
            { name: "⚙️ Firmware",     value: `\`${firmware}\``,     inline: true },
            { name: "🌡️ الحرارة",      value: `\`${temp.toFixed(1)}°C\``, inline: true },
            { name: "👤 وصّله",        value: `<@${interaction.user.id}>`, inline: true },
          )
          .setFooter({ text: "SUKz Bot • PS3 Tool | COD Black Ops 2" })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await interaction.editReply({ embeds: [err(`فشل الاتصال:\n\`${msg}\`\n\n**تأكد من:**\n> • CCAPI شغّال على الـ PS3\n> • نفس الشبكة\n> • IP صحيح`)] });
      }
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // disconnect
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "disconnect") {
      const device = ps3Store.get(guildId);
      if (!device) {
        await interaction.reply({ embeds: [err("لا يوجد جهاز متصل.")], flags: MessageFlags.Ephemeral });
        return;
      }
      ps3Store.disconnect(guildId);
      logger.info({ ip: device.ip }, "PS3 disconnected");
      await interaction.reply({ embeds: [ok("تم قطع الاتصال", `تم قطع الاتصال بـ \`${device.ip}\` (${device.nickname})`)] });
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // status
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "status") {
      const device = ps3Store.get(guildId);
      if (!device) {
        await interaction.reply({
          embeds: [info("📊 الحالة", "❌ لا يوجد جهاز متصل.\nاستخدم `/ps3 connect ip:<IP>`")],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.deferReply();

      try {
        const [pingData, gameStatus] = await Promise.all([
          pingPS3(device.ip),
          readGameStatus(device.ip),
        ]);

        const uptimeSec = Math.floor((Date.now() - device.connectedAt) / 1000);
        const uptimeStr = uptimeSec < 60
          ? `${uptimeSec}ث`
          : `${Math.floor(uptimeSec / 60)}د ${uptimeSec % 60}ث`;

        const embed = new EmbedBuilder()
          .setColor(C.ps3)
          .setTitle("📊 حالة الـ PS3 والـ COD")
          .addFields(
            { name: "📡 IP",            value: `\`${device.ip}\``,                 inline: true },
            { name: "⚙️ Firmware",     value: `\`${pingData.firmware}\``,          inline: true },
            { name: "🌡️ حرارة",        value: `\`${pingData.temp.toFixed(1)}°C\``, inline: true },
            { name: "⏱️ وقت الاتصال",  value: `\`${uptimeStr}\``,                  inline: true },
            { name: "👤 اللاعب",        value: `\`${gameStatus.playerName || "—"}\``, inline: true },
            { name: "👁️ FOV",           value: `\`${gameStatus.fov}°\``,            inline: true },
            { name: "💡 Full Bright",   value: gameStatus.fullBright  ? "🟢 ON" : "⚫ OFF", inline: true },
            { name: "📷 3rd Person",    value: gameStatus.thirdPerson ? "🟢 ON" : "⚫ OFF", inline: true },
            { name: "🧊 Frozen",        value: gameStatus.frozen      ? "🟢 نعم" : "⚫ لا", inline: true },
            {
              name:   `👥 اللاعبون (${gameStatus.players.length})`,
              value:  gameStatus.players.length
                ? gameStatus.players.map((p, i) => `\`${i}\` ${p}`).join("\n")
                : "_لا يوجد لاعبون_",
              inline: false,
            },
          )
          .setFooter({ text: `وصّله: ${interaction.user.tag}` })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await interaction.editReply({ embeds: [err(`خطأ في القراءة: \`${msg}\``)] });
      }
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // name
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "name") {
      const value = interaction.options.getString("value", true);
      await runCmd(interaction, `تغيير الاسم إلى "${value}"`, ip => setPlayerName(ip, value));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // clan
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "clan") {
      const value = interaction.options.getString("value", true).slice(0, 4);
      await runCmd(interaction, `تغيير الـ Clan Tag إلى "${value}"`, ip => setClanTag(ip, value));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // fov
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "fov") {
      const value = interaction.options.getInteger("value", true);
      await runCmd(interaction, `FOV → ${value}°`, ip => setFOV(ip, value));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // fullbright
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "fullbright") {
      const on = interaction.options.getString("toggle", true) === "on";
      await runCmd(interaction, `Full Bright ${on ? "ON" : "OFF"}`, ip => setFullBright(ip, on));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // thirdperson
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "thirdperson") {
      const on = interaction.options.getString("toggle", true) === "on";
      await runCmd(interaction, `Third Person ${on ? "ON" : "OFF"}`, ip => setThirdPerson(ip, on));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // cinematic
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "cinematic") {
      const on = interaction.options.getString("toggle", true) === "on";
      await runCmd(interaction, `Cinematic Cam ${on ? "ON" : "OFF"}`, ip => setCinematicCam(ip, on));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // crosshair
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "crosshair") {
      const visible = interaction.options.getString("toggle", true) === "show";
      await runCmd(interaction, `Crosshair ${visible ? "ظاهر" : "مخفي"}`, ip => setCrosshair(ip, visible));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // hud
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "hud") {
      const r     = interaction.options.getInteger("r", true);
      const g     = interaction.options.getInteger("g", true);
      const b     = interaction.options.getInteger("b", true);
      const scale = interaction.options.getNumber("scale", false) ?? 1.0;
      await runCmd(interaction, `HUD → RGB(${r},${g},${b}) حجم ${scale}`, ip => setHUD(ip, r, g, b, scale));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // freeze
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "freeze") {
      const on = interaction.options.getString("toggle", true) === "on";
      await runCmd(interaction, on ? "تجميد اللاعبين" : "تحرير اللاعبين", ip => freezeAll(ip, on));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // kick
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "kick") {
      const slot = interaction.options.getInteger("slot", true);
      await runCmd(interaction, `طرد اللاعب في slot ${slot}`, ip => kickPlayer(ip, slot));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // restart
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "restart") {
      await runCmd(interaction, "إعادة تشغيل الجولة", ip => restartGame(ip));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // message
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "message") {
      const text = interaction.options.getString("text", true);
      await runCmd(interaction, `رسالة: "${text}"`, ip => sendGameMessage(ip, text));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // trickshot
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "trickshot") {
      const action = interaction.options.getString("action", true) as Parameters<typeof trickshotAction>[1];
      const labels: Record<string, string> = {
        low_gravity:    "جاذبية منخفضة",
        normal_gravity: "جاذبية عادية",
        speed_boost:    "سرعة عالية",
        normal_speed:   "سرعة عادية",
        high_jump:      "قفز عالي",
        normal_jump:    "قفز عادي",
        noclip_on:      "NoClip ON",
        noclip_off:     "NoClip OFF",
      };
      await runCmd(interaction, `Trickshot: ${labels[action] ?? action}`, ip => trickshotAction(ip, action));
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // notify
    // ════════════════════════════════════════════════════════════════════════
    if (sub === "notify") {
      const text = interaction.options.getString("text", true);
      await runCmd(interaction, `إشعار: "${text}"`, ip => sendNotify(ip, text));
      return;
    }
  },
};
