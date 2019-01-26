# Twitter-Scrapper
Scrape and stream Twitter for content matching the search query provided. 
No api authentication required.


# Installing

[Download](https://nodejs.org/en/download/) and install Node.js on your computer then clone this project to a folder on your file system.

# Usage

Run the following from the project's folder.

```shell
npm start
```

All content will be saved to the "result" folder, each seperated by their Twitter Id.

# Bot search parameters
Set the robot's query parameters in server.ts
```ts
import * as Configs from './src/configs';
import * as FileSystem from 'fs-extra';

import { ScrapperBot } from './src/scrapper-bot';
import { TwitterUtils } from './src/data/twitter';
import { Utils } from './src/utils';

console.log('\x1Bc'); // clear the console

// clear content of destination file
FileSystem.remove(Configs.appConfigs.saveLocation, (error) => {
    if (error) {
        Utils.handleError(error);
    } else {
        FileSystem.mkdirSync(Configs.appConfigs.saveLocation);
    }
});

// create a bot that scrapes all content that mentions 'accordo.com'
// the bot will save images as well as data collected
// very easy to add extra functionalities such as saving videos 
let bot = new ScrapperBot();
bot.searchQuery = TwitterUtils.generateSearchQuery({
    // term: 'accordo.com',
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
// the bot is asynchorous so you can have multiple running at the same time
// scrapping different search parameters
bot.start();
```
## Resulting query
``` shell
http://twitter.com/i/search/timeline?f=tweets&q=url%3Aaccordo.com%20-%22accordo%20com%22&src=typd&include_entities=1&include_available_features=1&max_position=
```
## Learn more about how to build Twitter's basic query [here](https://developer.twitter.com/en/docs/tweets/rules-and-filtering/overview/standard-operators)

# Configuration
Change the bot's storage location and stream interval in ./src/configs.ts
```ts
/**
 *  Stores all bot configurations
 *  Secrets should not be included in file !!!
 */
export const appConfigs = {
    twitterSearchUrl: 'http://twitter.com/i/search/timeline',
    saveLocation: './result',
    stream_interval_ms: 10000 // stream every 10 seconds
};
```
