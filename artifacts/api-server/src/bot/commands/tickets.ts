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
} from "discord.js";

export const ticketsCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("ticket")
      .setDescription("إنشاء تذكرة دعم / Create a support ticket")
      .addStringOption(opt =>
        opt.setName("subject")
          .setDescription("موضوع التذكرة / Ticket subject")
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName("category")
          .setDescription("نوع المشكلة / Problem type")
          .setRequired(true)
          .addChoices(
            { name: "🛠️ دعم تقني / Technical Support", value: "technical" },
            { name: "🚨 إبلاغ عن مشكلة / Report Issue", value: "report" },
            { name: "💰 مشكلة مالية / Financial Issue", value: "financial" },
            { name: "❓ استفسار عام / General Inquiry", value: "general" },
            { name: "🎮 دعم الألعاب / Game Support", value: "games" },
            { name: "🤝 شراكة / Partnership", value: "partner" },
          )
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const subject = interaction.options.getString("subject", true);
      const category = interaction.options.getString("category", true);
      const guild = interaction.guild;
      if (!guild) return interaction.reply({ content: "❌ هذا الأمر يعمل فقط في السيرفرات!", ephemeral: true });

      await interaction.deferReply({ ephemeral: true });

      const categoryNames: Record<string, string> = {
        technical: "🛠️ دعم تقني",
        report: "🚨 إبلاغ",
        financial: "💰 مشكلة مالية",
        general: "❓ استفسار عام",
        games: "🎮 دعم ألعاب",
        partner: "🤝 شراكة",
      };
      const categoryColors: Record<string, number> = {
        technical: 0xff6b35,
        report: 0xe74c3c,
        financial: 0xf1c40f,
        general: 0x5865f2,
        games: 0x00b4d8,
        partner: 0x2ecc71,
      };

      try {
        const ticketChannel = await guild.channels.create({
          name: `🎫┃${interaction.user.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
              ],
            },
          ],
          topic: `تذكرة بواسطة ${interaction.user.tag} | الموضوع: ${subject} | الفئة: ${categoryNames[category]}`,
        });

        const ticketId = `#${ticketChannel.id.slice(-5).toUpperCase()}`;

        const bannerEmbed = new EmbedBuilder()
          .setColor(categoryColors[category] ?? 0x5865f2)
          .setTitle(`${categoryNames[category]} — تذكرة جديدة`)
          .setDescription(
            `> مرحباً ${interaction.user}! وصلت تذكرتك بنجاح ✅\n` +
            `> سيقوم فريق الدعم بمساعدتك في أقرب وقت ممكن.\n` +
            `> من فضلك اشرح مشكلتك بالتفصيل أدناه.`
          )
          .addFields(
            { name: "👤 المستخدم", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
            { name: "🆔 رقم التذكرة", value: ticketId, inline: true },
            { name: "📂 الفئة", value: categoryNames[category] ?? category, inline: true },
            { name: "📝 الموضوع", value: subject },
            { name: "📅 تاريخ الفتح", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
            { name: "⏳ الحالة", value: "🟡 قيد الانتظار", inline: true },
          )
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: "Bot_SUKz Support System • يمكنك إرفاق صور أو ملفات للشرح" })
          .setTimestamp();

        const claimBtn = new ButtonBuilder()
          .setCustomId(`claim_ticket_${ticketChannel.id}`)
          .setLabel("✋ استلام")
          .setStyle(ButtonStyle.Success);

        const closeBtn = new ButtonBuilder()
          .setCustomId(`close_ticket_${ticketChannel.id}`)
          .setLabel("🔒 إغلاق التذكرة")
          .setStyle(ButtonStyle.Danger);

        const transcriptBtn = new ButtonBuilder()
          .setCustomId(`transcript_ticket_${ticketChannel.id}`)
          .setLabel("📋 حفظ النسخة")
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(claimBtn, transcriptBtn, closeBtn);

        await ticketChannel.send({
          content: `${interaction.user} — مرحباً بك في تذكرتك! 👋`,
          embeds: [bannerEmbed],
          components: [row],
        });

        const successEmbed = new EmbedBuilder()
          .setTitle("✅ تم إنشاء التذكرة!")
          .setDescription(`تم فتح تذكرتك بنجاح في ${ticketChannel}\n**رقم التذكرة:** ${ticketId}`)
          .setColor(0x2ecc71)
          .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await interaction.editReply({ content: `❌ فشل إنشاء التذكرة: \`${msg.slice(0, 200)}\`` });
      }
    },
  },
];

export async function handleTicketButton(interaction: ButtonInteraction): Promise<void> {
  const { customId, user, channel } = interaction;

  if (customId.startsWith("claim_ticket_")) {
    const claimedEmbed = new EmbedBuilder()
      .setTitle("✋ تم استلام التذكرة")
      .setDescription(`تم استلام هذه التذكرة بواسطة ${user}\nسيتم التواصل معك قريباً إن شاء الله 🙏`)
      .setColor(0x2ecc71)
      .setTimestamp();
    const disabledClaim = new ButtonBuilder()
      .setCustomId("claimed_disabled")
      .setLabel(`✋ استُلمت بواسطة ${user.username}`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(true);
    const closeBtn = new ButtonBuilder()
      .setCustomId(`close_ticket_${customId.replace("claim_ticket_", "")}`)
      .setLabel("🔒 إغلاق التذكرة")
      .setStyle(ButtonStyle.Danger);
    const transcriptBtn = new ButtonBuilder()
      .setCustomId(`transcript_ticket_${customId.replace("claim_ticket_", "")}`)
      .setLabel("📋 حفظ النسخة")
      .setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(disabledClaim, transcriptBtn, closeBtn);
    await interaction.update({ components: [row] });
    await interaction.followUp({ embeds: [claimedEmbed] });
    return;
  }

  if (customId.startsWith("transcript_ticket_")) {
    const embed = new EmbedBuilder()
      .setTitle("📋 نسخة التذكرة")
      .setDescription(`تم طلب حفظ نسخة من التذكرة بواسطة ${user}\n*ملاحظة: ميزة التصدير الكاملة ستكون متاحة قريباً*`)
      .addFields(
        { name: "القناة", value: channel?.toString() ?? "غير معروف", inline: true },
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
      .setDescription(`طلب إغلاق التذكرة: ${user}\nسيتم حذف هذه القناة خلال **5 ثواني** ⏳`)
      .setColor(0xe74c3c)
      .setTimestamp();

    const confirmClose = new ButtonBuilder()
      .setCustomId("confirm_close")
      .setLabel("✅ تأكيد الإغلاق")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true);
    const cancelClose = new ButtonBuilder()
      .setCustomId("cancel_close")
      .setLabel("❌ إلغاء")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmClose, cancelClose);

    await interaction.reply({ embeds: [closingEmbed], components: [row] });

    setTimeout(async () => {
      try {
        if (channel && "delete" in channel) {
          await (channel as TextChannel).delete("Ticket closed by " + user.tag);
        }
      } catch { /* already deleted */ }
    }, 5000);
  }
}
