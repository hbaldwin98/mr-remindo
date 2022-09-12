import { Scheduler } from './scheduler';
export class ScheduledEvent {
  public name: string;
  public date: Date;
  public repeat?: Repeat;
  public channelId: string;
  public id: number;

  public lastReminder: Date;

  constructor(date: string, time: string, name: string, repeat: Repeat, channelId: string) {
    const newDate = this.convertStringToDate(date, time);

    this.date = newDate;
    this.name = name;
    this.repeat = repeat ?? Repeat.NONE;
    this.channelId = channelId;
  }

  /**
   * Checks if the date given is valid
   * @returns A boolean indicating if the date is valid
   */
  isValidDate() {
    // check if the date is a valid date
    return !isNaN(this.date.getTime());
  }

  /**
   * Checks if the event is ready
   * @returns boolean indicating if the event is ready
   */
  isReady() {
    // add a 20 second buffer to the event to prevent it from being missed
    // and also to prevent it from being executed twice if the bot needs to restart
    return this.isValidDate() && this.date.getTime() + 20000 >= Date.now()
      ? this.date.getTime() <= Date.now()
      : null;
  }

  /**
   * Checks whether the given days between now and the event date are the same
   * and whether the hour is 8AM (hardcoded)
   * @param days The number of days to add to the date
   * @returns
   */
  isDaysBefore(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);

    return this.date.getDate() === date.getDate() && this.date.getHours() === 8;
  }

  /**
   * Checks if the event has been used to remind the user in the last 24 hours, if not, it will set the last reminder to now
   * and return true
   * @returns A boolean indicating whether the event is ready to be reminded
   */
  canRemind() {
    if (!this.lastReminder) {
      this.lastReminder = new Date();
      return true;
    }

    // if the last reminder was more than 24 hours ago
    if (this.lastReminder.getTime() + 86400000 <= Date.now()) {
      this.lastReminder = new Date();
      return true;
    }

    return false;
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
        this.date.setDate(this.date.getDate() + 1);
        break;
      case Repeat.WEEKLY:
        Scheduler.completeEvent(this);
        this.date.setDate(this.date.getDate() + 7);
        break;
      case Repeat.MONTHLY:
        Scheduler.completeEvent(this);
        this.date.setMonth(this.date.getMonth() + 1);
        break;
    }
  }

  /**
   * Converts given date and time strings to a Date object
   * @param dateString the date in the format yyyy-mm-dd
   * @param time the time in the format hh:mm
   * @returns Date object
   */
  convertStringToDate(dateString: string, time: string): Date {
    const date = new Date();
    const fullDate = dateString.split('-');

    // set the date
    date.setFullYear(parseInt(fullDate[0]));
    date.setMonth(parseInt(fullDate[1]) - 1);
    date.setDate(parseInt(fullDate[2]));
    date.setHours(parseInt(time.split(':')[0]));
    date.setMinutes(parseInt(time.split(':')[1]));
    date.setSeconds(0);

    return date;
  }

  changeName(name: string) {
    this.name = name;
  }

  changeDate(date: Date) {
    this.date = date;
  }

  /**
   * Returns the event as a string
   * @returns the names of the event and the date
   */
  toString() {
    return `${this.id} - **Name**: ${this.name}\n**Date**: ${this.date}`;
  }

  /**
   * Formats the day and time as astring
   * @returns The date formatted as {dayoftheweek} at {time}
   */
  formatTime() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hours = this.date.getHours() % 12;
    const minutes = this.date.getMinutes();
    const ampm = this.date.getHours() >= 12 ? 'pm' : 'am';
    // if the day is today, return today
    const day =
      days[this.date.getDay()] === days[new Date().getDay()] ? 'today' : days[this.date.getDay()];
    return `${day} at ${hours}:${minutes}${ampm}`;
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
