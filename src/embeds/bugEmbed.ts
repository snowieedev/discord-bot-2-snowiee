import { EmbedBuilder } from 'discord.js';
import { BotConfig } from '../config';

export function createBugEmbed(bug: any, author: { tag: string; displayAvatarURL: () => string }, project: any) {
  const severityColors: any = BotConfig.modules.bugs.colors;
  let color = severityColors[bug.severity.toLowerCase()] || BotConfig.errorColor;

  const embed = new EmbedBuilder()
    .setTitle(`Bug Report #${bug.id}: ${bug.title}`)
    .setDescription(`**Description**\n${bug.description}\n\n**Steps to Reproduce**\n${bug.steps}\n\n**Expected**\n${bug.expected}\n\n**Actual**\n${bug.actual}`)
    .setColor(color)
    .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL() })
    .addFields(
      { name: 'Project', value: project?.name || bug.projectKey, inline: true },
      { name: 'Version', value: bug.version, inline: true },
      { name: 'Platform', value: bug.platform, inline: true },
      { name: 'Severity', value: bug.severity, inline: true },
      { name: 'Status', value: bug.status, inline: true }
    )
    .setTimestamp(bug.createdAt);

  if (bug.attachmentUrl) {
    embed.setImage(bug.attachmentUrl);
  }

  return embed;
}
