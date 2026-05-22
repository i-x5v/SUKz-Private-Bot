import { SlashCommandBuilder, ChatInputCommandInteraction, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ChannelSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";

// قاعدة البيانات المؤقتة
const userBalances = new Map<string, number>(); // userId -> balance
const bankChannels = new Map<string, string>(); // guildId -> bankChannelId

// الحصول على الرصيد
function getBalance(userId: string): number {
  return userBalances.get(userId) ?? 1000; // رصيد ابتدائي 1000
}

// تحديث الرصيد
function setBalance(userId: string, amount: number): void {
  userBalances.set(userId, Math.max(0, amount));
}

// إضافة فلوس
function addBalance(userId: string, amount: number): void {
  setBalance(userId, getBalance(userId) + amount);
}

export const bankCommand = {
  data: new SlashCommandBuilder()
    .setName("بنك")
    .setDescription("نظام البنك والألعاب 🏦"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guildId!;
    const userId = interaction.user.id;

    // اختيار الروم
    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId("select_bank_channel")
      .setPlaceholder("اختر روم البنك");

    const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect);

    await interaction.reply({
      content: "🏦 اختر الروم اللي فيه البنك:",
      components: [row],
      ephemeral: true,
    });

    const filter = (i: StringSelectMenuInteraction) => i.user.id === userId;
    const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    if (collector) {
      collector.on("collect", async (i: any) => {
        const selectedChannelId = i.values[0];
        bankChannels.set(guildId, selectedChannelId);
        const channel = interaction.guild?.channels.cache.get(selectedChannelId);

        if (!channel || !channel.isTextBased()) {
          await i.reply({ content: "❌ الروم غير متاح!", ephemeral: true });
          return;
        }

        await showGameMenu(i, channel, userId, guildId, interaction.guild!);
      });

      collector.on("end", (collected) => {
        if (collected.size === 0) {
          interaction.editReply({
            content: "❌ انتهت المهلة الزمنية!",
            components: [],
          });
        }
      });
    }
  },
};

async function showGameMenu(
  interaction: any,
  bankChannel: any,
  userId: string,
  guildId: string,
  guild: any
): Promise<void> {
  const gameSelect = new StringSelectMenuBuilder()
    .setCustomId("select_game")
    .setPlaceholder("اختر اللعبة")
    .addOptions([
      { label: "💰 بخشيش", value: "tip", description: "احصل على فلوس عشوائية" },
      { label: "📈 استثمار", value: "invest", description: "استثمر فلوسك وركب على حظك" },
      { label: "🎰 سلوت", value: "slots", description: "لعبة السلوت الكلاسيكية" },
      { label: "🪙 قلب العملة", value: "flip", description: "راهن على وجه العملة" },
      { label: "🎲 النرد", value: "dice", description: "العب مع النرد" },
      { label: "👀 الرصيد", value: "balance", description: "شوف رصيدك الحالي" },
    ]);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(gameSelect);

  await interaction.update({
    content: "🎮 اختر اللعبة:",
    components: [row],
  });

  const collector = bankChannel.createMessageComponentCollector({
    filter: (m: any) => m.user.id === userId && m.customId === "select_game",
    time: 120000,
  });

  collector.on("collect", async (i: StringSelectMenuInteraction) => {
    const game = i.values[0];

    if (game === "balance") {
      const balance = getBalance(userId);
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("💰 رصيدك الحالي")
        .setDescription(`💵 ${balance} فلوس`);
      await i.reply({ embeds: [embed] });
      return;
    }

    // اختيار المبلغ
    const amountSelect = new StringSelectMenuBuilder()
      .setCustomId(`game_amount_${game}`)
      .setPlaceholder("اختر المبلغ")
      .addOptions(
        ["100", "500", "1000", "5000"].map((amount) => ({
          label: `${amount} فلوس`,
          value: amount,
        }))
      );

    const amountRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(amountSelect);

    await i.reply({
      content: "اختر المبلغ اللي تبي تراهن عليه:",
      components: [amountRow],
      ephemeral: true,
    });

    const amountCollector = bankChannel.createMessageComponentCollector({
      filter: (m: any) => m.user.id === userId && m.customId === `game_amount_${game}`,
      time: 60000,
      max: 1,
    });

    amountCollector.on("collect", async (gameInteraction: StringSelectMenuInteraction) => {
      const amount = parseInt(gameInteraction.values[0]);
      const balance = getBalance(userId);

      if (balance < amount) {
        await gameInteraction.reply({ content: "❌ ما في فلوس كافية!", ephemeral: true });
        return;
      }

      await playGame(game, amount, userId, gameInteraction, bankChannel);
    });
  });
}

