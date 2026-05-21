// commands/slash/banksetup.js

const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("banksetup")
    .setDescription("تحديد روم البنك")
    .addChannelOption(option =>
      option
        .setName("الروم")
        .setDescription("اختر روم البنك")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {

    const channel = interaction.options.getChannel("الروم");

    let setup = {};

    if (fs.existsSync("./data/setup.json")) {
      setup = JSON.parse(
        fs.readFileSync("./data/setup.json")
      );
    }

    setup[interaction.guild.id] = {
      bankRoom: channel.id
    };

    fs.writeFileSync(
      "./data/setup.json",
      JSON.stringify(setup, null, 2)
    );

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🏦 تم إعداد البنك")
      .setDescription(`تم تحديد ${channel} كروم البنك بنجاح`);

    await interaction.reply({
      embeds: [embed]
    });

  }
};
// events/messageCreate.js

const {
  EmbedBuilder
} = require("discord.js");

const fs = require("fs");

module.exports = {
  name: "messageCreate",

  async execute(message) {

    if (message.author.bot) return;

    // تحميل الإعدادات
    if (!fs.existsSync("./data/setup.json")) return;

    const setup = JSON.parse(
      fs.readFileSync("./data/setup.json")
    );

    const guildData = setup[message.guild.id];

    if (!guildData) return;

    // التأكد من روم البنك
    if (message.channel.id !== guildData.bankRoom) return;

    // الكلمات
    const content = message.content.toLowerCase();

    // تحميل الاقتصاد
    let economy = {};

    if (fs.existsSync("./data/economy.json")) {
      economy = JSON.parse(
        fs.readFileSync("./data/economy.json")
      );
    }

    // إنشاء حساب
    if (!economy[message.author.id]) {
      economy[message.author.id] = {
        money: 0
      };
    }

    // =========================
    // بخشيش
    // =========================

    if (content === "بخشيش") {

      const amount =
        Math.floor(Math.random() * 400) + 100;

      economy[message.author.id].money += amount;

      fs.writeFileSync(
        "./data/economy.json",
        JSON.stringify(economy, null, 2)
      );

      const embed = new EmbedBuilder()
        .setColor("Gold")
        .setTitle("💸 بخشيش")
        .setDescription(
          `أخذت ${amount}$\n\nرصيدك الحالي: ${economy[message.author.id].money}$`
        )
        .setImage("https://i.imgur.com/6qYQF0T.gif");

      return message.reply({
        embeds: [embed]
      });

    }

    // =========================
    // راتب
    // =========================

    if (content === "راتب") {

      const salary =
        Math.floor(Math.random() * 900) + 500;

      economy[message.author.id].money += salary;

      fs.writeFileSync(
        "./data/economy.json",
        JSON.stringify(economy, null, 2)
      );

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("💼 راتب")
        .setDescription(
          `استلمت راتب ${salary}$\n\nرصيدك الحالي: ${economy[message.author.id].money}$`
        )
        .setImage("https://i.imgur.com/vK4xQ7x.gif");

      return message.reply({
        embeds: [embed]
      });

    }

    // =========================
    // فلوسي
    // =========================

    if (
      content === "فلوسي" ||
      content === "رصيدي"
    ) {

      const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("🏦 حسابك البنكي")
        .setDescription(
          `رصيدك الحالي:\n\n💰 ${economy[message.author.id].money}$`
        )
        .setThumbnail(message.author.displayAvatarURL());

      return message.reply({
        embeds: [embed]
      });

    }

    // =========================
    // استثمار
    // =========================

    if (content === "استثمار") {

      const win = Math.random() > 0.5;

      let amount =
        Math.floor(Math.random() * 1000) + 300;

      if (win) {

        economy[message.author.id].money += amount;

        fs.writeFileSync(
          "./data/economy.json",
          JSON.stringify(economy, null, 2)
        );

        const embed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("📈 استثمار ناجح")
          .setDescription(
            `ربحت ${amount}$\n\nرصيدك الحالي: ${economy[message.author.id].money}$`
          );

        return message.reply({
          embeds: [embed]
        });

      } else {

        economy[message.author.id].money -= amount;

        if (economy[message.author.id].money < 0) {
          economy[message.author.id].money = 0;
        }

        fs.writeFileSync(
          "./data/economy.json",
          JSON.stringify(economy, null, 2)
        );

        const embed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("📉 استثمار فاشل")
          .setDescription(
            `خسرت ${amount}$\n\nرصيدك الحالي: ${economy[message.author.id].money}$`
          );

        return message.reply({
          embeds: [embed]
        });

      }

    }

  }
};
