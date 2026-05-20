const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('حذف عدد معين من الرسائل')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('عدد الرسائل (1-100)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        if (amount <= 0 || amount > 100) {
            return interaction.reply({ content: 'يرجى اختيار عدد بين 1 و 100.', ephemeral: true });
        }
        await interaction.channel.bulkDelete(amount, true);
        return interaction.reply({ content: `تم حذف ${amount} رسالة بنجاح!`, ephemeral: true });
    },
};
