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

  // Projects available in the Project Update template and modules
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

  // Module Configurations
  modules: {
    suggestions: {
      enabled: true,
      autoCreateThread: true,
      duplicateThreshold: 0.6,
      colors: {
        pending: '#FEE75C' as ColorResolvable,
        reviewing: '#3498DB' as ColorResolvable,
        planned: '#9B59B6' as ColorResolvable,
        inProgress: '#E67E22' as ColorResolvable,
        testing: '#1ABC9C' as ColorResolvable,
        implemented: '#57F287' as ColorResolvable,
        declined: '#ED4245' as ColorResolvable,
        duplicate: '#95A5A6' as ColorResolvable,
      }
    },
    bugs: {
      enabled: true,
      autoCreateThread: true,
      duplicateThreshold: 0.6,
      colors: {
        critical: '#ED4245' as ColorResolvable, // Red
        high: '#E67E22' as ColorResolvable,     // Orange
        medium: '#FEE75C' as ColorResolvable,   // Yellow
        low: '#3498DB' as ColorResolvable,      // Blue
        duplicate: '#95A5A6' as ColorResolvable, // Gray
      }
    }
  },

  // Permissions & Staff Roles are now managed via DB
  permissions: {}
};
