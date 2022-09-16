import { ChatInputCommandInteraction } from 'discord.js';
import { deleteEvent } from '../database';
import logger from '../log';
import { Scheduler } from '../scheduler';
import { DATABASE } from '../server';
import { Command } from './Command';

export class CancelCommand extends Command {
  constructor() {
    super('cancel');
  }

  public async execute(interaction: ChatInputCommandInteraction) {
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
      // remove event from db
      const result = await deleteEvent(DATABASE, event.id);

      // if success, remove event from scheduler
      if (result.changes) {
        Scheduler.removeEvent(event);
        await interaction.reply(`Event **${event.name}** has been cancelled.`).catch((err) => {
          logger.error(`Failed to send interaction reply for command: ${this.name}`, err);
        });
      } else {
        await interaction.reply({ content: `Event with id **${id}** not found.`, ephemeral: true }).catch((err) => {
          logger.error(`Failed to send interaction reply for command: ${this.name}`, err);
        });
      }
    }
  }
}
