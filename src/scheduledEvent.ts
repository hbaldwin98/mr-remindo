import dayjs from 'dayjs';
import { Scheduler } from './scheduler';
export class ScheduledEvent {
  public name: string;
  public date: dayjs.Dayjs;
  public repeat?: Repeat;
  public channelId: string;
  public guildId: string;
  public id: number;
  public lastReminder: dayjs.Dayjs;
  public role: string;

  constructor(date: dayjs.Dayjs, name: string, repeat: Repeat, channelId: string, guildId: string, role: string) {
    this.date = date;
    this.name = name;
    this.repeat = repeat ?? Repeat.NONE;
    this.channelId = channelId;
    this.guildId = guildId;
    this.role = role;
  }

  /**
   * Checks if the event is ready
   * @returns boolean indicating if the event is ready
   */
  isReady() {
    // add a 20 second buffer to the event to prevent it from being missed
    // and also to prevent it from being executed twice if the bot needs to restart
    return this.date.isValid() && this.date.unix() + 60 >= dayjs().unix() ? this.date.unix() <= dayjs().unix() : null;
  }

  /**
   * Checks whether the given days between now and the event date are the same
   * and whether the hour is 8AM (hardcoded)
   * @param days The number of days to add to the date
   * @returns
   */
  isDaysBefore(days: number) {
    let date = dayjs();
    date = date.add(days, 'day');

    return this.date.date() <= date.date() && date.hour() >= 8;
  }

  /**
   * Checks if the event has been used to remind the user in the last 24 hours, if not, it will set the last reminder to now
   * and return true
   * @returns A boolean indicating whether the event is ready to be reminded
   */
  canRemind() {
    if (!this.lastReminder) {
      return true;
    }

    // if the last reminder was yesterday
    if (this.lastReminder.date() + 1 <= dayjs().date()) {
      return true;
    }

    return false;
  }

  updateLastReminder() {
    this.lastReminder = dayjs();
  }

  /**
   * Executes the event and updates its status based on whether it repeats
   */
  execute() {
    // do something when the event is ready
    switch (this.repeat) {
      case Repeat.NONE:
        Scheduler.completeEvent(this);
        Scheduler.removeEvent(this);
        break;
      case Repeat.DAILY:
        Scheduler.completeEvent(this);
        this.date.add(1, 'day');
        break;
      case Repeat.WEEKLY:
        Scheduler.completeEvent(this);
        this.date.add(7, 'day');
        break;
      case Repeat.MONTHLY:
        Scheduler.completeEvent(this);
        this.date.add(1, 'month');
        break;
    }
  }

  changeName(name: string) {
    this.name = name;
  }

  // changeDate(date: Date) {
  //   this.date = date;
  // }

  /**
   * Returns the event as a string
   * @returns the names of the event and the date
   */
  toString() {
    return `**Id:** ${this.id}\n**Name**: ${this.name}\n\n**Date**: ${this.formatTime()}\n**Repeating**: ${
      this.repeat
    }`;
  }

  /**
   * Formats the day and time as astring
   * @returns The date formatted as {dayoftheweek} at {time}
   */
  formatTime() {
    const month = this.date.month();
    const day = this.getDateOrdinal(this.date.date());
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const hours = this.date.hour() % 12;
    const minutes = this.date.minute();
    const ampm = this.date.hour() >= 12 ? 'pm' : 'am';
    const dayIsToday =
      days[this.date.date()] === days[new Date().getDay()] && this.date.date() === new Date().getDate();
    // if the day is Today, return today
    const dayOfWeek = dayIsToday ? 'Today' : days[this.date.day()];
    return `${dayOfWeek}, ${months[month]} ${day}, at:
          \t${hours}:${minutes < 10 ? '0' + minutes : minutes}${ampm} (PT)
          \t${hours + 1}:${minutes < 10 ? '0' + minutes : minutes}${ampm} (MT)
          \t${hours + 2}:${minutes < 10 ? '0' + minutes : minutes}${ampm} (CT)
          \t${hours + 3}:${minutes < 10 ? '0' + minutes : minutes}${ampm} (ET)\n`;
  }

  getDateOrdinal(day: number) {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const remainder = day % 100;
    return day + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]);
  }
}

export enum Repeat {
  NONE = 'None',
  ONCE = 'Once',
  HOURLY = 'Hourly',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
}
