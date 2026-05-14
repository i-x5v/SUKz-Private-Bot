import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  MessageFlags,
} from "discord.js";

// ── بيانات الألعاب والمابات ─────────────────────────────────────────────────

interface GameEntry {
  label: string;
  shortName: string;
  map: string;
  image: string;
  color: number;
}

export const CHALLENGE_GAMES: Record<string, GameEntry> = {
  cod4: {
    label: "COD 4: Modern Warfare",
    shortName: "COD 4",
    map: "Shipment",
    image: "https://static.wikia.nocookie.net/callofduty/images/2/28/Shipment_CoD4MW.jpg",
    color: 0x8B0000,
  },
  cod5: {
    label: "COD 5: World at War",
    shortName: "COD 5",
    map: "Dome",
    image: "https://static.wikia.nocookie.net/callofduty/images/1/16/Dome_WaW_loading_screen.jpg",
    color: 0x5C4033,
  },
  mw2: {
    label: "COD 6: Modern Warfare 2",
    shortName: "COD 6 MW2",
    map: "Rust",
    image: "https://static.wikia.nocookie.net/callofduty/images/5/56/Rust_loading_screen_MW2.jpg",
    color: 0x4A4A4A,
  },
  bo1: {
    label: "COD 7: Black Ops 1",
    shortName: "COD 7 BO1",
    map: "Firing Range",
    image: "https://static.wikia.nocookie.net/callofduty/images/0/07/Firing_Range_loading_screen_BO.jpg",
    color: 0x1A1A2E,
  },
  mw3: {
    label: "COD 8: Modern Warfare 3",
    shortName: "COD 8 MW3",
    map: "Dome",
    image: "https://static.wikia.nocookie.net/callofduty/images/6/66/Dome_MW3_loading_screen.jpg",
    color: 0x2C3E50,
  },
  bo2: {
    label: "COD 9: Black Ops 2",
    shortName: "COD 9 BO2",
    map: "Nuketown 2025",
    image: "https://static.wikia.nocookie.net/callofduty/images/b/b5/Nuketown_2025_loading_screen_BO2.jpg",
    color: 0x0D47A1,
  },
  ghosts: {
    label: "COD 10: Ghosts",
    shortName: "COD 10 Ghosts",
    map: "Strikezone",
    image: "https://static.wikia.nocookie.net/callofduty/images/7/7d/Strike_Zone_loading_screen_CoDG.jpg",
    color: 0x263238,
  },
  aw: {
    label: "COD 11: Advanced Warfare",
    shortName: "COD 11 AW",
    map: "Solar",
    image: "https://static.wikia.nocookie.net/callofduty/images/0/05/Solar_loading_screen_AW.jpg",
    color: 0x00897B,
  },
  bo3: {
    label: "COD 12: Black Ops 3",
    shortName: "COD 12 BO3",
    map: "Combine",
    image: "https://static.wikia.nocookie.net/callofduty/images/a/a8/Combine_loading_screen_BO3.jpg",
    color: 0x0288D1,
  },
};

const PLATFORM_EMOJI: Record<string, string> = {
  ps3:    "🎮 PlayStation 3",
  xbox360: "🟩 Xbox 360",
  pc:     "🖥️ PC",
};

const RULES = [
  "🎯 التحدي سنايبر فقط (Sniper Only)",
  "🚫 ممنوع الغش بأي شكل",
  "🤐 ممنوع السب والإهانة",
  "🔄 إعادة القيم باتفاق الطرفين فقط",
  "🤝 احترام الخصم في جميع الأوقات",
  "📸 الفائز يثبت النتيجة بصورة",
];

// ── الأمر ───────────────────────────────────────────────────────────────────

