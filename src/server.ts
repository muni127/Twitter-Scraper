import * as Configs from './configs';
import * as FileSystem from 'fs-extra';

import { ScraperBot } from './scraper-bot';
import { TwitterUtils } from './twitter';

console.log('\x1Bc'); // clear the console

// create result storage folder if not already exists
if (!FileSystem.existsSync(Configs.appConfigs.saveLocation)) {
    FileSystem.mkdirSync(Configs.appConfigs.saveLocation);
}

// create a bot with a name 'Accordo Bot' that scrapes all content that mentions 'accordo.com'
// the bot will save images as well as data collected
// very easy to add extra functionalities such as saving videos 
let bot = new ScraperBot('Accordo Bot');
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

// the bots are asynchorous so you can have multiple running at the same time
// scraping different search parameters.
// Bot names need to be unique. This helps sorting results.
let bot2 = new ScraperBot('Accordo Group Bot');
bot2.searchQuery = TwitterUtils.generateSearchQuery({
    operators: [
        {
            operator: '@',
            value: 'accordogroup'
        }
    ]
});
bot2.start();