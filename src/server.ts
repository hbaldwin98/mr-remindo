import { Scheduler } from './scheduler';
import { BaseInteraction, Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { token } from '../config.json';
// import { token as tokenDev } from '../config-dev.json';
import { ScheduledEvent, Repeat } from './scheduledEvent';
import logger from './log';
import { deleteEvent, getEvents, initDb, updateEvent } from './database';
import { Command } from './commands/Command';
import { ScheduleCommand } from './commands/ScheduleCommand';
import { UpcomingCommand } from './commands/UpcomingCommand';
import { CancelCommand } from './commands/CancelCommand';
import { UpdateCommand } from './commands/UpdateCommand';
import dayjs from 'dayjs';

// const dev = process.argv[2] === 'dev';
let secret = token;

// if (dev) {
//   secret = tokenDev;
// }

const client = new Client({
  intents: [GatewayIntentBits.MessageContent],
});

export let DATABASE;

export const commandList = new Map<string, Command>();

client.once('ready', async () => {
  logger.info('Bot ready...');

  logger.info('Initializing database...');
  // init the database
  DATABASE = await initDb();
  // get all events from the database
  const events = await getEvents(DATABASE);
  const eventMap = new Map<string, ScheduledEvent[]>();
  events.forEach((event) => {
    if (!eventMap.has(event.guildId)) {
      eventMap.set(event.guildId, []);
    }
    eventMap.get(event.guildId).push(event);
  });

  Scheduler.setEvents(eventMap);
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
        deleteEvent(DATABASE, event.id);
      }

      // send message to channel
      client.channels
        .fetch(event.channelId)
        .then((channel: TextChannel) => {
          channel.send(`${event?.role || '@everyone'}\n\nEvent Starting!!! **${event?.name}** `);

          // update the event in the database if it is repeating
          if (event.repeat !== Repeat.NONE) {
            updateEvent(DATABASE, event);
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
          channel.send(`${event?.role || '@everyone'} Reminder!\n\n **${event?.name}** - ${event.formatTime()}`);
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

  const command = commandList.get(interaction.commandName);
  logger.info(`Received Command: ${interaction.commandName}`, {
    channelId: interaction.channelId,
    userId: interaction.user.id,
    guildId: interaction.guildId,
  });
  if (command) {
    command.execute(interaction);
  }
});

client.login(secret);

// register commands
commandList.set('schedule', new ScheduleCommand());
commandList.set('upcoming', new UpcomingCommand());
commandList.set('cancel', new CancelCommand());
commandList.set('update', new UpdateCommand());
