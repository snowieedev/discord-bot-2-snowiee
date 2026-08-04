import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { BotConfig } from '../config';

export const suggestionCommand = {
  data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('Create a new suggestion')
    .addStringOption(option => {
      option.setName('project')
        .setDescription('The project to suggest for')
        .setRequired(true);
      BotConfig.projects.forEach(p => option.addChoices({ name: p.name, value: p.id }));
      return option;
    })
    .addStringOption(option => 
      option.setName('type')
        .setDescription('The type of suggestion')
        .setRequired(true)
        .addChoices(
          { name: 'Feature Request', value: 'Feature Request' },
          { name: 'Improvement', value: 'Improvement' },
          { name: 'UI/UX', value: 'UI/UX' },
          { name: 'Performance', value: 'Performance' },
          { name: 'Other', value: 'Other' }
        )
    )
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('Upload an image attachment')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const project = interaction.options.getString('project');
    const type = interaction.options.getString('type');
    const attachment = interaction.options.getAttachment('image');

    const interactionId = interaction.id;
    (global as any).modalCache = (global as any).modalCache || new Map();
    (global as any).modalCache.set(interactionId, { project, type, attachmentUrl: attachment?.url });

    const modal = new ModalBuilder()
      .setCustomId(`sug_modal_${interactionId}`)
      .setTitle('New Suggestion');

    const titleInput = new TextInputBuilder()
      .setCustomId('sug_title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const descInput = new TextInputBuilder()
      .setCustomId('sug_desc')
      .setLabel('Description')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000);

    const imageInput = new TextInputBuilder()
      .setCustomId('sug_image')
      .setLabel('Image URL (Optional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput)
    );

    await interaction.showModal(modal);
  },
};
