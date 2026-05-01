import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import crypto from "crypto";

export const utilityCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("avatar")
      .setDescription("Get a user's avatar")
      .addUserOption(opt => opt.setName("user").setDescription("User to get avatar of")),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Avatar`)
        .setImage(user.displayAvatarURL({ size: 4096 }))
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("serverinfo").setDescription("Get information about this server"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) return interaction.reply("This command can only be used in a server.");
      const embed = new EmbedBuilder()
        .setTitle(`📊 ${guild.name}`)
        .setThumbnail(guild.iconURL())
        .addFields(
          { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
          { name: "Members", value: `${guild.memberCount}`, inline: true },
          { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },
          { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
          { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "Boost Level", value: `${guild.premiumTier}`, inline: true },
        )
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("userinfo")
      .setDescription("Get information about a user")
      .addUserOption(opt => opt.setName("user").setDescription("User to get info about")),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const member = interaction.guild?.members.cache.get(user.id);
      const embed = new EmbedBuilder()
        .setTitle(`👤 ${user.username}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "ID", value: user.id, inline: true },
          { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "Joined Server", value: member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Unknown", inline: true },
          { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
        )
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("math")
      .setDescription("Solve a math expression")
      .addStringOption(opt => opt.setName("expression").setDescription("Math expression (e.g. 2+2, 10*5)").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const expr = interaction.options.getString("expression", true);
      try {
        const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, "");
        const result = Function(`"use strict"; return (${sanitized})`)();
        await interaction.reply(`🔢 \`${expr}\` = **${result}**`);
      } catch {
        await interaction.reply("❌ Invalid expression!");
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("remind")
      .setDescription("Set a reminder")
      .addStringOption(opt => opt.setName("message").setDescription("What to remind you about").setRequired(true))
      .addIntegerOption(opt => opt.setName("seconds").setDescription("Seconds until reminder").setRequired(true).setMinValue(1).setMaxValue(3600)),
    async execute(interaction: ChatInputCommandInteraction) {
      const message = interaction.options.getString("message", true);
      const seconds = interaction.options.getInteger("seconds", true);
      await interaction.reply(`⏰ I'll remind you about: **"${message}"** in ${seconds} seconds!`);
      setTimeout(async () => {
        await interaction.followUp(`⏰ **Reminder:** ${interaction.user}, ${message}`);
      }, seconds * 1000);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("poll")
      .setDescription("Create a poll")
      .addStringOption(opt => opt.setName("question").setDescription("The poll question").setRequired(true))
      .addStringOption(opt => opt.setName("options").setDescription("Options separated by comma (e.g. Yes,No,Maybe)").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const question = interaction.options.getString("question", true);
      const optionsRaw = interaction.options.getString("options", true);
      const options = optionsRaw.split(",").map(o => o.trim()).slice(0, 10);
      const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
      const embed = new EmbedBuilder()
        .setTitle(`📊 Poll: ${question}`)
        .setDescription(options.map((o, i) => `${emojis[i]} ${o}`).join("\n"))
        .setColor(0x5865f2)
        .setFooter({ text: `Poll by ${interaction.user.username}` });
      const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
      for (let i = 0; i < options.length; i++) {
        await msg.react(emojis[i]!);
      }
    },
  },
  {
    data: new SlashCommandBuilder().setName("timestamp").setDescription("Get the current Unix timestamp"),
    async execute(interaction: ChatInputCommandInteraction) {
      const now = Math.floor(Date.now() / 1000);
      await interaction.reply(`🕐 **Current Timestamp:** \`${now}\`\n**Formatted:** <t:${now}:F>`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("color")
      .setDescription("Get info about a hex color")
      .addStringOption(opt => opt.setName("hex").setDescription("Hex color code (e.g. #ff5733)").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const hex = interaction.options.getString("hex", true).replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const embed = new EmbedBuilder()
        .setTitle(`🎨 Color: #${hex}`)
        .addFields(
          { name: "HEX", value: `#${hex}`, inline: true },
          { name: "RGB", value: `rgb(${r}, ${g}, ${b})`, inline: true },
          { name: "Decimal", value: `${parseInt(hex, 16)}`, inline: true },
        )
        .setColor(parseInt(hex, 16));
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("base64")
      .setDescription("Encode or decode Base64")
      .addStringOption(opt => opt.setName("text").setDescription("Text to encode/decode").setRequired(true))
      .addStringOption(opt => opt.setName("mode").setDescription("encode or decode").setRequired(true).addChoices(
        { name: "Encode", value: "encode" },
        { name: "Decode", value: "decode" },
      )),
    async execute(interaction: ChatInputCommandInteraction) {
      const text = interaction.options.getString("text", true);
      const mode = interaction.options.getString("mode", true);
      try {
        const result = mode === "encode" ? Buffer.from(text).toString("base64") : Buffer.from(text, "base64").toString("utf-8");
        await interaction.reply(`🔐 **${mode === "encode" ? "Encoded" : "Decoded"}:** \`${result}\``);
      } catch {
        await interaction.reply("❌ Invalid input for decoding!");
      }
    },
  },
];
