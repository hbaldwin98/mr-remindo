import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { updateEvent } from '../database';
import logger from '../log';
import { Repeat } from '../scheduledEvent';
import { Scheduler } from '../scheduler';
import { DATABASE } from '../server';
import { Command } from './Command';

export class UpdateCommand extends Command {
  constructor() {
    super('update');
  }

  public async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    const data = interaction.options;
    const id = data.getNumber('id');
    const event = Scheduler.getEventById(interaction.guildId, id);

    if (event.guildId !== interaction.guildId) {
      logger.debug('User tried to update event from another guild');
      await interaction.reply({
        content: 'There is no event with this id.',
        ephemeral: true,
      });
      return;
    }

    if (event) {
      const [date, time, name, repeat, channelId, guildId, role] = [
        data.getString('date'),
        data.getString('time'),
        data.getString('name'),
        data.getString('repeat') as Repeat,
        interaction.channelId,
        interaction.guildId,
        data.get('role')?.role?.name,
      ];

      if (date && !time) {
        const updatedDate = event.updateDate(date);
        if (updatedDate.message) {
          await interaction.reply({ content: updatedDate.message, ephemeral: true });
          return;
        }
        event.date = event.updateDate(date) || event.date;
      } else if (time && !date) {
        const updatedDate = event.updateTime(time);
        if (updatedDate.message) {
          await interaction.reply({ content: updatedDate.message, ephemeral: true });
          return;
        }
        event.date = event.updateTime(time) || event.date;
      } else {
        event.date = date && time ? event.convertStringToDate(date, time) : event.date;
      }

      // update the event values
      event.name = name || event.name;
      event.repeat = repeat || event.repeat;
      event.channelId = channelId || event.channelId;
      event.role = role || event.role;

      if (event.isValidDate() && event.date > new Date()) {
        logger.info(`Updating event: ${event.name}`, {
          guild: interaction.guildId,
          channel: interaction.channelId,
          user: interaction.user.id,
        });
        // update the event in the database
        const result = await updateEvent(DATABASE, event);

        // if succesful, update event in scheduler
        if (result) {
          Scheduler.updateEvent(event);
          await interaction
            .reply({
              content: `Event updated\n${event.toString()}`,
              ephemeral: true,
            })
            .catch((err) => {
              logger.error(`Failed to send interaction reply for command: ${this.name}`, err);
            });
        } else {
          logger.debug(`Failed to update event: ${event.name}`);
          await interaction.reply({
            content: 'Failed to update event. Invalid date/time.',
            ephemeral: true,
          });
        }
      }
    }
  }
}
