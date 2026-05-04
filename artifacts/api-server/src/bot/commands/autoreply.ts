import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  PermissionFlagsBits,
} from "discord.js";

interface AutoReplyEntry {
  trigger: string;
  response: string;
  caseSensitive: boolean;
  addedBy: string;
}

// Map<guildId, Map<trigger_lowercase, entry>>
export const autoRepliesStore = new Map<string, Map<string, AutoReplyEntry>>();

export function checkAutoReply(message: Message): void {
  if (!message.guild || message.author.bot) return;
  const guildReplies = autoRepliesStore.get(message.guild.id);
  if (!guildReplies || guildReplies.size === 0) return;

  const content = message.content;

  for (const [, entry] of guildReplies) {
    const messageText = entry.caseSensitive ? content : content.toLowerCase();
    const triggerText = entry.caseSensitive ? entry.trigger : entry.trigger.toLowerCase();

    if (messageText.includes(triggerText)) {
      message.reply(entry.response).catch(() => { /* channel might be deleted */ });
      return;
    }
  }
}

export const autoreplyCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("autoreply")
      .setDescription("⚡ نظام الرد التلقائي / Auto-reply system")
      .addSubcommand(sub =>
        sub.setName("add")
          .setDescription("إضافة رد تلقائي جديد / Add a new auto-reply (Admin only)")
          .addStringOption(opt =>
            opt.setName("trigger")
              .setDescription("الكلمة أو الجملة التي تُفعّل الرد / Trigger word or phrase")
              .setRequired(true)
          )
          .addStringOption(opt =>
            opt.setName("response")
              .setDescription("الرد الذي سيرسله البوت / Bot's response")
              .setRequired(true)
          )
          .addBooleanOption(opt =>
            opt.setName("case_sensitive")
              .setDescription("حساس لحالة الأحرف؟ (افتراضي: لا) / Case sensitive? (default: no)")
              .setRequired(false)
          )
      )
      .addSubcommand(sub =>
        sub.setName("remove")
          .setDescription("حذف رد تلقائي / Remove an auto-reply (Admin only)")
          .addStringOption(opt =>
            opt.setName("trigger")
              .setDescription("الجملة المُراد حذفها / Trigger to remove")
              .setRequired(true)
          )
      )
      .addSubcommand(sub =>
        sub.setName("list")
          .setDescription("عرض جميع الردود التلقائية / List all auto-replies")
      )
      .addSubcommand(sub =>
        sub.setName("clear")
          .setDescription("حذف جميع الردود التلقائية / Clear all auto-replies (Admin only)")
      )
      .addSubcommand(sub =>
        sub.setName("test")
          .setDescription("اختبر ما إذا كانت جملة تُفعّل رداً / Test if a phrase triggers a reply")
          .addStringOption(opt =>
            opt.setName("text")
              .setDescription("النص للاختبار / Text to test")
              .setRequired(true)
          )
      ),

    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) return interaction.reply({ content: "❌ السيرفرات فقط!", ephemeral: true });

      const sub = interaction.options.getSubcommand();
      const guildId = guild.id;

      if (sub === "add") {
        const member = await guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({ content: "❌ هذا الأمر للإدارة فقط!", ephemeral: true });
        }

        const trigger = interaction.options.getString("trigger", true).trim();
        const response = interaction.options.getString("response", true).trim();
        const caseSensitive = interaction.options.getBoolean("case_sensitive") ?? false;

        if (trigger.length > 100) {
          return interaction.reply({ content: "❌ الجملة طويلة جداً (الحد 100 حرف).", ephemeral: true });
        }
        if (response.length > 500) {
          return interaction.reply({ content: "❌ الرد طويل جداً (الحد 500 حرف).", ephemeral: true });
        }

        if (!autoRepliesStore.has(guildId)) autoRepliesStore.set(guildId, new Map());
        const guildReplies = autoRepliesStore.get(guildId)!;

        if (guildReplies.size >= 50) {
          return interaction.reply({ content: "❌ وصلت الحد الأقصى (50 رد تلقائي).", ephemeral: true });
        }

        guildReplies.set(trigger.toLowerCase(), {
          trigger,
          response,
          caseSensitive,
          addedBy: interaction.user.username,
        });

        const embed = new EmbedBuilder()
          .setTitle("✅ تمت إضافة الرد التلقائي")
          .setColor(0x2ecc71)
          .addFields(
            { name: "🔑 الجملة المُفعِّلة", value: `\`${trigger}\``, inline: true },
            { name: "💬 الرد", value: response.slice(0, 200), inline: true },
            { name: "🔠 حساس للأحرف", value: caseSensitive ? "نعم" : "لا", inline: true },
          )
          .setFooter({ text: `أضافه: ${interaction.user.username} • Bot_SUKz` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (sub === "remove") {
        const member = await guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({ content: "❌ هذا الأمر للإدارة فقط!", ephemeral: true });
        }

        const trigger = interaction.options.getString("trigger", true).trim();
        const guildReplies = autoRepliesStore.get(guildId);

        if (!guildReplies?.has(trigger.toLowerCase())) {
          return interaction.reply({ content: `❌ ما وجدت رداً لهذه الجملة: \`${trigger}\``, ephemeral: true });
        }

        guildReplies.delete(trigger.toLowerCase());

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("🗑️ تم حذف الرد التلقائي")
              .setDescription(`تم حذف الرد للجملة: \`${trigger}\``)
              .setColor(0xe74c3c)
              .setTimestamp(),
          ],
        });
        return;
      }

      if (sub === "list") {
        const guildReplies = autoRepliesStore.get(guildId);

        if (!guildReplies || guildReplies.size === 0) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle("📋 الردود التلقائية")
                .setDescription("لا توجد ردود تلقائية مضافة حالياً.\nاستخدم `/autoreply add` لإضافة رد.")
                .setColor(0x5865f2)
                .setTimestamp(),
            ],
          });
        }

        const entries = [...guildReplies.values()];
        const listText = entries
          .map((e, i) => `\`${i + 1}.\` **"${e.trigger}"** → ${e.response.slice(0, 60)}${e.response.length > 60 ? "..." : ""}`)
          .join("\n");

        const embed = new EmbedBuilder()
          .setTitle(`📋 الردود التلقائية — ${guildReplies.size} رد`)
          .setDescription(listText.slice(0, 4000))
          .setColor(0x5865f2)
          .setFooter({ text: "Bot_SUKz • Auto-Reply System" })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (sub === "clear") {
        const member = await guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({ content: "❌ هذا الأمر للإدارة فقط!", ephemeral: true });
        }

        const guildReplies = autoRepliesStore.get(guildId);
        const count = guildReplies?.size ?? 0;
        autoRepliesStore.set(guildId, new Map());

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("🗑️ تم مسح جميع الردود التلقائية")
              .setDescription(`تم حذف **${count}** رد تلقائي.`)
              .setColor(0xe74c3c)
              .setTimestamp(),
          ],
        });
        return;
      }

      if (sub === "test") {
        const text = interaction.options.getString("text", true);
        const guildReplies = autoRepliesStore.get(guildId);

        if (!guildReplies || guildReplies.size === 0) {
          return interaction.reply({ content: "❌ لا توجد ردود تلقائية مضافة.", ephemeral: true });
        }

        for (const [, entry] of guildReplies) {
          const messageText = entry.caseSensitive ? text : text.toLowerCase();
          const triggerText = entry.caseSensitive ? entry.trigger : entry.trigger.toLowerCase();

          if (messageText.includes(triggerText)) {
            await interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle("✅ نعم! هذا النص يُفعّل رداً تلقائياً")
                  .addFields(
                    { name: "🔑 الجملة المُفعِّلة", value: `\`${entry.trigger}\``, inline: true },
                    { name: "💬 الرد الذي سيظهر", value: entry.response, inline: false },
                  )
                  .setColor(0x2ecc71)
                  .setTimestamp(),
              ],
              ephemeral: true,
            });
            return;
          }
        }

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ لا يوجد رد مُفعَّل")
              .setDescription(`النص \`${text.slice(0, 100)}\` لا يُفعّل أي رد تلقائي حالياً.`)
              .setColor(0xe74c3c)
              .setTimestamp(),
          ],
          ephemeral: true,
        });
      }
    },
  },
];
