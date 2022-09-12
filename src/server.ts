import { Scheduler } from './scheduler';
import { BaseInteraction, Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { token } from '../config.json';
import { ScheduledEvent, Repeat } from './scheduledEvent';
import logger from './log';
import { addEvent, deleteEvent, getEvents, initDb, updateEvent } from './database';

const client = new Client({
  intents: [GatewayIntentBits.MessageContent],
});

let database;

client.once('ready', async () => {
  logger.info('Bot starting up...');

  logger.info('Initializing database...');
  // init the database
  database = await initDb();

  // get all events from the database
  const events = await getEvents(database);
  Scheduler.setEvents(events);
  // init the scheduler
  logger.info('Starting scheduler...');
  // create a new scheduler that will run its main loop every second, checking for events
  Scheduler.start();
  // subscribe to completed/starting events
  Scheduler.eventCompleted.subscribe((event: ScheduledEvent) => {
    if (event) {
      logger.info(`Event Starting: ${event?.name}`, { channelId: event.channelId });

      // remove the event from the database
      if (event.repeat === Repeat.NONE) {
        console.log(event);
        deleteEvent(database, event.id);
      }

      // send message to channel
      client.channels
        .fetch(event.channelId)
        .then((channel: TextChannel) => {
          channel.send(`@everyone\n\nEvent Starting!!! **${event?.name}** `);

          // update the event in the database if it is repeating
          if (event.repeat !== Repeat.NONE) {
            updateEvent(database, event);
          }
        })
        .catch((err) => {
          logger.error('Failed to send event start message to channel', {
            error: err,
            channelId: event.channelId,
          });
        });
    }
  });

  // subscribe to event reminders
  Scheduler.eventReminder.subscribe((event: ScheduledEvent) => {
    if (event) {
      logger.info(`Event Reminder: ${event?.name}`, { channelId: event.channelId });
      // send message to channel
      client.channels
        .fetch(event.channelId)
        .then((channel: TextChannel) => {
          channel.send(`@everyone Reminder!\n\n **${event?.name}** - ${event.formatTime()}`);
        })
        .catch((err) => {
          logger.error('Failed to send event reminder message to channel', {
            error: err,
            channelId: event.channelId,
          });
        });
    }
  });
});

client.on('interactionCreate', async (interaction: BaseInteraction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'schedule') {
    const data = interaction.options;
    const event = new ScheduledEvent(
      data.getString('date'),
      data.getString('time'),
      data.getString('name'),
      data.getString('repeat') as Repeat,
      interaction.channelId
    );

    // the date must be valid and also be in the future
    if (event.isValidDate() && event.date > new Date()) {
      logger.info(`Scheduling event: ${event.name}`, {
        guild: interaction.guildId,
        channel: interaction.channelId,
        user: interaction.user.id,
      });
      // add event to databases
      const eventId = await addEvent(database, event);

      event.id = eventId.lastID;
      Scheduler.scheduleEvent(event);
      await interaction
        .reply(`New event: **${event.name}** scheduled for ${event.formatTime()}`)
        .catch((err) => {
          logger.error('Failed to send interaction reply', err);
        });
    } else {
      logger.debug(`Failed to schedule event: ${event.name}`);
      await interaction.reply('Failed to schedule event. Invalid date/time.');
    }
  }

  if (interaction.commandName === 'upcoming') {
    Scheduler.logEvents();
    const events = Scheduler.getEvents();

    if (!!events.length) {
      const reply = events.map((event) => event.toString()).join('\n\n');
      await interaction.reply(`**Upcoming Events**\n\n${reply}`).catch((err) => {
        logger.error('Failed to send interaction reply', err);
      });
    } else {
      await interaction.reply('No upcoming events!').catch((err) => {
        logger.error('Failed to send interaction reply', err);
      });
    }
  }

  if (interaction.commandName === 'cancel') {
    const data = interaction.options;
    const id = data.getNumber('id');
    const event = Scheduler.getEventById(id);

    if (event) {
      // remove event from db
      await deleteEvent(database, event);
      Scheduler.removeEvent(event);
      await interaction.reply(`Event **${event.name}** cancelled.`).catch((err) => {
        logger.error('Failed to send interaction reply', err);
      });
    } else {
      await interaction.reply(`Event with id **${id}** not found.`).catch((err) => {
        logger.error('Failed to send interaction reply', err);
      });
    }
  }
});

client.login(token);