async function playGame(game: string, amount: number, userId: string, interaction: any, bankChannel: any): Promise<void> {
  const balance = getBalance(userId);
  let result: boolean;
  let winAmount: number;
  let message: string;
  let imageUrl: string;

  const embed = new EmbedBuilder()
    .setTitle("🎮 جاري تشغيل اللعبة...")
    .setColor(0x0099ff);

  const reply = await interaction.reply({ embeds: [embed], ephemeral: true });

  // انتظر شوي
  await new Promise((resolve) => setTimeout(resolve, 2000));

  switch (game) {
    case "tip":
      winAmount = Math.floor(Math.random() * 500) + 50;
      result = true;
      message = `🎉 الف مبروك! اخذت **${winAmount}** فلوس بخشيش!`;
      imageUrl = "https://media.giphy.com/media/3ohzdKdb5GlZJUNS3K/giphy.gif";
      addBalance(userId, winAmount);
      break;

    case "invest":
      const investMultiplier = Math.random() * 3;
      if (investMultiplier > 1.5) {
        winAmount = Math.floor(amount * investMultiplier);
        result = true;
        message = `📈 استثمارك نجح! ربحت **${winAmount - amount}** فلوس!`;
        imageUrl = "https://media.giphy.com/media/l3q2K5jinAlZ9FAZi/giphy.gif";
        addBalance(userId, winAmount - amount);
      } else {
        result = false;
        message = `📉 للأسف استثمارك خسر! خسرت **${amount}** فلوس`;
        imageUrl = "https://media.giphy.com/media/10JhviFj64qVVm/giphy.gif";
        setBalance(userId, balance - amount);
      }
      break;

    case "slots":
      const symbols = ["🍒", "🍋", "🍊", "⭐", "💎", "7️⃣"];
      const s1 = symbols[Math.floor(Math.random() * symbols.length)]!;
      const s2 = symbols[Math.floor(Math.random() * symbols.length)]!;
      const s3 = symbols[Math.floor(Math.random() * symbols.length)]!;

      if (s1 === s2 && s2 === s3) {
        winAmount = amount * 3;
        result = true;
        message = `🎰 ${s1} ${s2} ${s3}\n🎉 جاكبوت! ربحت **${winAmount}** فلوس!`;
        imageUrl = "https://media.giphy.com/media/g9aZ66K7KDxCvPAEFJ/giphy.gif";
        addBalance(userId, winAmount - amount);
      } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        winAmount = Math.floor(amount * 1.5);
        result = true;
        message = `🎰 ${s1} ${s2} ${s3}\n✨ ربحت **${winAmount - amount}** فلوس!`;
        imageUrl = "https://media.giphy.com/media/d8dVXr48wT3d2gGVDp/giphy.gif";
        addBalance(userId, winAmount - amount);
      } else {
        result = false;
        message = `🎰 ${s1} ${s2} ${s3}\n❌ خسرت **${amount}** فلوس`;
        imageUrl = "https://media.giphy.com/media/26uf1EUQzrO0Oy3xC/giphy.gif";
        setBalance(userId, balance - amount);
      }
      break;

    case "flip":
      const flipResult = Math.random() > 0.5 ? "صورة" : "كتابة";
      const isWin = Math.random() > 0.5;

      if (isWin) {
        result = true;
        message = `🪙 النتيجة: **${flipResult}** ✨\n🎉 فزت! ربحت **${amount}** فلوس!`;
        imageUrl = "https://media.giphy.com/media/l0HlTy9x8FZo0XO1i/giphy.gif";
        addBalance(userId, amount);
      } else {
        result = false;
        message = `🪙 النتيجة: **${flipResult}** ❌\nخسرت **${amount}** فلوس`;
        imageUrl = "https://media.giphy.com/media/RJAjTowsU0K1a/giphy.gif";
        setBalance(userId, balance - amount);
      }
      break;

    case "dice":
    default:
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      const playerGuess = Math.random() > 0.5;

      if (playerGuess) {
        result = true;
        message = `🎲 النتيجة: **${diceRoll}**\n🎉 فزت! ربحت **${amount}** فلوس!`;
        imageUrl = "https://media.giphy.com/media/1BXa2alBjrCXA4PrYL/giphy.gif";
        addBalance(userId, amount);
      } else {
        result = false;
        message = `🎲 النتيجة: **${diceRoll}**\n❌ خسرت **${amount}** فلوس`;
        imageUrl = "https://media.giphy.com/media/l0HlQaQ5EHWMRYnAI/giphy.gif";
        setBalance(userId, balance - amount);
      }
      break;
  }

  // إرسال النتيجة في الروم
  const gameEmbed = new EmbedBuilder()
    .setColor(result ? 0x00ff00 : 0xff0000)
    .setTitle(message)
    .setImage(imageUrl)
    .setFooter({ text: `💰 رصيدك الآن: ${getBalance(userId)} فلوس` });

  await bankChannel.send({ embeds: [gameEmbed] });

  // رد في الـ interaction
  await reply.edit({
    content: "✅ تم! النتيجة بترسل في الروم... ✨",
    embeds: [],
  });
}
