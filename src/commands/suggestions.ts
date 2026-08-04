import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { SuggestionService } from '../services/suggestionService';
import { BotConfig } from '../config';

export const suggestionsCommand = {
  data: new SlashCommandBuilder()
    .setName('suggestions')
    .setDescription('Search and filter suggestions')
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
          { name: 'Pending', value: 'Pending' },
          { name: 'Reviewing', value: 'Reviewing' },
          { name: 'Planned', value: 'Planned' },
          { name: 'In Progress', value: 'In Progress' },
          { name: 'Testing', value: 'Testing' },
          { name: 'Implemented', value: 'Implemented' },
          { name: 'Declined', value: 'Declined' },
          { name: 'Duplicate', value: 'Duplicate' }
        )
    )
    .addUserOption(option => 
      option.setName('author')
        .setDescription('Filter by author')
    )
    .addStringOption(option => 
      option.setName('sort')
        .setDescription('Sort order')
        .addChoices(
          { name: 'Newest', value: 'newest' },
          { name: 'Most Upvoted', value: 'upvoted' }
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const project = interaction.options.getString('project') || undefined;
    const status = interaction.options.getString('status') || undefined;
    const author = interaction.options.getUser('author')?.id || undefined;
    const sort = (interaction.options.getString('sort') as 'newest' | 'upvoted') || 'newest';

    const results = await SuggestionService.getSuggestions({ projectKey: project, status, authorId: author, sort });

    if (results.length === 0) {
      return interaction.followUp('No suggestions found matching those filters.');
    }

    const embed = new EmbedBuilder()
      .setTitle('Suggestions Search Results')
      .setColor(BotConfig.brandColor);

    // Display top 10
    const topResults = results.slice(0, 10);
    let desc = '';
    topResults.forEach(s => {
      desc += `**#${s.id} - ${s.title}**\nProject: ${s.projectKey} | Status: ${s.status} | ⬆️ ${s.upvotes} ⬇️ ${s.downvotes}\n`;
      if (s.messageId) {
        desc += `[View Suggestion](https://discord.com/channels/${interaction.guildId}/${BotConfig.modules.suggestions.channelId}/${s.messageId})\n\n`;
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
