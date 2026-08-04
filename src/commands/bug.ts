import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { BotConfig } from '../config';

export const bugCommand = {
  data: new SlashCommandBuilder()
    .setName('bug')
    .setDescription('Report a new bug')
    .addStringOption(option => {
      option.setName('project')
        .setDescription('The project to report a bug for')
        .setRequired(true);
      BotConfig.projects.forEach(p => option.addChoices({ name: p.name, value: p.id }));
      return option;
    })
    .addStringOption(option => 
      option.setName('version')
        .setDescription('The version of the project (e.g. 1.0.0)')
        .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('platform')
        .setDescription('Platform where the bug occurs')
        .setRequired(true)
        .addChoices(
          { name: 'Windows', value: 'Windows' },
          { name: 'macOS', value: 'macOS' },
          { name: 'Linux', value: 'Linux' },
          { name: 'Android', value: 'Android' },
          { name: 'iOS', value: 'iOS' },
          { name: 'Web', value: 'Web' }
        )
    )
    .addStringOption(option => 
      option.setName('severity')
        .setDescription('Severity of the bug')
        .setRequired(true)
        .addChoices(
          { name: 'Critical', value: 'Critical' },
          { name: 'High', value: 'High' },
          { name: 'Medium', value: 'Medium' },
          { name: 'Low', value: 'Low' }
        )
    )
    .addAttachmentOption(option =>
      option.setName('attachment')
        .setDescription('Upload an attachment (e.g. screenshot)')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const project = interaction.options.getString('project');
    const version = interaction.options.getString('version');
    const platform = interaction.options.getString('platform');
    const severity = interaction.options.getString('severity');
    const attachment = interaction.options.getAttachment('attachment');

    const interactionId = interaction.id;
    (global as any).modalCache = (global as any).modalCache || new Map();
    (global as any).modalCache.set(interactionId, { project, version, platform, severity, attachmentUrl: attachment?.url });

    const modal = new ModalBuilder()
      .setCustomId(`bug_modal_${interactionId}`)
      .setTitle('New Bug Report');

    const titleInput = new TextInputBuilder()
      .setCustomId('bug_title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const descInput = new TextInputBuilder()
      .setCustomId('bug_desc')
      .setLabel('Description')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const stepsInput = new TextInputBuilder()
      .setCustomId('bug_steps')
      .setLabel('Steps to Reproduce')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const expectedActualInput = new TextInputBuilder()
      .setCustomId('bug_exp_act')
      .setLabel('Expected vs Actual')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const attachmentInput = new TextInputBuilder()
      .setCustomId('bug_attachment')
      .setLabel('Attachment URL (Optional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(stepsInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(expectedActualInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(attachmentInput)
    );

    await interaction.showModal(modal);
  },
};
