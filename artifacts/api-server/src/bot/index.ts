import { Client, Collection, Events, GatewayIntentBits, REST, Routes, ActivityType, ButtonInteraction, Message } from "discord.js";
import { logger } from "../lib/logger";
import { handleAuctionCommand } from "./commands/auction";
import { generalCommands } from "./commands/general";
import { funCommands } from "./commands/fun";
import { utilityCommands } from "./commands/utility";
import { moderationCommands } from "./commands/moderation";
import { musicCommands, handleMusicButton } from "./commands/music";
import { economyCommands } from "./commands/economy";
import { statsCommands } from "./commands/stats";
import { gamesCommands } from "./commands/games";
import { socialCommands } from "./commands/social";
import { configCommands } from "./commands/config";
import { extraCommands } from "./commands/extra";
import { arabicFeaturesCommands } from "./commands/arabic_features";
import { ticketsCommands, handleTicketButton } from "./commands/tickets";
import { gamingMapsCommands } from "./commands/gaming_maps";
import { autoreplyCommands, checkAutoReply, autoRepliesStore } from "./commands/autoreply";
import { interactiveGamesCommands } from "./commands/interactive_games";
import { prayerTrainingCommands } from "./commands/prayer_training";

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
  ...arabicFeaturesCommands,
  ...ticketsCommands,
  ...gamingMapsCommands,
  ...autoreplyCommands,
  ...interactiveGamesCommands,
  ...prayerTrainingCommands,
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
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildPresences,
    ],
  });

  const commands = new Collection<string, Command>();
  for (const cmd of allCommands) {
    commands.set(cmd.data.name, cmd);
  }

  client.once(Events.ClientReady, async (readyClient) => {
    logger.info({ tag: readyClient.user.tag, commands: commands.size }, "Discord bot is ready!");

    const statusMessages = [
      { name: "/ai — تحدث مع الذكاء الاصطناعي 🤖", type: ActivityType.Watching },
      { name: "/ticket — افتح تذكرة دعم 🎫", type: ActivityType.Watching },
      { name: "/console — حل مشاكل الكونسل 🎮", type: ActivityType.Watching },
      { name: "/adhkar — أذكار إسلامية 📿", type: ActivityType.Watching },
      { name: "/trivia — سؤال ثقافي 🧠", type: ActivityType.Watching },
      { name: "/poll — صوّت مع السيرفر 📊", type: ActivityType.Watching },
      { name: `${commands.size} أمر جاهزة لك ⚡`, type: ActivityType.Playing },
    ];
    let statusIndex = 0;
    const updateStatus = () => {
      const s = statusMessages[statusIndex % statusMessages.length]!;
      readyClient.user.setPresence({ activities: [s], status: "online" });
      statusIndex++;
    };
    updateStatus();
    setInterval(updateStatus, 15_000);

    const rest = new REST().setToken(token);

    try {
      await rest.patch(Routes.currentApplication(), {
        body: {
          description: "بوت SUKz — بوت عربي متكامل 🇸🇦\n\n🤖 /ask — ذكاء اصطناعي\n🎫 /ticket — نظام تذاكر\n🎮 /console — حل مشاكل الكونسل\n📿 /adhkar — أذكار إسلامية\n🧠 /trivia — أسئلة ثقافية\n⚡ 96 أمر جاهز!",
        },
      });
    } catch { /* ignore if no permission */ }

    const commandBodies = allCommands.map(cmd => cmd.data.toJSON());

    logger.info({ count: commandBodies.length }, "Registering global commands...");
    try {
      await rest.put(
        Routes.applicationCommands(readyClient.user.id),
        { body: commandBodies },
      );
      logger.info({ count: commandBodies.length }, "✅ Global commands registered successfully!");
    } catch (err) {
      logger.error({ err }, "❌ Failed to register global commands — commands may be missing or outdated");
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
      const btn = interaction as ButtonInteraction;
      if (
        btn.customId === "open_ticket_panel" ||
        btn.customId.startsWith("close_ticket_") ||
        btn.customId.startsWith("claim_ticket_") ||
        btn.customId.startsWith("transcript_ticket_")
      ) {
        try { await handleTicketButton(btn); } catch (err) { logger.error({ err }, "Button handler error"); }
        return;
      }
      if (btn.customId.startsWith("music_")) {
        try { await handleMusicButton(btn); } catch (err) { logger.error({ err }, "Music button error"); }
        return;
      }
    }

    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
      try { await interaction.reply({ content: "❌ أمر غير موجود!", flags: 64 }); } catch { /* expired */ }
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 10062) return;
      logger.error({ err, command: interaction.commandName }, "Error executing command");
      try {
        const errorMsg = { content: "❌ حدث خطأ أثناء تنفيذ الأمر!", flags: 64 };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMsg);
        } else {
          await interaction.reply(errorMsg);
        }
      } catch { /* interaction expired */ }
    }
  });

  client.on(Events.MessageCreate, (message) => {
    const msg = message as Message;
    if (msg.author.bot) return;

    if (msg.content.trim().toLowerCase() === "!auction") {
      handleAuctionCommand(msg).catch(err =>
        logger.error({ err }, "Auction command error")
      );
      return;
    }

    checkAutoReply(msg);
  });

  client.on("error", (err) => {
    logger.error({ err }, "Discord client error");
  });

  client.on(Events.GuildMemberAdd, async (member) => {
    logger.info({ guild: member.guild.name, user: member.user.tag }, "New member joined");
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    logger.info({ guild: member.guild.name, user: (member as import("discord.js").GuildMember).user?.tag }, "Member left");
  });

  await client.login(token);
}
