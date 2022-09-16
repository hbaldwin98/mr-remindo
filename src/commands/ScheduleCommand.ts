import { ChatInputCommandInteraction } from 'discord.js';
import { addEvent } from '../database';
import logger from '../log';
import { Repeat, ScheduledEvent } from '../scheduledEvent';
import { Scheduler } from '../scheduler';
import { DATABASE } from '../server';
import { Command } from './Command';

export class ScheduleCommand extends Command {
  constructor() {
    super('schedule');
  }

  public async execute(interaction: ChatInputCommandInteraction) {
    const data = interaction.options;
    const event = new ScheduledEvent(
      data.getString('date'),
      data.getString('time'),
      data.getString('name'),
      data.getString('repeat') as Repeat,
      interaction.channelId,
      interaction.guildId,
      data.get('role')?.role?.name
    );

    const isValid = event.isValidDate();
    // the date must be valid and also be in the future
    if (isValid) {
      logger.info(`Scheduling event: ${event.name}`, {
        guild: interaction.guildId,
        channel: interaction.channelId,
        user: interaction.user.id,
      });
      // add event to databases
      const result = await addEvent(DATABASE, event);

      // if succesful, add event to scheduler
      if (result) {
        event.id = result.lastID;
        Scheduler.scheduleEvent(event);
        await interaction
          .reply(`${event?.role || '@everyone'}\nNew event: **${event.name}** scheduled for ${event.formatTime()}`)
          .catch((err) => {
            logger.error(`Failed to send interaction reply for command: ${this.name}`, err);
          });
      } else {
        logger.debug(`Failed to schedule event: ${event.name}`);
        await interaction.reply({
          content: 'Failed to schedule event. Please try again.',
          ephemeral: true,
        });
      }
    } else {
      logger.debug(`Failed to schedule event: ${event.name}`);
      await interaction.reply({
        content: 'Failed to schedule event. Invalid date/time.',
        ephemeral: true,
      });
    }
  }
}
