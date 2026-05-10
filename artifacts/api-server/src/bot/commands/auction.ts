import {
  EmbedBuilder,
  Message,
  TextChannel,
  Collection,
} from "discord.js";

type Rarity = "أسطورية" | "نادرة جداً" | "نادرة" | "غير شائعة" | "خردة";

interface AuctionItem {
  name: string;
  game: string;
  emoji: string;
  image: string;
  basePoints: number;
  rarity: Rarity;
}

const RARITY_COLOR: Record<Rarity, number> = {
  "أسطورية":    0xFF8C00,
  "نادرة جداً": 0x9B59B6,
  "نادرة":      0x3498DB,
  "غير شائعة": 0x2ECC71,
  "خردة":       0x95A5A6,
};

const RARITY_EMOJI: Record<Rarity, string> = {
  "أسطورية":    "🌟",
  "نادرة جداً": "💜",
  "نادرة":      "🔵",
  "غير شائعة": "🟢",
  "خردة":       "⚫",
};

const ITEMS: AuctionItem[] = [
  // ─── GTA V ───────────────────────────────────────────────
  { name: "Oppressor Mk II", game: "GTA V", emoji: "🚀", image: "https://i.imgur.com/placeholder.png", basePoints: 9500, rarity: "أسطورية" },
  { name: "Minigun", game: "GTA V", emoji: "💣", image: "", basePoints: 6200, rarity: "نادرة جداً" },
  { name: "RPG-7", game: "GTA V", emoji: "🎯", image: "", basePoints: 4800, rarity: "نادرة" },
  { name: "Buzzard Attack Helicopter", game: "GTA V", emoji: "🚁", image: "", basePoints: 7800, rarity: "أسطورية" },
  { name: "Gold Bar", game: "GTA V", emoji: "🟡", image: "", basePoints: 5500, rarity: "نادرة" },
  { name: "Tank (Rhino)", game: "GTA V", emoji: "🪖", image: "", basePoints: 8800, rarity: "أسطورية" },
  { name: "Stolen Supercar", game: "GTA V", emoji: "🏎️", image: "", basePoints: 3200, rarity: "غير شائعة" },
  { name: "Rusty Pistol", game: "GTA V", emoji: "🔫", image: "", basePoints: 200, rarity: "خردة" },

  // ─── Call of Duty ─────────────────────────────────────────
  { name: "Damascus Camo", game: "CoD", emoji: "✨", image: "", basePoints: 9900, rarity: "أسطورية" },
  { name: "Obsidian AK-47", game: "CoD", emoji: "🖤", image: "", basePoints: 8500, rarity: "أسطورية" },
  { name: "Gold Desert Eagle", game: "CoD", emoji: "🏅", image: "", basePoints: 7000, rarity: "نادرة جداً" },
  { name: "Legendary Operator Skin", game: "CoD", emoji: "🧬", image: "", basePoints: 9200, rarity: "أسطورية" },
  { name: "Nuke Killstreak", game: "CoD", emoji: "☢️", image: "", basePoints: 10000, rarity: "أسطورية" },
  { name: "Tactical Knife", game: "CoD", emoji: "🔪", image: "", basePoints: 2800, rarity: "غير شائعة" },
  { name: "Common Pistol Skin", game: "CoD", emoji: "🔫", image: "", basePoints: 150, rarity: "خردة" },
  { name: "C4 Charge", game: "CoD", emoji: "💥", image: "", basePoints: 3500, rarity: "نادرة" },

  // ─── Minecraft ────────────────────────────────────────────
  { name: "Dragon Egg", game: "Minecraft", emoji: "🥚", image: "", basePoints: 10000, rarity: "أسطورية" },
  { name: "Enchanted Netherite Pickaxe", game: "Minecraft", emoji: "⛏️", image: "", basePoints: 8200, rarity: "أسطورية" },
  { name: "Elytra", game: "Minecraft", emoji: "🦋", image: "", basePoints: 7500, rarity: "نادرة جداً" },
  { name: "God Apple (Notch Apple)", game: "Minecraft", emoji: "🍎", image: "", basePoints: 9000, rarity: "أسطورية" },
  { name: "Beacon", game: "Minecraft", emoji: "🔮", image: "", basePoints: 6800, rarity: "نادرة جداً" },
  { name: "Enchanted Diamond Sword", game: "Minecraft", emoji: "⚔️", image: "", basePoints: 5200, rarity: "نادرة" },
  { name: "Wooden Sword", game: "Minecraft", emoji: "🪵", image: "", basePoints: 50, rarity: "خردة" },
  { name: "Nether Star", game: "Minecraft", emoji: "⭐", image: "", basePoints: 7200, rarity: "نادرة جداً" },

  // ─── Blur ─────────────────────────────────────────────────
  { name: "Shield Power-Up", game: "Blur", emoji: "🛡️", image: "", basePoints: 4500, rarity: "نادرة" },
  { name: "Nitro Boost (Max)", game: "Blur", emoji: "⚡", image: "", basePoints: 6000, rarity: "نادرة جداً" },
  { name: "Triple Barge", game: "Blur", emoji: "💢", image: "", basePoints: 5800, rarity: "نادرة جداً" },
  { name: "Lightning Storm", game: "Blur", emoji: "🌩️", image: "", basePoints: 8000, rarity: "أسطورية" },
  { name: "Mine Field", game: "Blur", emoji: "💣", image: "", basePoints: 3800, rarity: "غير شائعة" },
  { name: "Shunt Weapon", game: "Blur", emoji: "🔄", image: "", basePoints: 2500, rarity: "غير شائعة" },
  { name: "Broken Nitro", game: "Blur", emoji: "💨", image: "", basePoints: 300, rarity: "خردة" },
];

