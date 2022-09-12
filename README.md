# Mr. Remindo
A discord bot used to create scheduled alerted events

## How to Use
You'll need to follow Discord's own steps to create a bot account, however, once that is done, the setup to use this bot is simple.

1. Run `npm install` to get the required dependencies
2. create a file `config.json` in the root folder with the following format:
  ``` JSON
  {
    "token": "{your secret token}",
    "clientId": "{your bots clientid}"
  }
  ```
  3. Run `npm run start`
  
  The program will automatically create an `events.db` SQLite3 database to store events. The bot can now be used.
  
## Tips

- To create an event, type `/schedule` in any channel*. Define a time with the format `yyyy-mm-dd`, time as `hh:mm` (24hr-clock), and set a repeating pattern.

**Example:** `/schedule 2022-10-14 13:30`

- You can view upcoming events by typing `/upcoming`. This will display the event id, name, and date. 

- You can remove events by typing `/cancel {id}` where the id corresponds to the id from `/upcoming`.

- Events without a repeating pattern will be deleted after the event has started. Events with a repeating pattern repeat based on their repeat choice.

- If you make a mistake, delete the event and create a new one**.

*The channel you create the event in will be the channel the bot will use to later alert.
** There is currently no way to edit an existing event.
