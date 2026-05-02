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
];
