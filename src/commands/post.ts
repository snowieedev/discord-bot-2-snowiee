import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
} from 'discord.js';
import { BotConfig } from '../config';

const templates = [
  'Announcement',
  'Rules',
  'Welcome',
  'News',
  'Project Update',
  'Changelog',
  'Release',
  'Maintenance',
  'Event',
  'Poll',
  'Custom'
];

export const postCommand = {
  data: new SlashCommandBuilder()
    .setName('post')
    .setDescription('Create or edit a community post.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new post')
        .addStringOption(option =>
          option.setName('template')
            .setDescription('Select the post template')
            .setRequired(true)
            .addChoices(...templates.map(t => ({ name: t, value: t })))
        )
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send the post to')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
        .addStringOption(option => 
          option.setName('project')
            .setDescription('Select a project (only for Project Update template)')
            .setRequired(false)
            .addChoices(...BotConfig.projects.map(p => ({ name: p.name, value: p.id })))
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('Edit an existing post (not fully implemented yet)')
        .addStringOption(option =>
          option.setName('message_id')
            .setDescription('The ID of the message to edit')
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const template = interaction.options.getString('template', true);
      const channel = interaction.options.getChannel('channel', true);
      const project = interaction.options.getString('project');

      if (template === 'Project Update' && !project) {
        return interaction.reply({ content: 'You must select a project when using the Project Update template.', ephemeral: true });
      }

      // Create Modal for Post Content
      const modal = new ModalBuilder()
        .setCustomId(`post_modal_${template}_${channel.id}_${project || 'none'}`)
        .setTitle(`Create ${template} Post`);

      const titleInput = new TextInputBuilder()
        .setCustomId('post_title')
        .setLabel('Title')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('post_description')
        .setLabel('Description')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const colorInput = new TextInputBuilder()
        .setCustomId('post_color')
        .setLabel('Color (Hex, e.g., #FF0000)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const imageInput = new TextInputBuilder()
        .setCustomId('post_image')
        .setLabel('Image URL')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);
      
      const buttonUrlInput = new TextInputBuilder()
        .setCustomId('post_button_url')
        .setLabel('Button URL (optional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(buttonUrlInput)
      );

      // Show modal to user
      await interaction.showModal(modal);
    } else if (subcommand === 'edit') {
      await interaction.reply({ content: 'Edit feature is under development.', ephemeral: true });
    }
  },
};
