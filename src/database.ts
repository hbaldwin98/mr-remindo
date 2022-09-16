import dayjs from 'dayjs';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import logger from './log';
import { ScheduledEvent } from './scheduledEvent';
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
          guildId TEXT NOT NULL,
          lastReminder TEXT,
          role TEXT
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
    const { id, name, date, repeat, channelId, guildId, role } = event;
    let scheduledEvent = new ScheduledEvent(dayjs(date), name, repeat, channelId, guildId, role);
    scheduledEvent.id = id;
    scheduledEvent.lastReminder = event.lastReminder ? dayjs(event.lastReminder) : null;

    return scheduledEvent;
  });
};

const updateEvent = async (db: Database, event: ScheduledEvent) => {
  logger.info('Updating event in database', { event });
  try {
    const result = await db.run(
      'UPDATE events SET name = ?, date = ?, repeat = ?, channelId = ?, lastReminder = ?, guildId = ?, role = ? WHERE id = ?',
      [event.name, event.date, event.repeat, event.channelId, event.lastReminder, event.guildId, event.role, event.id]
    );

    return result;
  } catch (err) {
    logger.error('Failed to update event in database', { error: err });

    return err;
  }
};

const addEvent = async (db: Database, event: ScheduledEvent) => {
  const { name, date, repeat, channelId, lastReminder, guildId, role } = event;
  logger.info('Adding event to database', {
    name,
    date,
    repeat,
    channelId,
    lastReminder,
    guildId,
    role,
  });
  try {
    const result = await db.run(
      'INSERT INTO events (name, date, repeat, channelId, lastReminder, guildId, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      name,
      date,
      repeat,
      channelId,
      lastReminder,
      guildId,
      role
    );

    return result;
  } catch (err) {
    logger.warn('Failed to add event to database', err);

    return err;
  }
};

const deleteEvent = async (db: Database, id: number) => {
  logger.info('Deleting event from database', { id });
  try {
    const result = await db.run('DELETE FROM events WHERE id = ?', id);

    return result;
  } catch (err) {
    logger.warn('Failed to delete event', err);

    return err;
  }
};

export { initDb, getEvents, addEvent, deleteEvent, updateEvent };
