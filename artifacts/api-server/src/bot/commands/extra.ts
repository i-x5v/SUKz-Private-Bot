import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { GoogleGenAI } from "@google/genai";

const geminiBaseUrl = process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"];
const geminiApiKey = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"] ?? process.env["GEMINI_API_KEY"] ?? "no-key";

const geminiClient = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    apiVersion: "",
    ...(geminiBaseUrl ? { baseUrl: geminiBaseUrl } : {}),
  },
});

const xpData = new Map<string, number>();
const levels = new Map<string, number>();

function getXp(userId: string): number { return xpData.get(userId) ?? 0; }
function getLevel(userId: string): number { return levels.get(userId) ?? 1; }
function addXp(userId: string, amount: number): void {
  const xp = getXp(userId) + amount;
  xpData.set(userId, xp);
  const newLevel = Math.floor(0.1 * Math.sqrt(xp));
  levels.set(userId, Math.max(1, newLevel));
}

export const extraCommands = [
  {
    data: new SlashCommandBuilder().setName("level").setDescription("Check your or someone's level").addUserOption(opt => opt.setName("user").setDescription("User to check")),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      addXp(interaction.user.id, 10);
      const xp = getXp(user.id);
      const lvl = getLevel(user.id);
      const embed = new EmbedBuilder()
        .setTitle(`📊 ${user.username}'s Level`)
        .addFields(
          { name: "Level", value: `${lvl}`, inline: true },
          { name: "XP", value: `${xp}`, inline: true },
          { name: "Next Level", value: `${Math.pow((lvl + 1) / 0.1, 2)} XP needed`, inline: true },
        )
        .setColor(0x5865f2)
        .setThumbnail(user.displayAvatarURL());
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("rank").setDescription("Show your rank on the XP leaderboard"),
    async execute(interaction: ChatInputCommandInteraction) {
      const sorted = [...xpData.entries()].sort((a, b) => b[1] - a[1]);
      const rank = sorted.findIndex(([id]) => id === interaction.user.id) + 1;
      await interaction.reply(`🏆 **${interaction.user.username}** is ranked **#${rank || "Unranked"}** on the XP leaderboard!`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("xpleaderboard").setDescription("Show the XP leaderboard"),
    async execute(interaction: ChatInputCommandInteraction) {
      const sorted = [...xpData.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      const embed = new EmbedBuilder()
        .setTitle("🏆 XP Leaderboard")
        .setDescription(sorted.length === 0 ? "No data yet!" : sorted.map((e, i) => `**${i + 1}.** <@${e[0]}> — **Level ${getLevel(e[0])}** (${e[1]} XP)`).join("\n"))
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("announce")
      .setDescription("Make an announcement")
      .addStringOption(opt => opt.setName("message").setDescription("Announcement text").setRequired(true))
      .addStringOption(opt => opt.setName("title").setDescription("Announcement title")),
    async execute(interaction: ChatInputCommandInteraction) {
      const message = interaction.options.getString("message", true);
      const title = interaction.options.getString("title") ?? "📢 Announcement";
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setColor(0xff6b35)
        .setFooter({ text: `Announced by ${interaction.user.username}` })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("giveaway")
      .setDescription("Start a simple giveaway")
      .addStringOption(opt => opt.setName("prize").setDescription("What are you giving away?").setRequired(true))
      .addIntegerOption(opt => opt.setName("duration").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(10080)),
    async execute(interaction: ChatInputCommandInteraction) {
      const prize = interaction.options.getString("prize", true);
      const duration = interaction.options.getInteger("duration", true);
      const endTime = Math.floor((Date.now() + duration * 60000) / 1000);
      const embed = new EmbedBuilder()
        .setTitle("🎉 GIVEAWAY!")
        .setDescription(`**Prize:** ${prize}\n\nReact with 🎉 to enter!\n\n**Ends:** <t:${endTime}:R>`)
        .setColor(0xff6b35)
        .setFooter({ text: `Hosted by ${interaction.user.username}` })
        .setTimestamp();
      const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
      await msg.react("🎉");
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("embed")
      .setDescription("Create a custom embed")
      .addStringOption(opt => opt.setName("title").setDescription("Embed title").setRequired(true))
      .addStringOption(opt => opt.setName("description").setDescription("Embed description").setRequired(true))
      .addStringOption(opt => opt.setName("color").setDescription("Hex color (e.g. ff5733)")),
    async execute(interaction: ChatInputCommandInteraction) {
      const title = interaction.options.getString("title", true);
      const description = interaction.options.getString("description", true);
      const colorHex = interaction.options.getString("color") ?? "5865f2";
      const color = parseInt(colorHex.replace("#", ""), 16) || 0x5865f2;
      const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(color);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("dm")
      .setDescription("Send a private DM to a user")
      .addUserOption(opt => opt.setName("user").setDescription("User to send DM to").setRequired(true))
      .addStringOption(opt => opt.setName("message").setDescription("Message to send").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user", true);
      const message = interaction.options.getString("message", true);
      if (user.bot) return interaction.reply({ content: "❌ Cannot send DM to a bot!", ephemeral: true });
      try {
        const embed = new EmbedBuilder()
          .setTitle("📨 New Message")
          .setDescription(message)
          .setColor(0x5865f2)
          .setFooter({ text: `Sent by ${interaction.user.username} from ${interaction.guild?.name ?? "a server"}` })
          .setTimestamp();
        await user.send({ embeds: [embed] });
        await interaction.reply({ content: `✅ DM sent successfully to **${user.username}**!`, ephemeral: true });
      } catch {
        await interaction.reply({ content: `❌ Could not send DM to **${user.username}**. They may have DMs disabled.`, ephemeral: true });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("chat")
      .setDescription("سوالف مع الذكاء الاصطناعي / Chat with AI")
      .addStringOption(opt =>
        opt.setName("message")
          .setDescription("رسالتك للذكاء الاصطناعي / Your message to AI")
          .setRequired(true)
      ),
    async execute(interaction: ChatInputCommandInteraction) {
      const userMessage = interaction.options.getString("message", true);
      try { await interaction.deferReply(); } catch { return; }

      try {
        const response = await geminiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          config: {
            systemInstruction: "أنت مساعد ذكي ومفيد في سيرفر ديسكورد. رد بشكل مختصر وواضح. إذا كان السؤال بالعربي رد بالعربي، وإذا كان بالإنجليزي رد بالإنجليزي.",
            maxOutputTokens: 1024,
          },
        });

        const aiReply = response.text ?? "لم أتمكن من الرد، حاول مرة ثانية.";

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
          .addFields(
            { name: "💬 رسالتك", value: userMessage.slice(0, 1024) },
            { name: "🤖 الذكاء الاصطناعي", value: aiReply.slice(0, 1024) },
          )
          .setFooter({ text: "Powered by Gemini AI • Bot_SUKz" })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[/chat error]", errMsg);
        await interaction.editReply({ content: `❌ حدث خطأ: \`${errMsg.slice(0, 200)}\`` });
      }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("iq")
      .setDescription("Check someone's IQ")
      .addUserOption(opt => opt.setName("user").setDescription("User to check")),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const iq = Math.floor(Math.random() * 150) + 70;
      await interaction.reply(`🧠 **${user.username}'s IQ:** ${iq}\n${iq > 130 ? "🔥 Genius!" : iq > 100 ? "✅ Above Average!" : iq > 85 ? "👍 Average!" : "😅 Keep studying!"}`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("ship")
      .setDescription("Ship two users together")
      .addUserOption(opt => opt.setName("user1").setDescription("First user").setRequired(true))
      .addUserOption(opt => opt.setName("user2").setDescription("Second user").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const u1 = interaction.options.getUser("user1", true);
      const u2 = interaction.options.getUser("user2", true);
      const percent = Math.floor(Math.random() * 101);
      const bar = "❤️".repeat(Math.floor(percent / 10)) + "🖤".repeat(10 - Math.floor(percent / 10));
      await interaction.reply(`💘 **${u1.username}** + **${u2.username}**\n${bar} **${percent}%**\n${percent > 80 ? "💍 Perfect match!" : percent > 50 ? "💕 Good match!" : percent > 30 ? "🤔 Maybe?" : "💔 Not meant to be..."}`);
    },
  },
];
