import {
  Events,
  Interaction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  EmbedBuilder,
} from 'discord.js';
import { PostService } from '../services/postService';
import { SuggestionService } from '../services/suggestionService';
import { BugService } from '../services/bugService';
import { ConfigService } from '../services/configService';
import { createBaseEmbed } from '../embeds';
import { createSuggestionEmbed } from '../embeds/suggestionEmbed';
import { createBugEmbed } from '../embeds/bugEmbed';
import { CustomClient } from '../types';
import { BotConfig } from '../config';

// Small cache for pending duplicate warnings
const pendingSuggestions = new Map<string, any>();
const pendingBugs = new Map<string, any>();

export const interactionCreateEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction, client: CustomClient) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
        } else {
          await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        }
      }
    } 
    else if (interaction.isModalSubmit()) {
      // POST MODAL
      if (interaction.customId.startsWith('post_modal_')) {
        const parts = interaction.customId.split('_');
        const isEdit = parts[1] === 'edit';
        
        let template = parts[2];
        let channelId = parts[3];
        let projectId = parts[4];
        let draftId: number | null = null;
        
        if (isEdit) {
           draftId = parseInt(parts[3], 10);
           const draft = await PostService.getPost(draftId);
           if (!draft) return interaction.reply({ content: 'Draft not found.', ephemeral: true });
           channelId = draft.channelId!;
           const temp = await PostService.getTemplateById(draft.templateId!);
           template = temp.name;
        }

        const title = interaction.fields.getTextInputValue('post_title') || undefined;
        const description = interaction.fields.getTextInputValue('post_description');
        const color = interaction.fields.getTextInputValue('post_color') || undefined;
        const image = interaction.fields.getTextInputValue('post_image') || undefined;
        const buttonUrl = interaction.fields.getTextInputValue('post_button_url') || undefined;

        const postData = {
          title, description, color, image, templateType: template, buttonUrl,
        };

        let savedDraft;
        if (isEdit && draftId) {
          await PostService.updateDraft(draftId, postData);
          savedDraft = { id: draftId };
        } else {
          savedDraft = await PostService.createDraft(interaction.user.id, channelId, postData, projectId);
        }

        const embed = createBaseEmbed(postData);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`post_publish_${savedDraft.id}`).setLabel('Post').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`post_edit_${savedDraft.id}`).setLabel('Edit').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`post_cancel_${savedDraft.id}`).setLabel('Cancel').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ content: 'Here is a preview of your post:', embeds: [embed], components: [row], ephemeral: true });
      }

      // SUGGESTION MODAL
      else if (interaction.customId.startsWith('sug_modal_')) {
        const interactionId = interaction.customId.replace('sug_modal_', '');
        const context = (global as any).modalCache?.get(interactionId);
        if (!context) return interaction.reply({ content: 'Session expired. Please run the command again.', ephemeral: true });

        const project = context.project;
        const type = context.type;

        const title = interaction.fields.getTextInputValue('sug_title');
        const description = interaction.fields.getTextInputValue('sug_desc');
        const image = interaction.fields.getTextInputValue('sug_image') || context.attachmentUrl || undefined;

        const similar = await SuggestionService.getSimilarSuggestions(title, project);

        const data = {
          projectKey: project,
          type,
          title,
          description,
          imageUrl: image,
          authorId: interaction.user.id
        };

        if (similar.length > 0) {
          const cacheId = `sug_${interaction.user.id}_${Date.now()}`;
          pendingSuggestions.set(cacheId, data);
          
          const embed = new EmbedBuilder()
            .setTitle('Duplicate Warning')
            .setColor(BotConfig.modules.suggestions.colors.duplicate)
            .setDescription('We found similar suggestions already posted. Please review them before proceeding.\n\n' + similar.slice(0, 3).map(s => `- **${s.title}** (Status: ${s.status})`).join('\n'));
          
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`sug_force_${cacheId}`).setLabel('Post Anyway').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`sug_cancel_${cacheId}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
          );

          await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        } else {
          await createAndSendSuggestion(interaction, data);
        }
      }

      // BUG MODAL
      else if (interaction.customId.startsWith('bug_modal_')) {
        const interactionId = interaction.customId.replace('bug_modal_', '');
        const context = (global as any).modalCache?.get(interactionId);
        if (!context) return interaction.reply({ content: 'Session expired. Please run the command again.', ephemeral: true });

        const title = interaction.fields.getTextInputValue('bug_title');
        const description = interaction.fields.getTextInputValue('bug_desc');
        const steps = interaction.fields.getTextInputValue('bug_steps');
        const expectedActual = interaction.fields.getTextInputValue('bug_exp_act');
        const attachment = interaction.fields.getTextInputValue('bug_attachment') || context.attachmentUrl || undefined;

        const similar = await BugService.getSimilarBugs(title, description, context.project);

        const data = {
          projectKey: context.project,
          version: context.version,
          platform: context.platform,
          severity: context.severity,
          title,
          description,
          steps,
          expected: expectedActual,
          actual: 'See expected',
          attachmentUrl: attachment,
          authorId: interaction.user.id
        };

        if (similar.length > 0) {
          const cacheId = `bug_${interaction.user.id}_${Date.now()}`;
          pendingBugs.set(cacheId, data);
          
          const embed = new EmbedBuilder()
            .setTitle('Duplicate Warning')
            .setColor(BotConfig.modules.bugs.colors.duplicate || BotConfig.errorColor)
            .setDescription('We found similar bug reports. Please review them before proceeding.\n\n' + similar.slice(0, 3).map(b => `- **${b.title}** (Status: ${b.status})`).join('\n'));
          
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`bug_force_${cacheId}`).setLabel('Report Anyway').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`bug_cancel_${cacheId}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
          );

          await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        } else {
          await createAndSendBug(interaction, data);
        }
      }
    } 
    else if (interaction.isButton()) {
      // POST BUTTONS
      if (interaction.customId.startsWith('post_publish_')) {
        const draftId = parseInt(interaction.customId.split('_')[2]);
        const draft = await PostService.getPost(draftId);
        if (!draft) return interaction.reply({ content: 'Post draft not found.', ephemeral: true });
        
        const templateRecord = await PostService.getTemplateById(draft.templateId!);
        
        const embed = createBaseEmbed({
          title: draft.title || undefined,
          description: draft.description || undefined,
          color: draft.color || undefined,
          image: draft.image || undefined,
          templateType: templateRecord.name,
        });

        const components = [];
        if (draft.buttonUrl) {
          components.push(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel('View / Link')
                .setURL(draft.buttonUrl)
                .setStyle(ButtonStyle.Link)
            )
          );
        }

        const channel = interaction.client.channels.cache.get(draft.channelId!) as TextChannel;
        if (!channel) return interaction.reply({ content: 'Target channel not found.', ephemeral: true });

        const msg = await channel.send({ embeds: [embed], components: components.length ? components : undefined });
        await PostService.markPublished(draft.id, msg.id);
        await interaction.update({ content: 'Post published successfully!', embeds: [], components: [] });
      }
      else if (interaction.customId.startsWith('post_cancel_')) {
        await interaction.update({ content: 'Post creation cancelled.', embeds: [], components: [] });
      }

      // SUGGESTION BUTTONS
      else if (interaction.customId.startsWith('sug_force_')) {
        const cacheId = interaction.customId.replace('sug_force_', '');
        const data = pendingSuggestions.get(cacheId);
        if (!data) return interaction.reply({ content: 'Session expired.', ephemeral: true });
        await createAndSendSuggestion(interaction, data, true);
        pendingSuggestions.delete(cacheId);
      }
      else if (interaction.customId.startsWith('sug_cancel_')) {
        await interaction.update({ content: 'Suggestion cancelled.', embeds: [], components: [] });
      }
      else if (interaction.customId.startsWith('sug_vote_')) {
        const parts = interaction.customId.split('_');
        const type = parts[2]; // 'up' or 'down'
        const sugId = parseInt(parts[3], 10);
        
        const res = await SuggestionService.toggleVote(sugId, interaction.user.id, type === 'up');
        const votes = await SuggestionService.getVoteCounts(sugId);
        const sug = await SuggestionService.getSuggestionById(sugId);
        const proj = BotConfig.projects.find(p => p.id === sug.projectKey);
        
        const newEmbed = createSuggestionEmbed(sug, { tag: 'User', displayAvatarURL: () => '' }, proj, votes);
        
        await interaction.message.edit({ embeds: [newEmbed] });
        await interaction.reply({ content: `Vote ${res}!`, ephemeral: true });
      }
      else if (interaction.customId.startsWith('sug_thread_')) {
        const sugId = parseInt(interaction.customId.replace('sug_thread_', ''), 10);
        const sug = await SuggestionService.getSuggestionById(sugId);
        if (sug.threadId) return interaction.reply({ content: 'Thread already exists!', ephemeral: true });
        
        const message = interaction.message;
        const thread = await message.startThread({ name: `Suggestion #${sug.id} Discussion` });
        await SuggestionService.updateSuggestion(sug.id, { threadId: thread.id });
        await interaction.reply({ content: `Thread created: <#${thread.id}>`, ephemeral: true });
      }

      // BUG BUTTONS
      else if (interaction.customId.startsWith('bug_force_')) {
        const cacheId = interaction.customId.replace('bug_force_', '');
        const data = pendingBugs.get(cacheId);
        if (!data) return interaction.reply({ content: 'Session expired.', ephemeral: true });
        await createAndSendBug(interaction, data, true);
        pendingBugs.delete(cacheId);
      }
      else if (interaction.customId.startsWith('bug_cancel_')) {
        await interaction.update({ content: 'Bug report cancelled.', embeds: [], components: [] });
      }
      else if (interaction.customId.startsWith('bug_thread_')) {
        const bugId = parseInt(interaction.customId.replace('bug_thread_', ''), 10);
        const bug = await BugService.getBugById(bugId);
        if (bug.threadId) return interaction.reply({ content: 'Thread already exists!', ephemeral: true });
        
        const message = interaction.message;
        const thread = await message.startThread({ name: `Bug #${bug.id} Discussion` });
        await BugService.updateBug(bug.id, { threadId: thread.id });
        await interaction.reply({ content: `Thread created: <#${thread.id}>`, ephemeral: true });
      }
    }
    else if (interaction.isStringSelectMenu()) {
      if (!interaction.guildId) return;
      const staffRoles = await ConfigService.getStaffRoles(interaction.guildId);
      const member = await interaction.guild?.members.fetch(interaction.user.id);
      
      const isStaff = member?.roles.cache.some(r => staffRoles.includes(r.id)) || member?.permissions.has('Administrator');
      
      if (!isStaff) {
        return interaction.reply({ content: 'You do not have permission to use this.', ephemeral: true });
      }

      if (interaction.customId.startsWith('staff_sug_status_')) {
        const sugId = parseInt(interaction.customId.replace('staff_sug_status_', ''), 10);
        const newStatus = interaction.values[0];
        
        await SuggestionService.updateSuggestionStatus(sugId, newStatus, interaction.user.id);
        const sug = await SuggestionService.getSuggestionById(sugId);
        const votes = await SuggestionService.getVoteCounts(sugId);
        const proj = BotConfig.projects.find(p => p.id === sug.projectKey);
        
        const author = await interaction.client.users.fetch(sug.authorId).catch(() => null);
        const authorData = author || { tag: 'Unknown User', displayAvatarURL: () => '' };

        const newEmbed = createSuggestionEmbed(sug, authorData, proj, votes);
        await interaction.message.edit({ embeds: [newEmbed] });
        await interaction.reply({ content: `Status updated to ${newStatus}`, ephemeral: true });
      }
      else if (interaction.customId.startsWith('staff_bug_status_')) {
        const bugId = parseInt(interaction.customId.replace('staff_bug_status_', ''), 10);
        const newStatus = interaction.values[0];
        
        await BugService.updateBugStatus(bugId, newStatus, interaction.user.id);
        const bug = await BugService.getBugById(bugId);
        const proj = BotConfig.projects.find(p => p.id === bug.projectKey);
        
        const author = await interaction.client.users.fetch(bug.authorId).catch(() => null);
        const authorData = author || { tag: 'Unknown User', displayAvatarURL: () => '' };

        const newEmbed = createBugEmbed(bug, authorData, proj);
        await interaction.message.edit({ embeds: [newEmbed] });
        await interaction.reply({ content: `Status updated to ${newStatus}`, ephemeral: true });
      }
    }
  },
};

