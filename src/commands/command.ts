import { ChatInputCommandInteraction } from 'discord.js';

export abstract class Command {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  public abstract execute(interaction: ChatInputCommandInteraction): void;
}
