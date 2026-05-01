import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const balances = new Map<string, number>();
function getBalance(userId: string): number { return balances.get(userId) ?? 1000; }
function setBalance(userId: string, amount: number): void { balances.set(userId, Math.max(0, amount)); }

export const gamesCommands = [
  {
    data: new SlashCommandBuilder()
      .setName("tictactoe")
      .setDescription("Play Tic Tac Toe against the bot"),
    async execute(interaction: ChatInputCommandInteraction) {
      const board = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
      const display = () => `\`\`\`\n${board[0]} | ${board[1]} | ${board[2]}\n---------\n${board[3]} | ${board[4]} | ${board[5]}\n---------\n${board[6]} | ${board[7]} | ${board[8]}\n\`\`\``;
      await interaction.reply(`🎮 **Tic Tac Toe!**\nYou are ❌, bot is ⭕\n${display()}\n*Type a number 1-9 to play! (Use /tictactoe move to play)*`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("hangman")
      .setDescription("Play Hangman"),
    async execute(interaction: ChatInputCommandInteraction) {
      const words = ["discord", "javascript", "programming", "computer", "keyboard", "monitor"];
      const word = words[Math.floor(Math.random() * words.length)]!;
      const hidden = word.split("").map(() => "_").join(" ");
      await interaction.reply(`🪢 **Hangman!**\nWord: \`${hidden}\` (${word.length} letters)\n\nGuess letters using: \`/hangman guess <letter>\`\n\n*(Hint: It's a ${word.length}-letter word related to tech!)*`);
    },
  },
  {
    data: new SlashCommandBuilder().setName("wordle").setDescription("Play a Wordle-like game"),
    async execute(interaction: ChatInputCommandInteraction) {
      const words = ["crane", "blaze", "flint", "ghost", "prism", "crisp"];
      const word = words[Math.floor(Math.random() * words.length)]!;
      await interaction.reply(`🟩 **Wordle!**\nGuess the 5-letter word!\nYou have 6 attempts.\n\n🟩 = Correct spot | 🟨 = Wrong spot | ⬜ = Not in word\n\n*Hint: The word starts with \`${word[0]?.toUpperCase()}\`*`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("slots")
      .setDescription("Play the slot machine")
      .addIntegerOption(opt => opt.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(10)),
    async execute(interaction: ChatInputCommandInteraction) {
      const bet = interaction.options.getInteger("bet", true);
      const userId = interaction.user.id;
      if (getBalance(userId) < bet) return interaction.reply("❌ Not enough coins!");
      const symbols = ["🍒", "🍋", "🍊", "⭐", "💎", "7️⃣"];
      const s1 = symbols[Math.floor(Math.random() * symbols.length)]!;
      const s2 = symbols[Math.floor(Math.random() * symbols.length)]!;
      const s3 = symbols[Math.floor(Math.random() * symbols.length)]!;
      let msg = `🎰 | ${s1} | ${s2} | ${s3} |`;
      if (s1 === s2 && s2 === s3) {
        const win = bet * (s1 === "💎" ? 10 : s1 === "7️⃣" ? 7 : 3);
        setBalance(userId, getBalance(userId) + win);
        msg += `\n🎉 **JACKPOT! You won ${win} coins!**`;
      } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        const win = Math.floor(bet * 0.5);
        setBalance(userId, getBalance(userId) + win);
        msg += `\n✅ **Small win! +${win} coins!**`;
      } else {
        setBalance(userId, getBalance(userId) - bet);
        msg += `\n❌ **No match! -${bet} coins!**`;
      }
      msg += `\n💰 Balance: **${getBalance(userId).toLocaleString()} coins**`;
      await interaction.reply(msg);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("blackjack")
      .setDescription("Play Blackjack against the bot")
      .addIntegerOption(opt => opt.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(10)),
    async execute(interaction: ChatInputCommandInteraction) {
      const bet = interaction.options.getInteger("bet", true);
      const userId = interaction.user.id;
      if (getBalance(userId) < bet) return interaction.reply("❌ Not enough coins!");
      const cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      const vals: Record<string, number> = { A: 11, J: 10, Q: 10, K: 10 };
      const cardVal = (c: string) => vals[c] ?? parseInt(c);
      const draw = () => cards[Math.floor(Math.random() * cards.length)]!;
      const player = [draw(), draw()];
      const dealer = [draw(), draw()];
      const playerTotal = player.reduce((s, c) => s + cardVal(c), 0);
      const dealerTotal = dealer.reduce((s, c) => s + cardVal(c), 0);
      let result = "";
      if (playerTotal === 21) { setBalance(userId, getBalance(userId) + bet * 2); result = `🎉 **Blackjack! You win ${bet * 2} coins!**`; }
      else if (dealerTotal === 21) { setBalance(userId, getBalance(userId) - bet); result = `❌ **Dealer Blackjack! You lose ${bet} coins!**`; }
      else if (playerTotal > dealerTotal) { setBalance(userId, getBalance(userId) + bet); result = `✅ **You win! +${bet} coins!**`; }
      else if (dealerTotal > playerTotal) { setBalance(userId, getBalance(userId) - bet); result = `❌ **Dealer wins! -${bet} coins!**`; }
      else result = "🤝 **It's a tie!**";
      const embed = new EmbedBuilder()
        .setTitle("🃏 Blackjack")
        .addFields(
          { name: `Your Hand (${playerTotal})`, value: player.join(" "), inline: true },
          { name: `Dealer Hand (${dealerTotal})`, value: dealer.join(" "), inline: true },
          { name: "Result", value: result },
          { name: "Balance", value: `${getBalance(userId).toLocaleString()} coins` },
        )
        .setColor(playerTotal > dealerTotal ? 0x00ff00 : 0xff0000);
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("roulette")
      .setDescription("Play Roulette")
      .addIntegerOption(opt => opt.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(10))
      .addStringOption(opt => opt.setName("choice").setDescription("red, black, green, or a number 0-36").setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
      const bet = interaction.options.getInteger("bet", true);
      const choice = interaction.options.getString("choice", true).toLowerCase();
      const userId = interaction.user.id;
      if (getBalance(userId) < bet) return interaction.reply("❌ Not enough coins!");
      const spin = Math.floor(Math.random() * 37);
      const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      const isRed = reds.includes(spin);
      const color = spin === 0 ? "green 🟢" : isRed ? "red 🔴" : "black ⚫";
      let win = 0;
      if (choice === `${spin}`) win = bet * 35;
      else if (choice === "red" && isRed) win = bet;
      else if (choice === "black" && !isRed && spin !== 0) win = bet;
      else if (choice === "green" && spin === 0) win = bet * 17;
      if (win > 0) { setBalance(userId, getBalance(userId) + win); await interaction.reply(`🎡 Ball landed on **${spin}** (${color})\n🎉 **You won ${win} coins!**\n💰 Balance: **${getBalance(userId).toLocaleString()} coins**`); }
      else { setBalance(userId, getBalance(userId) - bet); await interaction.reply(`🎡 Ball landed on **${spin}** (${color})\n❌ **You lost ${bet} coins!**\n💰 Balance: **${getBalance(userId).toLocaleString()} coins**`); }
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("lottery")
      .setDescription("Buy a lottery ticket")
      .addIntegerOption(opt => opt.setName("tickets").setDescription("Number of tickets (100 coins each)").setRequired(true).setMinValue(1).setMaxValue(100)),
    async execute(interaction: ChatInputCommandInteraction) {
      const tickets = interaction.options.getInteger("tickets", true);
      const cost = tickets * 100;
      const userId = interaction.user.id;
      if (getBalance(userId) < cost) return interaction.reply(`❌ You need **${cost} coins** but only have **${getBalance(userId)} coins**.`);
      setBalance(userId, getBalance(userId) - cost);
      const winChance = tickets / 100;
      if (Math.random() < winChance) {
        const prize = Math.floor(Math.random() * 10000) + 5000;
        setBalance(userId, getBalance(userId) + prize);
        await interaction.reply(`🎟️ You bought **${tickets}** ticket(s) for **${cost} coins**!\n🎉 **YOU WIN THE LOTTERY! +${prize} coins!**\n💰 Balance: **${getBalance(userId).toLocaleString()} coins**`);
      } else {
        await interaction.reply(`🎟️ You bought **${tickets}** ticket(s) for **${cost} coins**.\n😢 **Better luck next time!**\n💰 Balance: **${getBalance(userId).toLocaleString()} coins**`);
      }
    },
  },
];
