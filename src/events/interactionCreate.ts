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
} from 'discord.js';
import { PostService } from '../services/postService';
import { createBaseEmbed } from '../embeds';
import { CustomClient } from '../types';

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
      if (interaction.customId.startsWith('post_modal_')) {
        const parts = interaction.customId.split('_');
        // format: post_modal_{template}_{channelId}_{projectId}
        const isEdit = parts[1] === 'edit';
        
        let template = parts[2];
        let channelId = parts[3];
        let projectId = parts[4];
        let draftId: number | null = null;
        
        if (isEdit) {
           draftId = parseInt(parts[3], 10);
           // We need to fetch original data to know channel and template
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
          title,
          description,
          color,
          image,
          templateType: template,
          buttonUrl,
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
          new ButtonBuilder()
            .setCustomId(`post_publish_${savedDraft.id}`)
            .setLabel('Post')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`post_edit_${savedDraft.id}`)
            .setLabel('Edit')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`post_cancel_${savedDraft.id}`)
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({
          content: 'Here is a preview of your post:',
          embeds: [embed],
          components: [row],
          ephemeral: true,
        });
      }
    } 
    else if (interaction.isButton()) {
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
      else if (interaction.customId.startsWith('post_edit_')) {
        const draftId = parseInt(interaction.customId.split('_')[2]);
        const draft = await PostService.getPost(draftId);
        if (!draft) return interaction.reply({ content: 'Post draft not found.', ephemeral: true });

        const modal = new ModalBuilder()
          .setCustomId(`post_modal_edit_${draftId}`)
          .setTitle(`Edit Post`);

        const titleInput = new TextInputBuilder()
          .setCustomId('post_title')
          .setLabel('Title')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(draft.title || '');

        const descriptionInput = new TextInputBuilder()
          .setCustomId('post_description')
          .setLabel('Description')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setValue(draft.description || '');

        const colorInput = new TextInputBuilder()
          .setCustomId('post_color')
          .setLabel('Color (Hex, e.g., #FF0000)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(draft.color || '');

        const imageInput = new TextInputBuilder()
          .setCustomId('post_image')
          .setLabel('Image URL')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(draft.image || '');
          
        const buttonUrlInput = new TextInputBuilder()
          .setCustomId('post_button_url')
          .setLabel('Button URL')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(draft.buttonUrl || '');

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(buttonUrlInput)
        );

        await interaction.showModal(modal);
      }
    }
  },
};
