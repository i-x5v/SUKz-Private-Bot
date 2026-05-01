import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const queues = new Map<string, string[]>();
const volumes = new Map<string, number>();
const nowPlaying = new Map<string, string>();

export const musicCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("play")
      .setDescription("Play a song (add to queue)")
      .addStringOption(opt => opt.setName("song").setDescription("Song name or URL").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const song = interaction.options.getString("song", true);
      const guildId = interaction.guildId ?? "dm";
      const q = queues.get(guildId) ?? [];
      q.push(song);
      queues.set(guildId, q);
      nowPlaying.set(guildId, song);
      await interaction.reply(`🎵 **Now Playing:** ${song}\n*Connect a music API (YouTube, Spotify) for real audio playback!*`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("pause").setDescription("Pause the current song"),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.reply("⏸️ Music paused! *(Connect a voice client for real playback)*");
    },
  },
  {
    data: new SlashCommandBuilder().setName("resume").setDescription("Resume the current song"),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.reply("▶️ Music resumed!");
    },
  },
  {
    data: new SlashCommandBuilder().setName("skip").setDescription("Skip the current song"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guildId = interaction.guildId ?? "dm";
      const q = queues.get(guildId) ?? [];
      const skipped = q.shift();
      queues.set(guildId, q);
      const next = q[0];
      await interaction.reply(`⏭️ Skipped: **${skipped ?? "nothing"}**\n${next ? `🎵 Now playing: **${next}**` : "Queue is empty!"}`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("stop").setDescription("Stop music and clear the queue"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guildId = interaction.guildId ?? "dm";
      queues.set(guildId, []);
      nowPlaying.delete(guildId);
      await interaction.reply("⏹️ Music stopped and queue cleared!");
    },
  },
  {
    data: new SlashCommandBuilder().setName("queue").setDescription("Show the current music queue"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guildId = interaction.guildId ?? "dm";
      const q = queues.get(guildId) ?? [];
      const embed = new EmbedBuilder()
        .setTitle("🎵 Music Queue")
        .setDescription(q.length === 0 ? "Queue is empty!" : q.map((s, i) => `**${i + 1}.** ${s}`).join("\n"))
        .setColor(0x5865f2)
        .setFooter({ text: `${q.length} song(s) in queue` });
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("nowplaying").setDescription("Show what's currently playing"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guildId = interaction.guildId ?? "dm";
      const np = nowPlaying.get(guildId);
      if (!np) return interaction.reply("❌ Nothing is playing right now!");
      const embed = new EmbedBuilder()
        .setTitle("🎵 Now Playing")
        .setDescription(`**${np}**`)
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("volume")
      .setDescription("Set the music volume")
      .addIntegerOption(opt => opt.setName("level").setDescription("Volume level (0-100)").setRequired(true).setMinValue(0).setMaxValue(100)),
    async execute(interaction: ChatInputCommandInteraction) {
      const level = interaction.options.getInteger("level", true);
      volumes.set(interaction.guildId ?? "dm", level);
      await interaction.reply(`🔊 Volume set to **${level}%**`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("shuffle").setDescription("Shuffle the music queue"),
    async execute(interaction: ChatInputCommandInteraction) {
      const guildId = interaction.guildId ?? "dm";
      const q = queues.get(guildId) ?? [];
      for (let i = q.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q[i], q[j]] = [q[j]!, q[i]!];
      }
      queues.set(guildId, q);
      await interaction.reply(`🔀 Queue shuffled! ${q.length} songs in the queue.`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("loop")
      .setDescription("Toggle loop mode")
      .addStringOption(opt => opt.setName("mode").setDescription("Loop mode").setRequired(true).addChoices(
        { name: "Off", value: "off" },
        { name: "Song", value: "song" },
        { name: "Queue", value: "queue" },
      )),
    async execute(interaction: ChatInputCommandInteraction) {
      const mode = interaction.options.getString("mode", true);
      const emojis: Record<string, string> = { off: "🔁 Loop Off", song: "🔂 Loop Song", queue: "🔁 Loop Queue" };
      await interaction.reply(`✅ **${emojis[mode]}** activated!`);
    },
  },
];
