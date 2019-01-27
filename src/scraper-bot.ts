import * as BigInt from 'big-integer';
import * as Configs from './configs';
import * as FileSystem from 'fs-extra';
import * as HttpRequest from 'request';
import * as Querystring from 'querystring';

import { TweetSearchResult, TwitterUtils, Tweet } from './twitter';
import { Utils } from './utils';
import { JSDOM } from 'jsdom';
import { isNullOrUndefined } from 'util';

const dom = new JSDOM(`<!DOCTYPE html>`); // create a fake document environment to parse HTML result
const window = dom.window;
const document = window.document;

/**
 *  Twitter scraper bot
 */
export class ScraperBot {
    private static bot_names: string[] = [];

    private bot_name: string;
    private storage_label: string;
    private storage_location: string;
    private running: boolean;
    private streaming: boolean;
    private stream_max_position: string;
    private latest_tweet_id: string;

    blacklistedUrlPhrases: string[] = [];
    searchQuery: string = '';

    constructor(name: string) {
        if (!name.length) {
            throw new Error(`${name} is invalid, try 'Bot 1'\n`);
        }
        // Bot names should be unique
        if (ScraperBot.bot_names.indexOf(name) > -1) {
            throw new Error(`A bot with name "${name}" has already been created\n`);
        }
        this.bot_name = name;
        ScraperBot.bot_names.push(name);

        // Set up storage parameters to store data using current timestamp
        this.storage_label = `${name} ${new Date().toISOString().replace(new RegExp(':', 'g'), '-')}`;
        this.storage_location = `${Configs.appConfigs.saveLocation}/${this.storage_label}`;
        // Create destination folder
        FileSystem.mkdirSync(this.storage_location);

        this.running = false;
        this.streaming = false;
        this.latest_tweet_id = '';
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
    private scrape(max_position?: string, since_id?: string): Promise<void> {
        // construct scrape target url encoding all components
        let components = {
            'f': 'tweets', // this makes it so that the latest content comes first
            'q': this.searchQuery,
            'src': 'typd',
            'include_entities': 1,
            'include_available_features': 1
        };
        if (isNullOrUndefined(max_position)) {
            components['min_position'] = ''; // only add this parameter if max position has not been defined
        } else {
            components['max_position'] = max_position; // only add this parameter if it has been set
        }
        let url = `${Configs.appConfigs.twitterSearchUrl}?${Querystring.stringify(components)}`;

        return new Promise<void>((resolve, reject) => {
            console.log(`[0_0] ${this.bot_name}: Scanning ${url}\n`);
            // Retrieve scrape result and parse html to json
            HttpRequest.get(url, async (error, response, body) => {
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
                                await this.scrape(result.min_position, since_id);
                            } else if (!isNullOrUndefined(result.max_position) && result.max_position !== this.stream_max_position) {
                                console.log(`[^_^] ${this.bot_name}: Starting from the top\n`);
                                await this.scrape(result.max_position, since_id);
                            } else {
                                console.log(`[^_^] ${this.bot_name}: Scrape complete\n`);
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
    private processResults(scrape_results: TweetSearchResult, since_id: string): boolean {
         // save the results to the emulated document to parse as HTML
        document.body.innerHTML = scrape_results.items_html;
        for (let tweetBlock of Utils.htmlCollectionToArray<HTMLLIElement>(document.body.children)) {
            // Set the latest Id as the largest Id seen so that 
            // We can keep track of the next group to query for using since_id
            let id = tweetBlock.querySelector('[data-tweet-id]').getAttribute('data-tweet-id'),
                bigId = BigInt(id); // Need to convert the Id to big int since normal number will overflow
            if (bigId) {
                // End the scrape if since_id has been surpassed
                if (since_id && bigId <= BigInt(since_id)) {
                    return false;
                }
                // Set the latest tweet id so that the stream knows not to look for anything older
                if (!this.latest_tweet_id || bigId > BigInt(this.latest_tweet_id)) {
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
            // Save valid tweet block to file
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
        // Create destination folder for result
        FileSystem.mkdir(`${this.storage_location}/${name}`, (error) => {
            if (error) {
                Utils.handleError(error);
            } else {
                // Save original result
                FileSystem.writeFileSync(
                    `${this.storage_location}/${name}/${name}.html`,
                    result.outerHTML
                );
                // More data analysis friendly json result
                let tweet = TwitterUtils.parseResult(result);
                FileSystem.writeFileSync(
                    `${this.storage_location}/${name}/${name}.json`,
                    JSON.stringify(tweet, null, 4) // Pretty print json
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
        console.log(`[v_v] ${this.bot_name}: Sleeping for ${ms} ms\n`);
        return new Promise<void>(resolve => setTimeout(resolve, ms));
    }
}