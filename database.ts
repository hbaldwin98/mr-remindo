import sqlite3 from 'sqlite3';
import logger from './log';
import { ScheduledEvent, Repeat } from './scheduledevent';
const { open } = require('sqlite');

const initDb = async () => {
  try {
    const db = await createDbConnection('./events.db');
    logger.info('Connected to database');
    return db;
  } catch (err) {
    logger.warn('Failed to connect to database', err);
    process.exit(1);
  }
};

const createDbConnection = async (filename: string) => {
  try {
    const db = open({
      filename,
      driver: sqlite3.Database,
    });

    await createTables(await db);

    return db;
  } catch {
    logger.warn('Failed to create database connection');
    process.exit(1);
  }
};

// const createDatabase = async () => {
//   logger.info('Creating new database');
//   const newdb = new sqlite3.Database('events.db', (err) => {
//     if (err) {
//       logger.warn('Failed to create database', err);
//       // close the application
//       process.exit(1);
//     }
//   });

//   await createTables(newdb);
//   return newdb;
// };

const createTables = async (newdb) => {
  // check if the events table already exists
  const tables = await newdb.all('SELECT name FROM sqlite_master WHERE type="table"');
  if (tables.length === 0) {
    logger.info('Creating tables');
    await newdb.exec(
      `
      CREATE TABLE events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          date TEXT NOT NULL,
          repeat TEXT DEFAULT 'none',
          channelId TEXT NOT NULL,
          lastReminder TEXT
      )
      `
    ),
      () => {
        logger.info('Created events table');
      };
  }
};

const getEvents = async (db) => {
  logger.info('Getting events from database');
  const events = await db.all('SELECT * FROM events');
  // map the events to ScheduledEvent objects
  return events.map((event) => {
    const { id, name, date, repeat, channelId } = event;
    let scheduledEvent = new ScheduledEvent('', '', '', Repeat.NONE, '');
    scheduledEvent.id = id;
    scheduledEvent.name = name;
    scheduledEvent.date = new Date(parseInt(date));
    scheduledEvent.repeat = repeat;
    scheduledEvent.channelId = channelId;
    scheduledEvent.lastReminder = event.lastReminder
      ? new Date(parseInt(event.lastReminder))
      : null;

    return scheduledEvent;
  });
};

const updateEvent = async (db, event) => {
  logger.info('Updating event in database', { event });
  await db.run(
    'UPDATE events SET name = ?, date = ?, repeat = ?, channelId = ?, lastReminder = ? WHERE id = ?',
    [event.name, event.date, event.repeat, event.channelId, event.id, event.lastReminder]
  );
};

const addEvent = async (db, event) => {
  const { name, date, repeat, channelId, lastReminder } = event;
  logger.info('Adding event to database', { name, date, repeat, channelId, lastReminder });
  const result = await db.run(
    'INSERT INTO events (name, date, repeat, channelId) VALUES (?, ?, ?, ?)',
    name,
    date,
    repeat,
    channelId,
    lastReminder
  );

  logger.info('Added event to database', { id: result.lastID });

  return result;
};

const deleteEvent = async (db, id) => {
  logger.info('Deleting event from database', { id });
  const result = await db.run('DELETE FROM events WHERE id = ?', id);
  return result;
};

export { initDb, getEvents, addEvent, deleteEvent, updateEvent };
