import { BehaviorSubject } from 'rxjs';
import { ScheduledEvent } from './scheduledevent';

export class Scheduler {
  private static instance: Scheduler;
  private static events: ScheduledEvent[] = [];
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
  public static start() {
    this.interval = setInterval(() => {
      this.events.forEach((event) => {
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
    }, 1000);
  }

  // stops the main loop of the scheduler
  // ! prevents events from being executed
  public static stop() {
    clearInterval(this.interval);
  }

  // schedules a new event and adds it to the list of events
  public static scheduleEvent(event: ScheduledEvent) {
    this.events.push(event);
  }

  // remove a given event from the list of events
  public static removeEvent(event: ScheduledEvent) {
    this.events = this.events.filter((e) => e !== event);
  }

  // updates the status of a given event to completed
  public static completeEvent(event: ScheduledEvent) {
    this.eventCompleted.next(event);
  }

  // writes out the list of events to the console
  public static logEvents() {
    this.events.forEach((event) => console.info(`${event.toString()}`));
  }

  public static setEvents(events: ScheduledEvent[]) {
    this.events = events;
  }

  // returns the list of events
  public static getEvents(): ScheduledEvent[] {
    return this.events;
  }

  public static getEventById(id: number): ScheduledEvent {
    return this.events.find((event) => event.id === id);
  }
}
