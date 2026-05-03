import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ButtonInteraction,
  TextChannel,
  Guild,
  User,
} from "discord.js";

let ticketCounter = 0;

const catEmoji: Record<string, string> = {
  technical: "🛠️", report: "🚨", financial: "💰",
  general: "❓", games: "🎮", partner: "🤝",
};
const catName: Record<string, string> = {
  technical: "دعم تقني", report: "إبلاغ", financial: "مشكلة مالية",
  general: "استفسار", games: "دعم ألعاب", partner: "شراكة",
};

async function createTicketChannel(
  guild: Guild,
  user: User,
  subject: string,
  category: string,
): Promise<TextChannel> {
  ticketCounter++;
  const num = String(ticketCounter).padStart(4, "0");
  const safe = user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "user";
  const channelName = `ticket-${num}-${safe}`;

  const ticketsCategory = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory &&
         (c.name.toLowerCase().includes("ticket") || c.name.includes("تذاكر")),
  );

  const overwrites: import("discord.js").OverwriteResolvable[] = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: guild.client.user!.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  const adminRoles = guild.roles.cache.filter(r =>
    !r.managed && r.id !== guild.id && r.permissions.has(PermissionFlagsBits.ManageGuild),
  );
  for (const [, role] of adminRoles) {
    overwrites.push({
      id: role.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  const ticketChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: ticketsCategory?.id,
    topic: `تذكرة #${num} | ${user.tag} | ${subject}`,
    permissionOverwrites: overwrites,
  }) as TextChannel;

  const embed = new EmbedBuilder()
    .setTitle(`🎫 تذكرة #${num}`)
    .setDescription(`> **${subject}**\n\n📝 اكتب مشكلتك بالتفصيل وسيرد عليك الدعم قريباً.`)
    .addFields(
      { name: "👤 المستخدم", value: `<@${user.id}>`, inline: true },
      { name: "📂 الفئة", value: `${catEmoji[category] ?? "❓"} ${catName[category] ?? "عام"}`, inline: true },
      { name: "🕐 الوقت", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
      { name: "⏳ الحالة", value: "🟡 مفتوحة", inline: true },
    )
    .setColor(0x5865f2)
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: "Bot_SUKz • Ticket System" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`claim_ticket_${ticketChannel.id}`).setLabel("✋ استلام").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`transcript_ticket_${ticketChannel.id}`).setLabel("📋 نسخة").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`close_ticket_${ticketChannel.id}`).setLabel("🔒 إغلاق").setStyle(ButtonStyle.Danger),
  );

  await ticketChannel.send({
    content: `👋 أهلاً <@${user.id}>! تذكرتك **#${num}** جاهزة — اكتب مشكلتك هنا.`,
    embeds: [embed],
    components: [row],
  });

  return ticketChannel;
}

function hasOpenTicket(guild: Guild, user: User): TextChannel | undefined {
  const safe = user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  return guild.channels.cache.find(
    c => c.type === ChannelType.GuildText && c.name.startsWith("ticket-") && c.name.endsWith(`-${safe}`),
  ) as TextChannel | undefined;
}

