"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const twitter_1 = require("./src/data/twitter");
const ScrapperBot_1 = require("./src/ScrapperBot");
console.log('\x1Bc'); // clear the console
var bot = new ScrapperBot_1.ScrapperBot(); // create a twit bot
bot.searchQuery = twitter_1.TwitterUtils.generateSearchQuery({
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
