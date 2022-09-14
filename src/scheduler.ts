import { BehaviorSubject } from 'rxjs';
import { ScheduledEvent } from './scheduledEvent';

export class Scheduler {
  private static instance: Scheduler;
  private static events = new Map<string, ScheduledEvent[]>();

  private static interval: NodeJS.Timeout;

  public static eventCompleted = new BehaviorSubject<ScheduledEvent>(null);
  public static eventReminder = new BehaviorSubject<ScheduledEvent>(null);

  private constructor() {}

  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  // starts the main loop of the scheduler
  // for each guild, check if any events are starting or ending
  public static start() {
    this.interval = setInterval(() => {
      this.events.forEach((events) => {
        events.forEach((event) => {
          if (event.isReady()) {
            event.execute();
          } else if (event.canRemind()) {
            // if the current date, minutes, and hours are the same as the event date
            if (event.isDaysBefore(0)) {
              this.eventReminder.next(event);
            } else if (event.isDaysBefore(1)) {
              // do something when the event is 1 day away
              this.eventReminder.next(event);
            } else if (event.isDaysBefore(2)) {
              // do something when the event is 2 days away
              this.eventReminder.next(event);
            }
          }
        });
      });
    }, 1000);
  }

  // stops the main loop of the scheduler
  // ! prevents events from being executed
  public static stop() {
    clearInterval(this.interval);
  }

  // schedules a new event and adds it to the list of events
  public static scheduleEvent(event: ScheduledEvent) {
    if (!this.events.has(event.guildId)) {
      this.events.set(event.guildId, []);
    }

    this.events.get(event.guildId).push(event);
  }

  // remove a given event from the list of events
  public static removeEvent(event: ScheduledEvent) {
    this.events = this.events.set(
      event.guildId,
      this.events.get(event.guildId).filter((e) => e !== event)
    );
  }

  // updates the status of a given event to completed
  public static completeEvent(event: ScheduledEvent) {
    this.eventCompleted.next(event);
  }

  // writes out the list of events to the console
  public static logEvents() {
    this.events.forEach((event) => console.info(`${event.toString()}`));
  }

  public static updateEvents(guildId: string, events: ScheduledEvent[]) {
    this.events.set(guildId, events);
  }

  public static setEvents(eventMap: Map<string, ScheduledEvent[]>) {
    this.events = eventMap;
  }

  public static updateEvent(event: ScheduledEvent) {
    const events = this.events.get(event.guildId);
    const index = events.findIndex((e) => e.id === event.id);
    events[index] = event;

    this.events.set(event.guildId, events);
  }

  // returns the list of events
  public static getEvents(guildId: string): ScheduledEvent[] {
    return this.events.get(guildId);
  }

  public static getEventById(guildId: string, id: number): ScheduledEvent {
    return this.events.get(guildId).find((event) => event.id === id);
  }
}