export const ticketsCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("ticket")
      .setDescription("🎫 نظام التذاكر / Ticket System")
      .addSubcommand(sub =>
        sub.setName("setup")
          .setDescription("إنشاء لوحة التذاكر في قناة (للإدارة فقط) / Setup ticket panel")
          .addChannelOption(opt =>
            opt.setName("channel").setDescription("القناة التي تظهر فيها اللوحة (اتركه فارغاً للقناة الحالية)").setRequired(false)
          )
          .addStringOption(opt =>
            opt.setName("title").setDescription("عنوان اللوحة (اختياري)").setRequired(false)
          )
      )
      .addSubcommand(sub =>
        sub.setName("open")
          .setDescription("فتح تذكرة مباشرة / Open a ticket directly")
          .addStringOption(opt => opt.setName("subject").setDescription("موضوع مشكلتك").setRequired(true))
          .addStringOption(opt =>
            opt.setName("category")
              .setDescription("نوع المشكلة")
              .setRequired(false)
              .addChoices(
                { name: "🛠️ دعم تقني", value: "technical" },
                { name: "🚨 إبلاغ", value: "report" },
                { name: "💰 مشكلة مالية", value: "financial" },
                { name: "❓ استفسار عام", value: "general" },
                { name: "🎮 دعم ألعاب", value: "games" },
                { name: "🤝 شراكة", value: "partner" },
              )
          )
      )
      .addSubcommand(sub =>
        sub.setName("close")
          .setDescription("إغلاق التذكرة الحالية / Close the current ticket")
      )
      .addSubcommand(sub =>
        sub.setName("add")
          .setDescription("إضافة شخص للتذكرة الحالية / Add someone to this ticket")
          .addUserOption(opt => opt.setName("user").setDescription("المستخدم").setRequired(true))
      ),

    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) return interaction.reply({ content: "❌ السيرفرات فقط!", ephemeral: true });

      const sub = interaction.options.getSubcommand();

      if (sub === "setup") {
        const member = await guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({ content: "❌ هذا الأمر للإدارة فقط!", ephemeral: true });
        }

        const targetChannel = (interaction.options.getChannel("channel") as TextChannel | null) ?? interaction.channel as TextChannel;
        const customTitle = interaction.options.getString("title") ?? "🎫 فتح تذكرة دعم";

        const panelEmbed = new EmbedBuilder()
          .setTitle(customTitle)
          .setDescription(
            "**مرحباً بك في نظام الدعم!** 👋\n\n" +
            "اضغط على الزر أدناه لفتح تذكرة دعم خاصة بك.\n" +
            "سيتم إنشاء قناة خاصة بينك وبين فريق الدعم مباشرةً.\n\n" +
            "**📋 أنواع الدعم:**\n" +
            "🛠️ دعم تقني  •  🚨 إبلاغ  •  💰 مشكلة مالية\n" +
            "❓ استفسار  •  🎮 دعم ألعاب  •  🤝 شراكة",
          )
          .setColor(0x5865f2)
          .setFooter({ text: "Bot_SUKz • Ticket System • اضغط الزر لفتح تذكرة" })
          .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("open_ticket_panel")
            .setLabel("🎫 فتح تذكرة")
            .setStyle(ButtonStyle.Primary),
        );

        await targetChannel.send({ embeds: [panelEmbed], components: [row] });
        await interaction.reply({ content: `✅ تم إنشاء لوحة التذاكر في ${targetChannel}`, ephemeral: true });
        return;
      }

      if (sub === "open") {
        const subject = interaction.options.getString("subject", true);
        const category = interaction.options.getString("category") ?? "general";

        await interaction.deferReply({ ephemeral: true });

        const existing = hasOpenTicket(guild, interaction.user);
        if (existing) {
          return interaction.editReply({ content: `⚠️ لديك تذكرة مفتوحة بالفعل في <#${existing.id}>` });
        }

        try {
          const ch = await createTicketChannel(guild, interaction.user, subject, category);
          await interaction.editReply({ content: `✅ تم فتح تذكرتك في <#${ch.id}> 🎫` });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await interaction.editReply({ content: `❌ فشل إنشاء التذكرة: \`${msg.slice(0, 200)}\`` });
        }
        return;
      }

      if (sub === "close") {
        const ch = interaction.channel as TextChannel;
        if (!ch.name.startsWith("ticket-")) {
          return interaction.reply({ content: "❌ هذا الأمر يعمل فقط داخل قنوات التذاكر!", ephemeral: true });
        }
        const closeEmbed = new EmbedBuilder()
          .setTitle("🔒 جاري إغلاق التذكرة...")
          .setDescription(`طلب الإغلاق: <@${interaction.user.id}>\nسيتم حذف هذه القناة خلال **5 ثواني**.`)
          .setColor(0xe74c3c)
          .setTimestamp();
        await interaction.reply({ embeds: [closeEmbed] });
        setTimeout(() => ch.delete().catch(() => {}), 5000);
        return;
      }

      if (sub === "add") {
        const targetUser = interaction.options.getUser("user", true);
        const ch = interaction.channel as TextChannel;
        if (!ch.name.startsWith("ticket-")) {
          return interaction.reply({ content: "❌ هذا الأمر يعمل فقط داخل قنوات التذاكر!", ephemeral: true });
        }
        await ch.permissionOverwrites.create(targetUser.id, {
          ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
        });
        await interaction.reply({ content: `✅ تمت إضافة <@${targetUser.id}> لهذه التذكرة.` });
        return;
      }
    },
  },
];

