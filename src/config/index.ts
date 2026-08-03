import { ColorResolvable } from 'discord.js';

export interface ProjectConfig {
  id: string;
  name: string;
  description: string;
  url: string;
}

export const BotConfig = {
  brandColor: '#5865F2' as ColorResolvable,
  errorColor: '#ED4245' as ColorResolvable,
  successColor: '#57F287' as ColorResolvable,
  
  footer: {
    text: 'Snowiee Community',
    iconURL: 'https://i.imgur.com/AfFp7pu.png', // Placeholder
  },
  
  brand: {
    website: 'https://snowiee.com',
    logo: 'https://i.imgur.com/AfFp7pu.png', // Placeholder
  },
  
  buttonDefaults: {
    style: 1, // 1 = Primary, 2 = Secondary, 3 = Success, 4 = Danger, 5 = Link
  },
  
  // Projects available in the Project Update template
  projects: [
    {
      id: 'snowos',
      name: 'SnowOS',
      description: 'The next generation operating system.',
      url: 'https://snowos.example.com'
    },
    {
      id: 'supporty',
      name: 'Supporty',
      description: 'Customer support bot.',
      url: 'https://supporty.example.com'
    },
    {
      id: 'snowhub',
      name: 'SnowHub',
      description: 'Community hub platform.',
      url: 'https://snowhub.example.com'
    },
    {
      id: 'readme_builder',
      name: 'Readme Builder',
      description: 'Tool for generating awesome READMEs.',
      url: 'https://readme.example.com'
    },
    {
      id: 'portfolio',
      name: 'Portfolio',
      description: 'Personal portfolio website.',
      url: 'https://portfolio.example.com'
    }
  ] as ProjectConfig[],
};