export const challengeCommand = {
  data: new SlashCommandBuilder()
    .setName("challenge")
    .setDescription("⚔️ تحدى شخصاً آخر في سنايبر 1v1!")
    .addStringOption(opt =>
      opt
        .setName("game")
        .setDescription("اختر جزء Call of Duty")
        .setRequired(true)
        .addChoices(
          { name: "COD 4: Modern Warfare",   value: "cod4"   },
          { name: "COD 5: World at War",      value: "cod5"   },
          { name: "COD 6: Modern Warfare 2",  value: "mw2"    },
          { name: "COD 7: Black Ops 1",       value: "bo1"    },
          { name: "COD 8: Modern Warfare 3",  value: "mw3"    },
          { name: "COD 9: Black Ops 2",       value: "bo2"    },
          { name: "COD 10: Ghosts",           value: "ghosts" },
          { name: "COD 11: Advanced Warfare", value: "aw"     },
          { name: "COD 12: Black Ops 3",      value: "bo3"    },
        )
    )
    .addStringOption(opt =>
      opt
        .setName("platform")
        .setDescription("اختر الجهاز")
        .setRequired(true)
        .addChoices(
          { name: "🎮 PlayStation 3", value: "ps3"     },
          { name: "🟩 Xbox 360",      value: "xbox360" },
          { name: "🖥️ PC",            value: "pc"      },
        )
    )
    .addUserOption(opt =>
      opt
        .setName("opponent")
        .setDescription("اختر الشخص الذي تريد تحديه")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const gameKey   = interaction.options.getString("game", true);
    const platform  = interaction.options.getString("platform", true);
    const opponent  = interaction.options.getUser("opponent", true);
    const challenger = interaction.user;

    if (opponent.id === challenger.id) {
      await interaction.reply({ content: "❌ لا تقدر تتحدى نفسك!", flags: MessageFlags.Ephemeral });
      return;
    }
    if (opponent.bot) {
      await interaction.reply({ content: "❌ لا تقدر تتحدى بوت!", flags: MessageFlags.Ephemeral });
      return;
    }

    const game = CHALLENGE_GAMES[gameKey]!;
    const platformLabel = PLATFORM_EMOJI[platform]!;
    const challengeId   = `${challenger.id}_${opponent.id}_${Date.now()}`;

    const embed = new EmbedBuilder()
      .setTitle("⚔️ تحدي سنايبر 1v1!")
      .setColor(game.color)
      .setImage(game.image)
      .addFields(
        { name: "🎮 اللعبة",    value: `\`${game.label}\``,          inline: true },
        { name: "📺 الجهاز",   value: platformLabel,                  inline: true },
        { name: "🗺️ الماب",    value: `\`${game.map}\``,              inline: true },
        { name: "🔫 نوع التحدي", value: "**Sniper 1v1**",             inline: true },
        { name: "⚔️ المتحدي",  value: `<@${challenger.id}>`,         inline: true },
        { name: "🎯 الخصم",    value: `<@${opponent.id}>`,            inline: true },
        {
          name: "📋 القوانين",
          value: RULES.map(r => `> ${r}`).join("\n"),
          inline: false,
        },
      )
      .setFooter({ text: `تحدي رسمي • SUKz Bot | الأزرار تنتهي بعد 5 دقائق` })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`challenge_accept_${challengeId}`)
        .setLabel("✅ قبول التحدي")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`challenge_decline_${challengeId}`)
        .setLabel("❌ رفض التحدي")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`challenge_later_${challengeId}`)
        .setLabel("⏰ في وقت لاحق")
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      content: `🔔 <@${opponent.id}> — لديك تحدي من <@${challenger.id}>!`,
      embeds: [embed],
      components: [row],
    });

    // ── تعطيل الأزرار بعد 5 دقائق تلقائياً ───────────────────────────────
    setTimeout(async () => {
      try {
        const msg = await interaction.fetchReply();
        const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          ButtonBuilder.from(row.components[0]!).setDisabled(true),
          ButtonBuilder.from(row.components[1]!).setDisabled(true),
          ButtonBuilder.from(row.components[2]!).setDisabled(true),
        );
        await interaction.editReply({ components: [disabledRow] });
      } catch { /* رسالة محذوفة أو منتهية */ }
    }, 5 * 60 * 1000);
  },
};

// ── معالج أزرار التحدي ──────────────────────────────────────────────────────

export async function handleChallengeButton(btn: ButtonInteraction): Promise<void> {
  const parts   = btn.customId.split("_");
  // format: challenge_{action}_{challengerId}_{opposentId}_{timestamp}
  const action       = parts[1]!;
  const challengerId = parts[2]!;
  const opponentId   = parts[3]!;

  // فقط الخصم يقدر يضغط
  if (btn.user.id !== opponentId) {
    await btn.reply({
      content: "❌ هذه الأزرار للخصم فقط!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // تعطيل الأزرار فوراً بعد الضغط
  const original = btn.message.components[0];
  if (original) {
    const disabledRow = ActionRowBuilder.from(original as Parameters<typeof ActionRowBuilder.from>[0]);
    (disabledRow.components as ButtonBuilder[]).forEach(c => {
      if (c instanceof ButtonBuilder) c.setDisabled(true);
    });
    await btn.update({ components: [disabledRow as ActionRowBuilder<ButtonBuilder>] });
  }

  if (action === "accept") {
    await btn.followUp({
      content:
        `✅ **تم قبول التحدي!**\n` +
        `<@${opponentId}> قبل تحدي <@${challengerId}> — حضّروا للمباراة! 🔥`,
    });
  } else if (action === "decline") {
    await btn.followUp({
      content:
        `❌ **تم رفض التحدي.**\n` +
        `<@${opponentId}> رفض تحدي <@${challengerId}>.`,
    });
  } else if (action === "later") {
    await btn.followUp({
      content:
        `⏰ **التحدي تأجل لوقت آخر.**\n` +
        `<@${opponentId}> طلب تأجيل التحدي مع <@${challengerId}>.`,
    });
  }
}
