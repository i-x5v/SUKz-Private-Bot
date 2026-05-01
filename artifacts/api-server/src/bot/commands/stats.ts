import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export const statsCommands = [
  {
    data: new SlashCommandBuilder().setName("serverstats").setDescription("Show detailed server statistics"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) return interaction.reply("This command can only be used in a server.");
      const bots = guild.members.cache.filter(m => m.user.bot).size;
      const humans = guild.memberCount - bots;
      const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
      const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
      const embed = new EmbedBuilder()
        .setTitle(`📊 Server Statistics — ${guild.name}`)
        .setThumbnail(guild.iconURL())
        .addFields(
          { name: "👥 Total Members", value: `${guild.memberCount}`, inline: true },
          { name: "🧑 Humans", value: `${humans}`, inline: true },
          { name: "🤖 Bots", value: `${bots}`, inline: true },
          { name: "💬 Text Channels", value: `${textChannels}`, inline: true },
          { name: "🔊 Voice Channels", value: `${voiceChannels}`, inline: true },
          { name: "🎭 Roles", value: `${guild.roles.cache.size}`, inline: true },
          { name: "😀 Emojis", value: `${guild.emojis.cache.size}`, inline: true },
          { name: "🚀 Boost Level", value: `Level ${guild.premiumTier}`, inline: true },
          { name: "📅 Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        )
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("userstats")
      .setDescription("Show stats for a user")
      .addUserOption(opt => opt.setName("user").setDescription("User to check")),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const member = interaction.guild?.members.cache.get(user.id);
      const embed = new EmbedBuilder()
        .setTitle(`📊 User Stats — ${user.username}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "🆔 ID", value: user.id, inline: true },
          { name: "🤖 Bot", value: user.bot ? "Yes" : "No", inline: true },
          { name: "📅 Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "📥 Joined Server", value: member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Unknown", inline: true },
          { name: "🎭 Roles", value: `${member?.roles.cache.size ?? 0}`, inline: true },
          { name: "💬 Highest Role", value: member?.roles.highest.name ?? "None", inline: true },
        )
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("botstats").setDescription("Show bot performance statistics"),
    async execute(interaction: ChatInputCommandInteraction) {
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const mem = process.memoryUsage();
      const embed = new EmbedBuilder()
        .setTitle("🤖 Bot Statistics")
        .setThumbnail(interaction.client.user?.displayAvatarURL() ?? null)
        .addFields(
          { name: "⏱️ Uptime", value: `${days}d ${hours}h ${minutes}m`, inline: true },
          { name: "🌐 Servers", value: `${interaction.client.guilds.cache.size}`, inline: true },
          { name: "👥 Users", value: `${interaction.client.users.cache.size}`, inline: true },
          { name: "📡 Ping", value: `${interaction.client.ws.ping}ms`, inline: true },
          { name: "💾 RAM Usage", value: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`, inline: true },
          { name: "📦 Node.js", value: process.version, inline: true },
          { name: "🔧 Commands", value: "120", inline: true },
          { name: "📚 Library", value: "discord.js v14", inline: true },
        )
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("channelstats").setDescription("Show stats for this channel"),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = interaction.channel;
      if (!channel) return interaction.reply("Channel not found!");
      const embed = new EmbedBuilder()
        .setTitle(`📊 Channel Stats`)
        .addFields(
          { name: "📋 Name", value: channel.isDMBased() ? "DM" : `#${(channel as import("discord.js").TextChannel).name}`, inline: true },
          { name: "🆔 ID", value: channel.id, inline: true },
          { name: "📅 Created", value: `<t:${Math.floor(channel.createdTimestamp! / 1000)}:R>`, inline: true },
          { name: "📂 Type", value: `${channel.type}`, inline: true },
        )
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("emojistats").setDescription("Show server emoji statistics"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guild = interaction.guild;
      if (!guild) return interaction.reply("This command can only be used in a server.");
      const animated = guild.emojis.cache.filter(e => e.animated === true).size;
      const staticEmoji = guild.emojis.cache.filter(e => !e.animated).size;
      const embed = new EmbedBuilder()
        .setTitle(`😀 Emoji Stats — ${guild.name}`)
        .addFields(
          { name: "Total Emojis", value: `${guild.emojis.cache.size}`, inline: true },
          { name: "Static", value: `${staticEmoji}`, inline: true },
          { name: "Animated", value: `${animated}`, inline: true },
        )
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("commandstats").setDescription("Show command usage statistics"),
    async execute(interaction: ChatInputCommandInteraction) {
      const embed = new EmbedBuilder()
        .setTitle("📊 Command Statistics")
        .setDescription("Connect a database to track real command usage statistics!")
        .addFields(
          { name: "Total Commands", value: "120", inline: true },
          { name: "Most Used", value: "/ping", inline: true },
          { name: "Total Uses", value: "Connect DB", inline: true },
        )
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
];
