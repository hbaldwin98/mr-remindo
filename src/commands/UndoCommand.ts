import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { Command } from './Command';

// TODO create undo command
// will undo a previous edit, create, or delete
export class UndoCommand extends Command {
  constructor() {
    super('undo');
  }

  public execute(interaction: ChatInputCommandInteraction<CacheType>): void {
    throw new Error('Method not implemented.');
  }
}
