import { EmbedBuilder, ColorResolvable } from 'discord.js';
import { BotConfig } from '../config';

export interface PostData {
  title?: string;
  description?: string;
  color?: string;
  thumbnail?: string;
  image?: string;
  footer?: string;
  templateType: string;
}

export function createBaseEmbed(data: PostData): EmbedBuilder {
  const embed = new EmbedBuilder();
  
  if (data.title) embed.setTitle(data.title);
  if (data.description) embed.setDescription(data.description);
  
  // Resolve Color
  if (data.color) {
    embed.setColor(data.color as ColorResolvable);
  } else {
    embed.setColor(BotConfig.brandColor);
  }

  // Set Author / Header based on template
  embed.setAuthor({
    name: `${data.templateType} Post`,
    iconURL: BotConfig.brand.logo,
  });

  if (data.thumbnail) embed.setThumbnail(data.thumbnail);
  if (data.image) embed.setImage(data.image);

  embed.setTimestamp();
  
  embed.setFooter({
    text: data.footer || BotConfig.footer.text,
    iconURL: BotConfig.footer.iconURL,
  });

  return embed;
}
