"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Configs = require("./configs");
var FileSystem = require("fs-extra");
var scraper_bot_1 = require("./scraper-bot");
var twitter_1 = require("./twitter");
console.log('\x1Bc'); // clear the console
// create result storage folder if not already exists
if (!FileSystem.existsSync(Configs.appConfigs.saveLocation)) {
    FileSystem.mkdirSync(Configs.appConfigs.saveLocation);
}
// create a bot with a name 'Accordo Bot' that scrapes all content that mentions 'accordo.com'
// the bot will save images as well as data collected
// very easy to add extra functionalities such as saving videos 
var bot = new scraper_bot_1.ScraperBot('Accordo Bot');
bot.query = twitter_1.TwitterUtils.generateSearchQuery({
    term: 'accordo.com OR',
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
var bot2 = new scraper_bot_1.ScraperBot('Accordo Group Bot');
bot2.query = twitter_1.TwitterUtils.generateSearchQuery({
    operators: [
        {
            operator: '@',
            value: 'accordogroup'
        }
    ]
});
bot2.start();
