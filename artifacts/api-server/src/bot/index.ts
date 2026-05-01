import { Client, Collection, Events, GatewayIntentBits, REST, Routes, ActivityType } from "discord.js";
import { logger } from "../lib/logger";
import { generalCommands } from "./commands/general";
import { funCommands } from "./commands/fun";
import { utilityCommands } from "./commands/utility";
import { moderationCommands } from "./commands/moderation";
import { musicCommands } from "./commands/music";
import { economyCommands } from "./commands/economy";
import { statsCommands } from "./commands/stats";
import { gamesCommands } from "./commands/games";
import { socialCommands } from "./commands/social";
import { configCommands } from "./commands/config";
import { extraCommands } from "./commands/extra";

type Command = {
  data: { name: string; toJSON(): unknown };
  execute: (interaction: import("discord.js").ChatInputCommandInteraction) => Promise<unknown>;
};

const allCommands: Command[] = [
  ...generalCommands,
  ...funCommands,
  ...utilityCommands,
  ...moderationCommands,
  ...musicCommands,
  ...economyCommands,
  ...statsCommands,
  ...gamesCommands,
  ...socialCommands,
  ...configCommands,
  ...extraCommands,
];

export async function startBot(): Promise<void> {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.warn("DISCORD_BOT_TOKEN not set — bot will not start");
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessageReactions,
    ],
  });

  const commands = new Collection<string, Command>();
  for (const cmd of allCommands) {
    commands.set(cmd.data.name, cmd);
  }

  client.once(Events.ClientReady, async (readyClient) => {
    logger.info({ tag: readyClient.user.tag, commands: commands.size }, "Discord bot is ready!");

    readyClient.user.setPresence({
      activities: [{ name: "For help /help", type: ActivityType.Watching }],
      status: "online",
    });

    const rest = new REST().setToken(token);
    const commandBodies = allCommands.map(cmd => cmd.data.toJSON());

    // Register as guild commands for each server (no limit vs global 100 limit)
    const guilds = readyClient.guilds.cache;
    if (guilds.size === 0) {
      logger.warn("Bot is not in any guilds — commands not registered yet. Invite the bot to a server.");
    }
    for (const [guildId, guild] of guilds) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(readyClient.user.id, guildId),
          { body: commandBodies },
        );
        logger.info({ guild: guild.name, count: commandBodies.length }, "Guild commands registered!");
      } catch (err) {
        logger.error({ err, guild: guild.name }, "Failed to register guild commands");
      }
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({ content: "❌ Unknown command!", ephemeral: true });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error({ err, command: interaction.commandName }, "Error executing command");
      const errorMsg = { content: "❌ An error occurred while executing this command!", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMsg);
      } else {
        await interaction.reply(errorMsg);
      }
    }
  });

  client.on(Events.GuildMemberAdd, async (member) => {
    logger.info({ guild: member.guild.name, user: member.user.tag }, "New member joined");
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    logger.info({ guild: member.guild.name, user: (member as import("discord.js").GuildMember).user?.tag }, "Member left");
  });

  await client.login(token);
}
