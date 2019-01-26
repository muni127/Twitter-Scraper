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
