import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";

export const moderationCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("kick")
      .setDescription("Kick a member from the server")
      .addUserOption(opt => opt.setName("user").setDescription("User to kick").setRequired(true))
      .addStringOption(opt => opt.setName("reason").setDescription("Reason for kick"))
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      const member = interaction.guild?.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: "❌ Member not found!", ephemeral: true });
      await member.kick(reason);
      await interaction.reply(`✅ **${user.username}** has been kicked.\n📝 Reason: ${reason}`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("ban")
      .setDescription("Ban a member from the server")
      .addUserOption(opt => opt.setName("user").setDescription("User to ban").setRequired(true))
      .addStringOption(opt => opt.setName("reason").setDescription("Reason for ban"))
      .addIntegerOption(opt => opt.setName("days").setDescription("Delete message history (days)").setMinValue(0).setMaxValue(7))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      const days = interaction.options.getInteger("days") ?? 0;
      await interaction.guild?.members.ban(user, { reason, deleteMessageSeconds: days * 86400 });
      await interaction.reply(`🔨 **${user.username}** has been banned.\n📝 Reason: ${reason}`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("unban")
      .setDescription("Unban a user by ID")
      .addStringOption(opt => opt.setName("userid").setDescription("User ID to unban").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction: ChatInputCommandInteraction) {
      const userId = interaction.options.getString("userid", true);
      await interaction.guild?.members.unban(userId);
      await interaction.reply(`✅ User \`${userId}\` has been unbanned.`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("mute")
      .setDescription("Timeout a member")
      .addUserOption(opt => opt.setName("user").setDescription("User to mute").setRequired(true))
      .addIntegerOption(opt => opt.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(40320))
      .addStringOption(opt => opt.setName("reason").setDescription("Reason for mute"))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user", true);
      const minutes = interaction.options.getInteger("minutes", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";
      const member = interaction.guild?.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: "❌ Member not found!", ephemeral: true });
      await member.timeout(minutes * 60 * 1000, reason);
      await interaction.reply(`🔇 **${user.username}** muted for **${minutes}** minute(s).\n📝 Reason: ${reason}`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("unmute")
      .setDescription("Remove timeout from a member")
      .addUserOption(opt => opt.setName("user").setDescription("User to unmute").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user", true);
      const member = interaction.guild?.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: "❌ Member not found!", ephemeral: true });
      await member.timeout(null);
      await interaction.reply(`🔊 **${user.username}** has been unmuted.`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("warn")
      .setDescription("Warn a member")
      .addUserOption(opt => opt.setName("user").setDescription("User to warn").setRequired(true))
      .addStringOption(opt => opt.setName("reason").setDescription("Reason for warning").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason", true);
      await interaction.reply(`⚠️ **${user.username}** has been warned.\n📝 Reason: ${reason}`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("purge")
      .setDescription("Delete multiple messages")
      .addIntegerOption(opt => opt.setName("amount").setDescription("Number of messages (1-100)").setRequired(true).setMinValue(1).setMaxValue(100))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction: ChatInputCommandInteraction) {
      const amount = interaction.options.getInteger("amount", true);
      const channel = interaction.channel;
      if (!channel || !channel.isTextBased() || channel.isDMBased()) return interaction.reply({ content: "❌ Cannot use this command here!", ephemeral: true });
      await (channel as import("discord.js").TextChannel).bulkDelete(amount, true);
      await interaction.reply({ content: `🗑️ Deleted **${amount}** messages!`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("slowmode")
      .setDescription("Set channel slowmode")
      .addIntegerOption(opt => opt.setName("seconds").setDescription("Slowmode in seconds (0 to disable)").setRequired(true).setMinValue(0).setMaxValue(21600))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction: ChatInputCommandInteraction) {
      const seconds = interaction.options.getInteger("seconds", true);
      const channel = interaction.channel;
      if (!channel || !("setRateLimitPerUser" in channel)) return interaction.reply({ content: "❌ Cannot set slowmode here!", ephemeral: true });
      await (channel as import("discord.js").TextChannel).setRateLimitPerUser(seconds);
      await interaction.reply(seconds === 0 ? "✅ Slowmode disabled!" : `✅ Slowmode set to **${seconds}** seconds!`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("lock")
      .setDescription("Lock the current channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = interaction.channel;
      if (!channel || !("permissionOverwrites" in channel)) return interaction.reply({ content: "❌ Cannot lock this channel!", ephemeral: true });
      await (channel as import("discord.js").TextChannel).permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: false });
      await interaction.reply("🔒 Channel locked!");
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("unlock")
      .setDescription("Unlock the current channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = interaction.channel;
      if (!channel || !("permissionOverwrites" in channel)) return interaction.reply({ content: "❌ Cannot unlock this channel!", ephemeral: true });
      await (channel as import("discord.js").TextChannel).permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: null });
      await interaction.reply("🔓 Channel unlocked!");
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("role")
      .setDescription("Add or remove a role from a user")
      .addUserOption(opt => opt.setName("user").setDescription("Target user").setRequired(true))
      .addRoleOption(opt => opt.setName("role").setDescription("Role to add/remove").setRequired(true))
      .addStringOption(opt => opt.setName("action").setDescription("add or remove").setRequired(true).addChoices(
        { name: "Add", value: "add" },
        { name: "Remove", value: "remove" },
      ))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user", true);
      const role = interaction.options.getRole("role", true);
      const action = interaction.options.getString("action", true);
      const member = interaction.guild?.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: "❌ Member not found!", ephemeral: true });
      if (action === "add") {
        await member.roles.add(role.id);
        await interaction.reply(`✅ Added role **${role.name}** to **${user.username}**`);
      } else {
        await member.roles.remove(role.id);
        await interaction.reply(`✅ Removed role **${role.name}** from **${user.username}**`);
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("nick")
      .setDescription("Change a user's nickname")
      .addUserOption(opt => opt.setName("user").setDescription("Target user").setRequired(true))
      .addStringOption(opt => opt.setName("nickname").setDescription("New nickname (leave empty to reset)"))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user", true);
      const nickname = interaction.options.getString("nickname") ?? null;
      const member = interaction.guild?.members.cache.get(user.id);
      if (!member) return interaction.reply({ content: "❌ Member not found!", ephemeral: true });
      await member.setNickname(nickname);
      await interaction.reply(nickname ? `✅ Nickname changed to **${nickname}**` : `✅ Nickname reset for **${user.username}**.`);
    },
  },
];