const activeAuctions = new Set<string>();

export async function handleAuctionCommand(message: Message): Promise<void> {
  if (!message.guild || !(message.channel instanceof TextChannel)) return;

  const channelId = message.channel.id;
  if (activeAuctions.has(channelId)) {
    await message.reply("⏳ يوجد مزاد جارٍ في هذه القناة، انتظر حتى ينتهي!");
    return;
  }

  activeAuctions.add(channelId);

  try {
    const item = ITEMS[Math.floor(Math.random() * ITEMS.length)]!;
    const rarityColor = RARITY_COLOR[item.rarity];
    const rarityEmoji = RARITY_EMOJI[item.rarity];

    const previewEmbed = new EmbedBuilder()
      .setTitle("🔨 بدأ المزاد على قطعة نادرة!")
      .setDescription(
        `> **${item.emoji} ${item.name}**\n` +
        `> 🎮 من لعبة: **${item.game}**\n` +
        `> ${rarityEmoji} الندرة: **${item.rarity}**\n\n` +
        `📢 **اكتب رقماً من 1️⃣ إلى 🔟 للمشاركة في المزاد!**\n` +
        `⏱️ لديك **5 ثوانٍ** — من يكتب رقماً يدخل السحب!`
      )
      .setColor(rarityColor)
      .setFooter({ text: "🔔 المزاد يغلق بعد 5 ثوانٍ..." })
      .setTimestamp();

    await message.channel.send({ embeds: [previewEmbed] });

    const filter = (m: Message) =>
      !m.author.bot && /^([1-9]|10)$/.test(m.content.trim());

    const collected = new Collection<string, Message>();

    await new Promise<void>((resolve) => {
      const collector = message.channel.createMessageCollector({
        filter,
        time: 5000,
      });

      collector.on("collect", (m: Message) => {
        if (!collected.has(m.author.id)) {
          collected.set(m.author.id, m);
        }
      });

      collector.on("end", () => resolve());
    });

    if (collected.size === 0) {
      const noOneEmbed = new EmbedBuilder()
        .setTitle("😔 انتهى المزاد بدون فائز!")
        .setDescription(`لم يشارك أحد في مزاد **${item.emoji} ${item.name}**.\nالقطعة عادت للمخزن!`)
        .setColor(0x95A5A6)
        .setTimestamp();
      await message.channel.send({ embeds: [noOneEmbed] });
      return;
    }

    const participants = [...collected.values()];
    const winner = participants[Math.floor(Math.random() * participants.length)]!;
    const winnerBid = parseInt(winner.content.trim(), 10);
    const finalPrice = item.basePoints + winnerBid * Math.floor(Math.random() * 500 + 100);

    const winnerEmbed = new EmbedBuilder()
      .setTitle("🏆 انتهى المزاد — لدينا فائز!")
      .setDescription(
        `🎉 تهانينا **${winner.author.username}**!\n\n` +
        `${item.emoji} **${item.name}** — من لعبة **${item.game}**\n` +
        `${rarityEmoji} الندرة: **${item.rarity}**\n` +
        `💰 السعر النهائي: **${finalPrice.toLocaleString()} نقطة**\n` +
        `🎯 رقمك الفائز: **${winnerBid}**\n\n` +
        `👥 عدد المشاركين: **${collected.size}** لاعب`
      )
      .setColor(rarityColor)
      .setThumbnail(winner.author.displayAvatarURL())
      .setFooter({ text: `مزاد SUKz Bot • ${item.game}` })
      .setTimestamp();

    await message.channel.send({ content: `🔔 <@${winner.author.id}>`, embeds: [winnerEmbed] });

  } finally {
    activeAuctions.delete(channelId);
  }
}
