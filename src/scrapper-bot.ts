import * as FileSystem from 'fs-extra';
import * as HttpRequest from 'request';
import * as Querystring from 'querystring';
import * as Configs from './configs';

import { TweetSearchResult, TwitterUtils, Tweet } from './twitter';
import { Utils } from './utils';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!DOCTYPE html>`); // create a fake document environment to parse HTML result
const window = dom.window;
const document = window.document;

/**
 *  Twitter scrapper bot
 */
export class ScrapperBot {
    private static bot_names: string[] = [];

    private bot_name: string;
    private storage_label: string;
    private storage_location: string;
    private running: boolean;
    private streaming: boolean;
    private latest_tweet_id: number;

    blacklistedUrlPhrases: string[] = [];
    searchQuery: string = '';

    constructor(name: string) {
        if (!name.length) {
            throw new Error(`${name} is invalid, try 'Bot 1'\n`);
        }
        // Bot names should be unique
        if (ScrapperBot.bot_names.indexOf(name) > -1) {
            throw new Error(`A bot with name "${name}" has already been created\n`);
        }
        this.bot_name = name;
        ScrapperBot.bot_names.push(name);

        // Set up storage parameters to store data using current timestamp
        this.storage_label = `${name} ${new Date().toLocaleString().replace(new RegExp(':', 'g'), '-')}`;
        this.storage_location = `${Configs.appConfigs.saveLocation}/${this.storage_label}`;
        // Create destination folder
        FileSystem.mkdirSync(this.storage_location);

        this.running = false;
        this.streaming = false;
        this.latest_tweet_id = 0;
    }

    /**
     *  Begins the scrape and stream processes
     */
    async start() {
        if (this.running) {
            console.log(`${this.bot_name} is already running`);
            return;
        }
        this.running = true;
        console.log(`[v_v] ${this.bot_name}: initialising\n`);
        await this.scrape();
        await this.stream();
    }

    /**
     * Finds all result on twitter with the query specified going back in time.
     * @param max_position the max position of where the scrape shold start from.
     * @param since_id the minimum Id of the Tweet the scrape can go back to.
     */
    private scrape(max_position?: string, since_id?: number): Promise<void> {
        // construct scrape target url encoding all components
        let components = Querystring.stringify({
            'f': 'tweets', // this makes it so that the latest content comes first
            'q': this.searchQuery,
            'src': 'typd',
            'include_entities': 1,
            'include_available_features': 1,
            'max_position': max_position
        });
        let url = `${Configs.appConfigs.twitterSearchUrl}?${components}`;

        return new Promise<void>((resolve, reject) => {
            console.log(`[0_0] ${this.bot_name}: Scanning ${url}`);
            // Retrieve scrape result and parse html to json
            HttpRequest.get(url, (error, response, body) => {
                if (error) {
                    Utils.handleError(error);
                    reject(error);
                }
                if (body) {
                    let result: TweetSearchResult = JSON.parse(body);
                    if (result) {
                        if (this.processResults(result, since_id)) {
                            console.log(`[^_^] ${this.bot_name}: Results processed`);
                            console.log(`[^_^] ${this.bot_name}: Has more items: ${result.has_more_items}\n`);
                            // if there is still more results continue
                            if (result.has_more_items) {
                                this.scrape(result.min_position, since_id);
                            } else {
                                console.log(`[^_^] ${this.bot_name}: Scrape complete`);
                            }
                        }
                    } else {
                        Utils.handleError('Could not parse data retrieved');
                    }
                } else {
                    Utils.handleError('Could not receive any data from twitter');
                }
                resolve();
            });
        });
    }

    /**
     * Check Twitter for any updates. Sleeps when scan is completed.
     * This stream is async because we don't want the bot to spam Twitter.
     */
    private async stream() {
        if (this.streaming) {
            console.log(`${this.bot_name} is already streaming`);
            return;
        }
        console.log(`[D_D] ${this.bot_name}: Stream started\n`);
        this.streaming = true;
        while (this.streaming) {
            await this.scrape(null, this.latest_tweet_id);
            console.log(`[^_^] ${this.bot_name}: Latest Id: ${this.latest_tweet_id}`);

            // we may not want to crawl on Twitter too frequently
            await this.sleep(Configs.appConfigs.stream_interval_ms);
        }
    }

    /**
     * Filter and process only important information about the results.
     * @param scrape_results results returned from Twitter as a list of Tweets in HTML
     * @param since_id the oldest Id we should process.
     * @returns {success} indicates whether scrape should continue. False if since_id is surpassed.
     */
    private processResults(scrape_results: TweetSearchResult, since_id: number): boolean {
         // save the results to the emulated document to parse as HTML
        document.body.innerHTML = scrape_results.items_html;
        for (let tweetBlock of Utils.htmlCollectionToArray<HTMLLIElement>(document.body.children)) {
            // Set the latest Id as the largest Id seen so that 
            // we can keep track of the next group to query for using since_id
            let id = +tweetBlock.getAttribute('data-item-id');
            if (id) {
                // end the scrape if since_id has been surpassed
                if (id <= since_id) {
                    return false;
                }
                // set the latest tweet id so that the stream knows not to look for anything older
                if (id > this.latest_tweet_id) {
                    this.latest_tweet_id = id;
                }
            } else {
                return false;
            }
            // Filter out blacklisted url phrases from the expanded urls
            let validResult = true;
            for (let phrase of this.blacklistedUrlPhrases) {
                if (tweetBlock.querySelector(`[data-expanded-url*="${phrase}"]`)) {
                    console.warn(`[X_X] ${this.bot_name}: Item blacklisted Id: ${id}\n L->  Illegal phrase matched: "${phrase}"\n`);
                    validResult = false;
                    break;
                }
            }
            // save valid tweet block to file
            if (validResult) {
                this.saveResult(`${id}`, tweetBlock);
                console.log(`[^_^] ${this.bot_name}: Saved item: ${id}\n`);
            }
        }
        return true;
    }

    /**
     * Parse and saves the result to the destination folder.
     * @param name name of result to be used
     * @param result
     */
    private saveResult(name: string, result: HTMLLIElement): void {
        // create destination folder for result
        FileSystem.mkdir(`${this.storage_location}/${name}`, (error) => {
            if (error) {
                Utils.handleError(error);
            } else {
                // save original result
                FileSystem.writeFileSync(
                    `${this.storage_location}/${name}/${name}.html`,
                    result.outerHTML
                );
                // more data analysis friendly json result
                let tweet = TwitterUtils.parseResult(result);
                FileSystem.writeFileSync(
                    `${this.storage_location}/${name}/${name}.json`,
                    JSON.stringify(tweet, null, 4) // pretty print json
                );
                this.getTweetImages(name, tweet);
                console.log(`[o_O] ${this.bot_name}: Collecting images for item: ${name}\n`);
            }
        });
    }

    /**
     * Downloads the tweet's media images and saves it.
     * @param tweet tweet containing image urls
     */
    private getTweetImages(name: string, tweet: Tweet): void {
        // download user's avatar image
        this.downloadImage(name, tweet.user.avatar);
        // download the rest of the images
        for (let imageUrl of tweet.images) {
            this.downloadImage(name, imageUrl);
        }
    }

    /**
     * Retrieves image from URL
     * @param name name of result to be used
     * @param imageUrl url of image to be downloaded
     */
    private downloadImage(name: string, imageUrl: string): void {
        HttpRequest.get({ url: imageUrl, encoding: 'binary' }, (error, response, body) => {
            if (error) {
                Utils.handleError(error);
            }
            if (body) {
                FileSystem.writeFileSync(
                    `${this.storage_location}/${name}/${Utils.getFileName(imageUrl)}`,
                    body,
                    'binary'
                );
            } else {
                Utils.handleError(`Could not receive any image from ${imageUrl}`);
            }
        });
    }

    /**
     * Pauses the bot for sometime
     * @param ms amount of time to sleep in milliseconds
     * @returns {promise} promise which will end when the bot can start again
     */
    private sleep(ms: number): Promise<void> {
        console.log(`[v_v] ${this.bot_name}: Sleeping for ${ms} ms`);
        return new Promise<void>(resolve => setTimeout(resolve, ms));
    }
}