import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { ConfigService } from '../services/configService';
import { BotConfig } from '../config';

export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure the bot for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option => 
      option.setName('suggestions_channel')
        .setDescription('Channel for Suggestions')
    )
    .addChannelOption(option => 
      option.setName('bugs_channel')
        .setDescription('Channel for Bug Reports')
    )
    .addStringOption(option => 
      option.setName('staff_roles')
        .setDescription('Comma-separated role IDs for staff permissions')
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const sugChannel = interaction.options.getChannel('suggestions_channel');
    const bugChannel = interaction.options.getChannel('bugs_channel');
    const staffRoles = interaction.options.getString('staff_roles');

    const updateData: any = {};
    if (sugChannel) updateData.suggestionsChannelId = sugChannel.id;
    if (bugChannel) updateData.bugsChannelId = bugChannel.id;
    if (staffRoles) updateData.staffRoleIds = staffRoles;

    if (Object.keys(updateData).length === 0) {
      // Just display current config
      const config = await ConfigService.getConfig(interaction.guildId);
      const embed = new EmbedBuilder()
        .setTitle('Server Configuration')
        .setColor(BotConfig.brandColor)
        .addFields(
          { name: 'Suggestions Channel', value: config?.suggestionsChannelId ? `<#${config.suggestionsChannelId}>` : 'Not Set' },
          { name: 'Bugs Channel', value: config?.bugsChannelId ? `<#${config.bugsChannelId}>` : 'Not Set' },
          { name: 'Staff Roles', value: config?.staffRoleIds ? config.staffRoleIds.split(',').map(r => `<@&${r.trim()}>`).join(' ') : 'Not Set' }
        );
      
      return interaction.followUp({ content: 'Use the options to update configuration.', embeds: [embed] });
    }

    await ConfigService.updateConfig(interaction.guildId, updateData);

    const config = await ConfigService.getConfig(interaction.guildId);
    const embed = new EmbedBuilder()
      .setTitle('Server Configuration Updated')
      .setColor(BotConfig.successColor)
      .addFields(
        { name: 'Suggestions Channel', value: config?.suggestionsChannelId ? `<#${config.suggestionsChannelId}>` : 'Not Set' },
        { name: 'Bugs Channel', value: config?.bugsChannelId ? `<#${config.bugsChannelId}>` : 'Not Set' },
        { name: 'Staff Roles', value: config?.staffRoleIds ? config.staffRoleIds.split(',').map(r => `<@&${r.trim()}>`).join(' ') : 'Not Set' }
      );

    await interaction.followUp({ embeds: [embed] });
  },
};
