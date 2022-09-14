import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { addEvent, deleteEvent, updateEvent } from '../database';
import logger from '../log';
import { Repeat, ScheduledEvent } from '../scheduledEvent';
import { Scheduler } from '../scheduler';
import { DATABASE } from '../server';

export abstract class Command {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  public abstract execute(interaction: ChatInputCommandInteraction): void;
}

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

// TODO create update command
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

// TODO create undo command
// will undo a previous edit, create, or delete
export class UndoCommand extends Command {
  constructor() {
    super('undo');
  }

  public execute(interaction: ChatInputCommandInteraction<CacheType>): void {
    throw new Error('Method not implemented.');
  }
}
