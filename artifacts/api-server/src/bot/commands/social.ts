import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const profiles = new Map<string, { bio: string; birthday: string }>();
const reps = new Map<string, number>();
const marriages = new Map<string, string>();

export const socialCommands = [
  {
    data: new SlashCommandBuilder().setName("profile").setDescription("View your or someone's profile").addUserOption(opt => opt.setName("user").setDescription("User to view")),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const profile = profiles.get(user.id);
      const rep = reps.get(user.id) ?? 0;
      const spouse = marriages.get(user.id);
      const embed = new EmbedBuilder()
        .setTitle(`👤 ${user.username}'s Profile`)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "📝 Bio", value: profile?.bio ?? "No bio set. Use /bio to set one!", inline: false },
          { name: "🎂 Birthday", value: profile?.birthday ?? "Not set", inline: true },
          { name: "⭐ Reputation", value: `${rep}`, inline: true },
          { name: "💍 Married To", value: spouse ? `<@${spouse}>` : "Single 💔", inline: true },
        )
        .setColor(0x5865f2)
        .setFooter({ text: `Member since ${user.createdAt.toDateString()}` });
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("bio")
      .setDescription("Set your bio")
      .addStringOption(opt => opt.setName("text").setDescription("Your bio (max 200 chars)").setRequired(true).setMaxLength(200)),
    async execute(interaction: ChatInputCommandInteraction) {
      const bio = interaction.options.getString("text", true);
      const profile = profiles.get(interaction.user.id) ?? { bio: "", birthday: "" };
      profile.bio = bio;
      profiles.set(interaction.user.id, profile);
      await interaction.reply(`✅ Your bio has been updated to: "${bio}"`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("birthday")
      .setDescription("Set your birthday")
      .addStringOption(opt => opt.setName("date").setDescription("Your birthday (e.g. January 1)").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const date = interaction.options.getString("date", true);
      const profile = profiles.get(interaction.user.id) ?? { bio: "", birthday: "" };
      profile.birthday = date;
      profiles.set(interaction.user.id, profile);
      await interaction.reply(`🎂 Your birthday has been set to: **${date}**`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("marry")
      .setDescription("Propose to someone")
      .addUserOption(opt => opt.setName("user").setDescription("User to propose to").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("user", true);
      if (target.id === interaction.user.id) return interaction.reply("❌ You can't marry yourself!");
      if (target.bot) return interaction.reply("❌ You can't marry a bot!");
      if (marriages.has(interaction.user.id)) return interaction.reply("❌ You're already married! Use /divorce first.");
      marriages.set(interaction.user.id, target.id);
      marriages.set(target.id, interaction.user.id);
      await interaction.reply(`💍 **${interaction.user.username}** and **${target.username}** are now married! 🎊`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("divorce").setDescription("Divorce your partner"),
    async execute(interaction: ChatInputCommandInteraction) {
      const spouse = marriages.get(interaction.user.id);
      if (!spouse) return interaction.reply("❌ You're not married!");
      marriages.delete(interaction.user.id);
      marriages.delete(spouse);
      await interaction.reply(`💔 **${interaction.user.username}** has filed for divorce.`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("rep")
      .setDescription("Give someone a reputation point")
      .addUserOption(opt => opt.setName("user").setDescription("User to give rep to").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("user", true);
      if (target.id === interaction.user.id) return interaction.reply("❌ You can't rep yourself!");
      reps.set(target.id, (reps.get(target.id) ?? 0) + 1);
      await interaction.reply(`⭐ **${interaction.user.username}** gave a rep to **${target.username}**! (${reps.get(target.id)} total)`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("hug")
      .setDescription("Hug someone!")
      .addUserOption(opt => opt.setName("user").setDescription("User to hug").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("user", true);
      await interaction.reply(`**${interaction.user.username}** hugs **${target.username}**! 🤗`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("pat")
      .setDescription("Pat someone on the head!")
      .addUserOption(opt => opt.setName("user").setDescription("User to pat").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("user", true);
      await interaction.reply(`**${interaction.user.username}** pats **${target.username}** on the head! 🤚✨`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("kiss")
      .setDescription("Kiss someone!")
      .addUserOption(opt => opt.setName("user").setDescription("User to kiss").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("user", true);
      await interaction.reply(`**${interaction.user.username}** kisses **${target.username}**! 💋`);
    },
  },
  },
];
