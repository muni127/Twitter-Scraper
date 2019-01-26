# Twitter-Scrapper
Scrape and stream Twitter for content matching the search query provided. 
No api authentication required.


# Installing

Install Node.js on your computer then clone this project to a folder on your file system.

# Usage

Run the following from the project's folder.

```shell
npm start
```

All content will be saved to the "result" folder, each seperated by their Twitter Id.

# Set the robot's query parameters in server.ts

```ts
import { TwitterUtils } from './src/data/twitter';
import { ScrapperBot } from './src/scrapper-bot';

console.log('\x1Bc'); // clear the console
let bot = new ScrapperBot(); // create a twit bot

bot.searchQuery = TwitterUtils.generateSearchQuery({
    term: 'accordo.com',
    operators: [
        {
            operator: 'url:',
            value: 'accordo.com'
        },
        {
            operator: '-',
            value: '"accordo com"'
        },
    ]
});
// eliminate incorrect urls matched
bot.blacklistedUrlPhrases = ['accordo-com', 'accordo.com.'];
bot.start();
```
## Resulting query
``` shell
http://twitter.com/i/search/timeline?f=tweets&q=accordo.com%20url%3Aaccordo.com%20-%22accordo%20com%22&src=typd&include_entities=1&include_available_features=1&max_position=
```
## Learn more about how to build Twitter's basic query [here](https://developer.twitter.com/en/docs/tweets/rules-and-filtering/overview/standard-operators)
