import { EmbedBuilder } from 'discord.js';
import { BotConfig } from '../config';

export function createSuggestionEmbed(suggestion: any, author: { tag: string; displayAvatarURL: () => string }, project: any, votes: { upvotes: number; downvotes: number }) {
  const statusColors: any = BotConfig.modules.suggestions.colors;
  let color = statusColors[suggestion.status.toLowerCase().replace(' ', '')] || BotConfig.brandColor;
  
  // Special case map for status keys if needed
  if (suggestion.status === 'In Progress') color = statusColors.inProgress;
  else if (suggestion.status === 'Pending') color = statusColors.pending;

  const embed = new EmbedBuilder()
    .setTitle(`Suggestion #${suggestion.id}: ${suggestion.title}`)
    .setDescription(suggestion.description)
    .setColor(color)
    .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL() })
    .addFields(
      { name: 'Project', value: project?.name || suggestion.projectKey, inline: true },
      { name: 'Category', value: suggestion.type, inline: true },
      { name: 'Status', value: suggestion.status, inline: true },
      { name: 'Votes', value: `⬆️ ${votes.upvotes} | ⬇️ ${votes.downvotes}`, inline: false }
    )
    .setTimestamp(suggestion.createdAt);

  if (suggestion.imageUrl) {
    embed.setImage(suggestion.imageUrl);
  }

  return embed;
}
