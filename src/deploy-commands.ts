import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { clientId, token } from '../config.json';
import { Repeat } from './scheduledEvent';

const commands = [
  new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Schedule an event for a given day')
    .addStringOption((option) =>
      option.setName('name').setDescription('Name of the event').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('date')
        .setDescription('Date of the event. Format as (year-month-day)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('time')
        .setDescription('Time of the event (military time e.g. 13:45)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('repeat').setDescription('Repeat of the event').setRequired(false).addChoices(
        {
          name: Repeat.NONE,
          value: Repeat.NONE,
        },
        {
          name: Repeat.ONCE,
          value: Repeat.ONCE,
        },
        {
          name: Repeat.HOURLY,
          value: Repeat.HOURLY,
        },
        {
          name: Repeat.DAILY,
          value: Repeat.DAILY,
        },
        {
          name: Repeat.WEEKLY,
          value: Repeat.WEEKLY,
        },
        {
          name: Repeat.MONTHLY,
          value: Repeat.MONTHLY,
        }
      )
    ),
  new SlashCommandBuilder().setName('upcoming').setDescription('List upcoming events'),
  new SlashCommandBuilder()
    .setName('cancel')
    .setDescription('Cancel an event')
    .addNumberOption((option) =>
      option.setName('id').setDescription('ID of the event to cancel').setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

// for global commands
rest
  .put(Routes.applicationCommands(clientId), { body: [] })
  .then(() => console.log('Successfully deleted all application commands.'))
  .catch(console.error);

rest
  .put(Routes.applicationCommands(clientId), { body: commands })
  .then(() => console.log('Successfully registered application commands.'))
  .catch(console.error);
