import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const balances = new Map<string, number>();
const lastDaily = new Map<string, number>();
const lastWeekly = new Map<string, number>();
const inventories = new Map<string, string[]>();
const reputations = new Map<string, number>();

function getBalance(userId: string): number {
  return balances.get(userId) ?? 1000;
}
function setBalance(userId: string, amount: number): void {
  balances.set(userId, Math.max(0, amount));
}

const shopItems = [
  { id: "vip", name: "VIP Badge", price: 5000, emoji: "👑" },
  { id: "shield", name: "Shield", price: 2000, emoji: "🛡️" },
  { id: "sword", name: "Sword", price: 1500, emoji: "⚔️" },
  { id: "potion", name: "Potion", price: 500, emoji: "🧪" },
  { id: "gem", name: "Gem", price: 3000, emoji: "💎" },
];

export const economyCommands = [
  {
    data: new SlashCommandBuilder().setName("balance").setDescription("Check your or someone's balance").addUserOption(opt => opt.setName("user").setDescription("User to check")),
    async execute(interaction: ChatInputCommandInteraction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const bal = getBalance(user.id);
      const embed = new EmbedBuilder()
        .setTitle(`💰 ${user.username}'s Balance`)
        .setDescription(`**${bal.toLocaleString()} 💵 coins**`)
        .setColor(0xffd700)
        .setThumbnail(user.displayAvatarURL());
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("daily").setDescription("Claim your daily reward"),
    async execute(interaction: ChatInputCommandInteraction) {
      const userId = interaction.user.id;
      const now = Date.now();
      const last = lastDaily.get(userId) ?? 0;
      if (now - last < 86400000) {
        const remaining = Math.ceil((86400000 - (now - last)) / 3600000);
        return interaction.reply(`⏰ You already claimed your daily! Come back in **${remaining}** hours.`);
      }
      const reward = Math.floor(Math.random() * 500) + 500;
      setBalance(userId, getBalance(userId) + reward);
      lastDaily.set(userId, now);
      await interaction.reply(`✅ You claimed your daily reward of **${reward} 💵 coins!**\n💰 New balance: **${getBalance(userId).toLocaleString()} coins**`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("weekly").setDescription("Claim your weekly reward"),
    async execute(interaction: ChatInputCommandInteraction) {
      const userId = interaction.user.id;
      const now = Date.now();
      const last = lastWeekly.get(userId) ?? 0;
      if (now - last < 604800000) {
        const remaining = Math.ceil((604800000 - (now - last)) / 86400000);
        return interaction.reply(`⏰ You already claimed your weekly! Come back in **${remaining}** day(s).`);
      }
      const reward = Math.floor(Math.random() * 2000) + 3000;
      setBalance(userId, getBalance(userId) + reward);
      lastWeekly.set(userId, now);
      await interaction.reply(`✅ You claimed your weekly reward of **${reward} 💵 coins!**\n💰 New balance: **${getBalance(userId).toLocaleString()} coins**`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("work").setDescription("Work to earn coins"),
    async execute(interaction: ChatInputCommandInteraction) {
      const jobs = ["programmer", "chef", "driver", "teacher", "doctor", "engineer", "designer", "writer"];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const reward = Math.floor(Math.random() * 300) + 100;
      setBalance(interaction.user.id, getBalance(interaction.user.id) + reward);
      await interaction.reply(`💼 You worked as a **${job}** and earned **${reward} 💵 coins!**\n💰 Balance: **${getBalance(interaction.user.id).toLocaleString()} coins**`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("pay")
      .setDescription("Pay coins to another user")
      .addUserOption(opt => opt.setName("user").setDescription("User to pay").setRequired(true))
      .addIntegerOption(opt => opt.setName("amount").setDescription("Amount to pay").setRequired(true).setMinValue(1)),
    async execute(interaction: ChatInputCommandInteraction) {
      const target = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);
      const userId = interaction.user.id;
      if (target.id === userId) return interaction.reply("❌ You can't pay yourself!");
      if (getBalance(userId) < amount) return interaction.reply("❌ You don't have enough coins!");
      setBalance(userId, getBalance(userId) - amount);
      setBalance(target.id, getBalance(target.id) + amount);
      await interaction.reply(`💸 **${interaction.user.username}** paid **${amount} 💵 coins** to **${target.username}**!`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("leaderboard").setDescription("Show the richest users"),
    async execute(interaction: ChatInputCommandInteraction) {
      const sorted = [...balances.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      const embed = new EmbedBuilder()
        .setTitle("🏆 Economy Leaderboard")
        .setDescription(sorted.length === 0 ? "No data yet!" : sorted.map((e, i) => `**${i + 1}.** <@${e[0]}> — **${e[1].toLocaleString()} 💵**`).join("\n"))
        .setColor(0xffd700);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("shop").setDescription("View the item shop"),
    async execute(interaction: ChatInputCommandInteraction) {
      const embed = new EmbedBuilder()
        .setTitle("🛒 Item Shop")
        .setDescription(shopItems.map(i => `${i.emoji} **${i.name}** — ${i.price.toLocaleString()} 💵`).join("\n"))
        .setColor(0x5865f2)
        .setFooter({ text: "Use /buy <item> to purchase!" });
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("buy")
      .setDescription("Buy an item from the shop")
      .addStringOption(opt => opt.setName("item").setDescription("Item ID to buy").setRequired(true).addChoices(
        ...shopItems.map(i => ({ name: `${i.emoji} ${i.name} (${i.price} coins)`, value: i.id }))
      )),
    async execute(interaction: ChatInputCommandInteraction) {
      const itemId = interaction.options.getString("item", true);
      const item = shopItems.find(i => i.id === itemId);
      if (!item) return interaction.reply("❌ Item not found!");
      const userId = interaction.user.id;
      if (getBalance(userId) < item.price) return interaction.reply(`❌ You need **${item.price} coins** but only have **${getBalance(userId)} coins**.`);
      setBalance(userId, getBalance(userId) - item.price);
      const inv = inventories.get(userId) ?? [];
      inv.push(item.name);
      inventories.set(userId, inv);
      await interaction.reply(`✅ You bought **${item.emoji} ${item.name}** for **${item.price} coins!**\n💰 Remaining: **${getBalance(userId).toLocaleString()} coins**`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("inventory").setDescription("Check your inventory"),
    async execute(interaction: ChatInputCommandInteraction) {
      const inv = inventories.get(interaction.user.id) ?? [];
      const embed = new EmbedBuilder()
        .setTitle(`🎒 ${interaction.user.username}'s Inventory`)
        .setDescription(inv.length === 0 ? "Your inventory is empty! Use /shop to buy items." : inv.join(", "))
        .setColor(0x5865f2);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("gamble")
      .setDescription("Gamble your coins")
      .addIntegerOption(opt => opt.setName("amount").setDescription("Amount to gamble").setRequired(true).setMinValue(10)),
    async execute(interaction: ChatInputCommandInteraction) {
      const amount = interaction.options.getInteger("amount", true);
      const userId = interaction.user.id;
      if (getBalance(userId) < amount) return interaction.reply("❌ You don't have enough coins!");
      const win = Math.random() < 0.45;
      if (win) {
        setBalance(userId, getBalance(userId) + amount);
        await interaction.reply(`🎰 **You won!** +**${amount} coins!**\n💰 Balance: **${getBalance(userId).toLocaleString()} coins**`);
      } else {
        setBalance(userId, getBalance(userId) - amount);
        await interaction.reply(`🎰 **You lost!** -**${amount} coins!**\n💰 Balance: **${getBalance(userId).toLocaleString()} coins**`);
      }
    },
  },
];
