import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { BugService } from '../services/bugService';
import { ConfigService } from '../services/configService';
import { BotConfig } from '../config';

export const bugsCommand = {
  data: new SlashCommandBuilder()
    .setName('bugs')
    .setDescription('Search and filter bug reports')
    .addStringOption(option => {
      option.setName('project')
        .setDescription('Filter by project');
      BotConfig.projects.forEach(p => option.addChoices({ name: p.name, value: p.id }));
      return option;
    })
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Filter by status')
        .addChoices(
          { name: 'Open', value: 'Open' },
          { name: 'Investigating', value: 'Investigating' },
          { name: 'Confirmed', value: 'Confirmed' },
          { name: 'In Progress', value: 'In Progress' },
          { name: 'Needs More Info', value: 'Needs More Info' },
          { name: 'Testing', value: 'Testing' },
          { name: 'Fixed', value: 'Fixed' },
          { name: 'Released', value: 'Released' },
          { name: 'Closed', value: 'Closed' },
          { name: 'Duplicate', value: 'Duplicate' },
          { name: 'Rejected', value: 'Rejected' }
        )
    )
    .addStringOption(option =>
      option.setName('severity')
        .setDescription('Filter by severity')
        .addChoices(
          { name: 'Critical', value: 'Critical' },
          { name: 'High', value: 'High' },
          { name: 'Medium', value: 'Medium' },
          { name: 'Low', value: 'Low' }
        )
    )
    .addUserOption(option => 
      option.setName('reporter')
        .setDescription('Filter by reporter')
    )
    .addStringOption(option => 
      option.setName('sort')
        .setDescription('Sort order')
        .addChoices(
          { name: 'Newest', value: 'newest' },
          { name: 'Oldest', value: 'oldest' }
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const project = interaction.options.getString('project') || undefined;
    const status = interaction.options.getString('status') || undefined;
    const severity = interaction.options.getString('severity') || undefined;
    const reporter = interaction.options.getUser('reporter')?.id || undefined;
    const sort = (interaction.options.getString('sort') as 'newest' | 'oldest') || 'newest';

    const results = await BugService.getBugs({ projectKey: project, status, severity, authorId: reporter, sort });

    if (results.length === 0) {
      return interaction.followUp('No bug reports found matching those filters.');
    }

    const config = interaction.guildId ? await ConfigService.getConfig(interaction.guildId) : null;
    const channelId = config?.bugsChannelId;

    const embed = new EmbedBuilder()
      .setTitle('Bug Reports Search Results')
      .setColor(BotConfig.brandColor);

    // Display top 10
    const topResults = results.slice(0, 10);
    let desc = '';
    topResults.forEach(b => {
      desc += `**#${b.id} - ${b.title}**\nProject: ${b.projectKey} | Severity: ${b.severity} | Status: ${b.status}\n`;
      if (b.messageId && channelId) {
        desc += `[View Bug Report](https://discord.com/channels/${interaction.guildId}/${channelId}/${b.messageId})\n\n`;
      } else {
        desc += '\n';
      }
    });

    embed.setDescription(desc);
    if (results.length > 10) {
      embed.setFooter({ text: `Showing 10 of ${results.length} results.` });
    }

    await interaction.followUp({ embeds: [embed] });
  },
};
