import { ChatInputCommandInteraction } from 'discord.js';
import logger from '../log';
import { ScheduledEvent } from '../scheduledEvent';
import { Scheduler } from '../scheduler';
import { Command } from './Command';

export class UpcomingCommand extends Command {
  constructor() {
    super('upcoming');
  }

  public async execute(interaction: ChatInputCommandInteraction) {
    const events = Scheduler.getEvents(interaction.guildId);

    if (!!events?.length) {
      const reply = events.map((event: ScheduledEvent) => event.toString()).join('\n\n');
      await interaction.reply({ content: `**Upcoming Events**\n\n${reply}`, ephemeral: true }).catch((err) => {
        logger.error(`Failed to send interaction reply for command: ${this.name}`, err);
      });
    } else {
      await interaction.reply({ content: 'No upcoming events!', ephemeral: true }).catch((err) => {
        logger.error(`Failed to send interaction reply for command: ${this.name}`, err);
      });
    }
  }
}
