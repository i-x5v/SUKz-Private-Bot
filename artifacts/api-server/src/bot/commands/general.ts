import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export const generalCommands = [
  {
    data: new SlashCommandBuilder().setName("ping").setDescription("Check the bot's latency"),
    async execute(interaction: ChatInputCommandInteraction) {
      const sent = await interaction.reply({ content: "Pinging...", fetchReply: true });
      await interaction.editReply(`Pong! Latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("hello").setDescription("Say hello to the bot"),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.reply(`Hello, ${interaction.user.username}! 👋`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("help").setDescription("Show all available commands"),
    async execute(interaction: ChatInputCommandInteraction) {
      const embed = new EmbedBuilder()
        .setTitle("📋 Available Commands")
        .setDescription("Here are all the available commands:")
        .addFields(
          { name: "🌐 General", value: "/ping, /hello, /help, /info, /uptime, /invite, /support, /feedback" },
          { name: "🎉 Fun", value: "/joke, /meme, /8ball, /flip, /roll, /rps, /quote, /fact, /riddle, /roast, /compliment, /reverse, /morse" },
          { name: "🔧 Utility", value: "/avatar, /serverinfo, /userinfo, /math, /remind, /poll, /timestamp, /color, /base64, /hash, /uuid" },
          { name: "🎭 Moderation", value: "/kick, /ban, /unban, /mute, /unmute, /warn, /purge, /slowmode, /lock, /unlock, /role, /nick" },
          { name: "🎵 Music", value: "/play, /pause, /resume, /skip, /stop, /queue, /nowplaying, /volume, /shuffle, /loop" },
          { name: "🏆 Economy", value: "/balance, /daily, /weekly, /work, /pay, /leaderboard, /shop, /buy, /inventory, /gamble" },
          { name: "📊 Stats", value: "/serverstats, /userstats, /botstats, /channelstats, /emojistats, /commandstats" },
          { name: "🎮 Games", value: "/tictactoe, /hangman, /wordle, /slots, /blackjack, /roulette, /lottery" },
          { name: "📝 Social", value: "/profile, /bio, /birthday, /marry, /divorce, /rep, /hug, /pat, /kiss, /highfive" },
          { name: "⚙️ Config", value: "/setlog, /setwelcome, /setgoodbye, /autorole, /antiraid, /antispam, /starboard" },
          { name: "✨ Extra", value: "/level, /rank, /xpleaderboard, /announce, /giveaway, /embed, /say, /rate, /iq, /ship" },
        )
        .setColor(0x5865f2)
        .setFooter({ text: "Use each command to get more info!" });
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("info").setDescription("Show bot information"),
    async execute(interaction: ChatInputCommandInteraction) {
      const embed = new EmbedBuilder()
        .setTitle("🤖 Bot Information")
        .addFields(
          { name: "Name", value: interaction.client.user?.username ?? "Unknown", inline: true },
          { name: "Servers", value: `${interaction.client.guilds.cache.size}`, inline: true },
          { name: "Commands", value: "100", inline: true },
          { name: "Library", value: "discord.js v14", inline: true },
          { name: "Node.js", value: process.version, inline: true },
        )
        .setColor(0x5865f2)
        .setThumbnail(interaction.client.user?.displayAvatarURL() ?? null);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("uptime").setDescription("Show how long the bot has been running"),
    async execute(interaction: ChatInputCommandInteraction) {
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      await interaction.reply(`⏱️ Uptime: **${days}d ${hours}h ${minutes}m ${seconds}s**`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("invite").setDescription("Get the bot's invite link"),
    async execute(interaction: ChatInputCommandInteraction) {
      const clientId = interaction.client.user?.id;
      const link = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
      await interaction.reply(`📨 **Invite me to your server:**\n${link}`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("support").setDescription("Get support server link"),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.reply("💬 **Support Server:** Join our support server for help!\nhttps://discord.gg/support");
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("feedback")
      .setDescription("Send feedback to the bot developers")
      .addStringOption(opt => opt.setName("message").setDescription("Your feedback").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const msg = interaction.options.getString("message", true);
      await interaction.reply(`✅ **Feedback received:** Thank you, ${interaction.user.username}! We appreciate: "${msg}"`);
    },
  },
];