export async function handleTicketButton(interaction: ButtonInteraction): Promise<void> {
  const { customId, user, guild } = interaction;

  if (customId === "open_ticket_panel") {
    if (!guild) { await interaction.reply({ content: "❌ سيرفر فقط!", ephemeral: true }); return; }

    const existing = hasOpenTicket(guild, user);
    if (existing) {
      await interaction.reply({ content: `⚠️ لديك تذكرة مفتوحة بالفعل في <#${existing.id}>`, ephemeral: true });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true });
      const ch = await createTicketChannel(guild, user, "اكتب مشكلتك هنا 👇", "general");
      await interaction.editReply({ content: `✅ تم فتح قناة تذكرتك في <#${ch.id}> — اكتب مشكلتك هناك! 🎫` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      try { await interaction.editReply({ content: `❌ فشل: \`${msg.slice(0, 200)}\`` }); } catch { /* ignore */ }
    }
    return;
  }

  if (customId.startsWith("claim_ticket_")) {
    const claimedEmbed = new EmbedBuilder()
      .setTitle("✅ تم استلام التذكرة")
      .setDescription(`استلمها: <@${user.id}>\nسيتواصل معك فريق الدعم قريباً 🙏`)
      .setColor(0x2ecc71)
      .setTimestamp();
    const disabledClaim = new ButtonBuilder()
      .setCustomId("claimed_disabled")
      .setLabel(`✋ استُلمت بواسطة ${user.username}`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(true);
    const closeBtn = new ButtonBuilder()
      .setCustomId(`close_ticket_${customId.replace("claim_ticket_", "")}`)
      .setLabel("🔒 إغلاق")
      .setStyle(ButtonStyle.Danger);
    const transcriptBtn = new ButtonBuilder()
      .setCustomId(`transcript_ticket_${customId.replace("claim_ticket_", "")}`)
      .setLabel("📋 نسخة")
      .setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(disabledClaim, transcriptBtn, closeBtn);
    await interaction.update({ components: [row] });
    await interaction.followUp({ embeds: [claimedEmbed] });
    return;
  }

  if (customId.startsWith("transcript_ticket_")) {
    const embed = new EmbedBuilder()
      .setTitle("📋 نسخة التذكرة")
      .setDescription(`طلبها: <@${user.id}>\n*ميزة التصدير الكاملة قادمة قريباً*`)
      .addFields(
        { name: "القناة", value: interaction.channel?.toString() ?? "غير معروف", inline: true },
        { name: "التاريخ", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      )
      .setColor(0x5865f2)
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (customId.startsWith("close_ticket_")) {
    const closingEmbed = new EmbedBuilder()
      .setTitle("🔒 جاري إغلاق التذكرة...")
      .setDescription(`طلب الإغلاق: <@${user.id}>\nسيتم حذف هذه القناة خلال **5 ثواني** ⏳`)
      .setColor(0xe74c3c)
      .setTimestamp();
    await interaction.reply({ embeds: [closingEmbed] });
    setTimeout(async () => {
      try {
        const ch = interaction.channel as TextChannel;
        if (ch && "delete" in ch) await ch.delete();
      } catch { /* already deleted */ }
    }, 5000);
  }
}