async function createAndSendSuggestion(interaction: Interaction, data: any, isUpdate = false) {
  if (!interaction.guildId) return;
  const config = await ConfigService.getConfig(interaction.guildId);

  if (!config || !config.suggestionsChannelId) {
    const msg = 'This server has not configured a Suggestions channel yet. Please ask an Administrator to run `/setup`.';
    return isUpdate ? (interaction as any).update({ content: msg, embeds: [], components: [] }) : (interaction as any).reply({ content: msg, ephemeral: true });
  }

  const channel = interaction.client.channels.cache.get(config.suggestionsChannelId) as TextChannel;
  if (!channel) {
    const msg = 'The configured Suggestions channel was not found. Please ask an Administrator to run `/setup`.';
    return isUpdate ? (interaction as any).update({ content: msg, embeds: [], components: [] }) : (interaction as any).reply({ content: msg, ephemeral: true });
  }

  const sug = await SuggestionService.createSuggestion(data);
  const proj = BotConfig.projects.find(p => p.id === sug.projectKey);
  const embed = createSuggestionEmbed(sug, interaction.user, proj, { upvotes: 0, downvotes: 0 });

  const btnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`sug_vote_up_${sug.id}`).setLabel('⬆️ Upvote').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`sug_vote_down_${sug.id}`).setLabel('⬇️ Downvote').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`sug_thread_${sug.id}`).setLabel('💬 Discussion').setStyle(ButtonStyle.Secondary)
  );

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`staff_sug_status_${sug.id}`)
      .setPlaceholder('Staff: Change Status')
      .addOptions([
        { label: 'Pending', value: 'Pending' },
        { label: 'Reviewing', value: 'Reviewing' },
        { label: 'Planned', value: 'Planned' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Testing', value: 'Testing' },
        { label: 'Implemented', value: 'Implemented' },
        { label: 'Declined', value: 'Declined' },
        { label: 'Duplicate', value: 'Duplicate' }
      ])
  );

  const msgEmbed = await channel.send({ embeds: [embed], components: [btnRow, selectRow] });
  await SuggestionService.updateSuggestion(sug.id, { messageId: msgEmbed.id });

  if (BotConfig.modules.suggestions.autoCreateThread) {
    const thread = await msgEmbed.startThread({ name: `Suggestion #${sug.id} Discussion` });
    await SuggestionService.updateSuggestion(sug.id, { threadId: thread.id });
  }

  const res = { content: 'Suggestion submitted successfully!', embeds: [], components: [], ephemeral: true };
  return isUpdate ? (interaction as any).update(res) : (interaction as any).reply(res);
}

