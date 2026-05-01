import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

const jokes = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "What do you call a fake noodle? An impasta!",
  "Why can't you give Elsa a balloon? Because she'll let it go!",
  "I'm reading a book about anti-gravity. It's impossible to put down!",
  "Why did the bicycle fall over? Because it was two-tired!",
  "What do you call cheese that isn't yours? Nacho cheese!",
];

const quotes = [
  "The only way to do great work is to love what you do. – Steve Jobs",
  "In the middle of every difficulty lies opportunity. – Albert Einstein",
  "It does not matter how slowly you go as long as you do not stop. – Confucius",
  "Life is what happens when you're busy making other plans. – John Lennon",
  "The future belongs to those who believe in the beauty of their dreams. – Eleanor Roosevelt",
  "Believe you can and you're halfway there. – Theodore Roosevelt",
];

const facts = [
  "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs!",
  "A group of flamingos is called a flamboyance.",
  "The shortest war in history lasted only 38 minutes.",
  "Bananas are berries, but strawberries are not.",
  "Octopuses have three hearts and blue blood.",
  "A snail can sleep for 3 years.",
];

const riddles = [
  { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. What am I?", a: "A map!" },
  { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps!" },
  { q: "I speak without a mouth and hear without ears. What am I?", a: "An echo!" },
  { q: "What has hands but can't clap?", a: "A clock!" },
  { q: "What gets wetter the more it dries?", a: "A towel!" },
];

const roasts = [
  "You're like a cloud — when you disappear, it's a beautiful day!",
  "I'd agree with you, but then we'd both be wrong.",
  "You're not stupid; you just have bad luck thinking.",
  "I was going to roast you, but my mom said I'm not allowed to burn trash.",
];

const compliments = [
  "You're literally sunshine on a cloudy day! ☀️",
  "Your smile could light up the entire server!",
  "You make everything better just by being here!",
  "The world is a better place because you're in it! 💫",
];

const morseCode: Record<string, string> = {
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---",
  k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-",
  u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", " ": "/",
};

export const funCommands = [
  {
    data: new SlashCommandBuilder().setName("joke").setDescription("Get a random joke"),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.reply(`😂 ${jokes[Math.floor(Math.random() * jokes.length)]}`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("meme").setDescription("Get a random meme"),
    async execute(interaction: ChatInputCommandInteraction) {
      const memes = ["When the code works on first try 😱", "Me debugging for 3 hours and the fix is a semicolon 😤", "404: Sleep not found 💤", "It works on my machine 🤷"];
      await interaction.reply(`🎭 ${memes[Math.floor(Math.random() * memes.length)]}`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("8ball")
      .setDescription("Ask the magic 8-ball a question")
      .addStringOption(opt => opt.setName("question").setDescription("Your question").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const responses = ["Yes!", "No.", "Maybe...", "Definitely!", "I doubt it.", "Ask again later.", "Without a doubt!", "Don't count on it.", "It is certain.", "Very doubtful."];
      await interaction.reply(`🎱 **${responses[Math.floor(Math.random() * responses.length)]}**`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("flip").setDescription("Flip a coin"),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.reply(`The coin landed on: **${Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙"}**`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("roll")
      .setDescription("Roll a dice")
      .addIntegerOption(opt => opt.setName("sides").setDescription("Number of sides (default: 6)").setMinValue(2).setMaxValue(100)),
    async execute(interaction: ChatInputCommandInteraction) {
      const sides = interaction.options.getInteger("sides") ?? 6;
      await interaction.reply(`🎲 You rolled a **${Math.floor(Math.random() * sides) + 1}** (d${sides})`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("rps")
      .setDescription("Play Rock Paper Scissors")
      .addStringOption(opt => opt.setName("choice").setDescription("Your choice").setRequired(true).addChoices(
        { name: "Rock", value: "rock" },
        { name: "Paper", value: "paper" },
        { name: "Scissors", value: "scissors" },
      )),
    async execute(interaction: ChatInputCommandInteraction) {
      const choices = ["rock", "paper", "scissors"] as const;
      const emojis: Record<string, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };
      const user = interaction.options.getString("choice", true) as "rock" | "paper" | "scissors";
      const bot = choices[Math.floor(Math.random() * choices.length)]!;
      let result = "";
      if (user === bot) result = "It's a tie!";
      else if ((user === "rock" && bot === "scissors") || (user === "paper" && bot === "rock") || (user === "scissors" && bot === "paper")) result = "You win! 🎉";
      else result = "I win! 😏";
      await interaction.reply(`${emojis[user]} vs ${emojis[bot]} — **${result}**`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("quote").setDescription("Get an inspirational quote"),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.reply(`📜 *"${quotes[Math.floor(Math.random() * quotes.length)]}"*`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("fact").setDescription("Get a random interesting fact"),
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.reply(`🧠 **Fun Fact:** ${facts[Math.floor(Math.random() * facts.length)]}`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("riddle").setDescription("Get a random riddle"),
    async execute(interaction: ChatInputCommandInteraction) {
      const r = riddles[Math.floor(Math.random() * riddles.length)]!;
      await interaction.reply(`🧩 **Riddle:** ${r.q}\n||**Answer:** ${r.a}||`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("roast")
      .setDescription("Roast someone")
      .addUserOption(opt => opt.setName("target").setDescription("Who to roast")),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("target") ?? interaction.user;
      await interaction.reply(`🔥 ${target.username}: ${roasts[Math.floor(Math.random() * roasts.length)]}`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("compliment")
      .setDescription("Give someone a compliment")
      .addUserOption(opt => opt.setName("target").setDescription("Who to compliment")),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("target") ?? interaction.user;
      await interaction.reply(`💖 ${target.username}: ${compliments[Math.floor(Math.random() * compliments.length)]}`);
    },
  },
];
