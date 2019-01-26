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