async function createAndSendBug(interaction: Interaction, data: any, isUpdate = false) {
  if (!interaction.guildId) return;
  const config = await ConfigService.getConfig(interaction.guildId);

  if (!config || !config.bugsChannelId) {
    const msg = 'This server has not configured a Bug Reports channel yet. Please ask an Administrator to run `/setup`.';
    return isUpdate ? (interaction as any).update({ content: msg, embeds: [], components: [] }) : (interaction as any).reply({ content: msg, ephemeral: true });
  }

  const channel = interaction.client.channels.cache.get(config.bugsChannelId) as TextChannel;
  if (!channel) {
    const msg = 'The configured Bug Reports channel was not found. Please ask an Administrator to run `/setup`.';
    return isUpdate ? (interaction as any).update({ content: msg, embeds: [], components: [] }) : (interaction as any).reply({ content: msg, ephemeral: true });
  }

  const bug = await BugService.createBug(data);
  const proj = BotConfig.projects.find(p => p.id === bug.projectKey);
  const embed = createBugEmbed(bug, interaction.user, proj);

  const btnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`bug_thread_${bug.id}`).setLabel('💬 Discussion').setStyle(ButtonStyle.Secondary)
  );

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`staff_bug_status_${bug.id}`)
      .setPlaceholder('Staff: Change Status')
      .addOptions([
        { label: 'Open', value: 'Open' },
        { label: 'Investigating', value: 'Investigating' },
        { label: 'Confirmed', value: 'Confirmed' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Needs More Info', value: 'Needs More Info' },
        { label: 'Testing', value: 'Testing' },
        { label: 'Fixed', value: 'Fixed' },
        { label: 'Released', value: 'Released' },
        { label: 'Closed', value: 'Closed' },
        { label: 'Duplicate', value: 'Duplicate' },
        { label: 'Rejected', value: 'Rejected' }
      ])
  );

  const msgEmbed = await channel.send({ embeds: [embed], components: [btnRow, selectRow] });
  await BugService.updateBug(bug.id, { messageId: msgEmbed.id });

  if (BotConfig.modules.bugs.autoCreateThread) {
    const thread = await msgEmbed.startThread({ name: `Bug #${bug.id} Discussion` });
    await BugService.updateBug(bug.id, { threadId: thread.id });
  }

  const res = { content: 'Bug report submitted successfully!', embeds: [], components: [], ephemeral: true };
  return isUpdate ? (interaction as any).update(res) : (interaction as any).reply(res);
}
