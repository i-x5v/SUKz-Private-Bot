import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";

const configs = new Map<string, Record<string, string>>();
function getConfig(guildId: string): Record<string, string> { return configs.get(guildId) ?? {}; }
function setConfig(guildId: string, key: string, value: string): void {
  const c = getConfig(guildId);
  c[key] = value;
  configs.set(guildId, c);
}

export const configCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("setlog")
      .setDescription("Set the log channel")
      .addChannelOption(opt => opt.setName("channel").setDescription("Log channel").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = interaction.options.getChannel("channel", true);
      if (interaction.guild) setConfig(interaction.guild.id, "logChannel", channel.id);
      await interaction.reply(`✅ Log channel set to <#${channel.id}>`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("setwelcome")
      .setDescription("Set the welcome channel and message")
      .addChannelOption(opt => opt.setName("channel").setDescription("Welcome channel").setRequired(true))
      .addStringOption(opt => opt.setName("message").setDescription("Welcome message (use {user} for mention)"))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = interaction.options.getChannel("channel", true);
      const message = interaction.options.getString("message") ?? "Welcome {user} to the server! 🎉";
      if (interaction.guild) {
        setConfig(interaction.guild.id, "welcomeChannel", channel.id);
        setConfig(interaction.guild.id, "welcomeMessage", message);
      }
      await interaction.reply(`✅ Welcome channel set to <#${channel.id}>\n📝 Message: "${message}"`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("setgoodbye")
      .setDescription("Set the goodbye channel and message")
      .addChannelOption(opt => opt.setName("channel").setDescription("Goodbye channel").setRequired(true))
      .addStringOption(opt => opt.setName("message").setDescription("Goodbye message (use {user} for name)"))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: ChatInputCommandInteraction) {
      const channel = interaction.options.getChannel("channel", true);
      const message = interaction.options.getString("message") ?? "Goodbye {user}, we'll miss you!";
      if (interaction.guild) {
        setConfig(interaction.guild.id, "goodbyeChannel", channel.id);
        setConfig(interaction.guild.id, "goodbyeMessage", message);
      }
      await interaction.reply(`✅ Goodbye channel set to <#${channel.id}>\n📝 Message: "${message}"`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("autorole")
      .setDescription("Set auto-role for new members")
      .addRoleOption(opt => opt.setName("role").setDescription("Role to assign to new members").setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction: ChatInputCommandInteraction) {
      const role = interaction.options.getRole("role", true);
      if (interaction.guild) setConfig(interaction.guild.id, "autoRole", role.id);
      await interaction.reply(`✅ Auto-role set to **${role.name}**. New members will automatically receive this role.`);
    },
  },
];
