import * as BigInt from 'big-integer';
import * as Configs from './configs';
import * as FileSystem from 'fs-extra';
import * as HttpRequest from 'request';
import * as Querystring from 'querystring';

import { TweetSearchResult, TwitterUtils, Tweet, SearchQueryParams, SearchComponents } from './twitter';
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
    private static botNames: string[] = [];

    private botName: string;
    private storage_label: string;
    private storageLocation: string;
    private latest_max_position: string;
    private urlComponents: SearchComponents;

    private running: boolean = false;
    private streaming: boolean = false;

    query: string;
    blacklistedUrlPhrases: string[] = [];

    /**
     * @param name name of the bot
     */
    constructor(name: string) {
        if (!name.length) {
            throw new Error(`${name} is invalid, try 'Bot 1'\n`);
        }
        // Bot names should be unique
        if (ScraperBot.botNames.indexOf(name) > -1) {
            throw new Error(`A bot with name "${name}" has already been created\n`);
        }
        this.botName = name;
        ScraperBot.botNames.push(name);

        // Set up storage parameters to store data using current timestamp
        this.storage_label = `${name} ${new Date().toISOString().replace(new RegExp(':', 'g'), '-')}`;
        this.storageLocation = `${Configs.appConfigs.saveLocation}/${this.storage_label}`;
        // Create destination folder
        FileSystem.mkdirSync(this.storageLocation);
    }

    /**
     *  Begins the scrape and stream processes
     */
    async start(): Promise<void> {
        if (this.running) {
            console.log(`${this.botName} is already running`);
            return;
        }
        this.running = true;
        console.log(`[v_v] ${this.botName}: initialising\n`);
        this.urlComponents = {
            f: 'tweets', // This makes it so that the latest content comes first
            q: this.query,
            src: 'typd',
            include_entities: true,
            include_available_features: true
        };
        await this.scrape();
        await this.stream();
    }

    /**
     * Check Twitter for any updates. Sleeps when scan is completed.
     * This stream is async because we don't want the bot to spam Twitter.
     */
    private async stream(): Promise<void> {
        if (this.streaming) {
            console.log(`${this.botName} is already streaming`);
            return;
        }
        console.log(`[D_D] ${this.botName}: Stream started\n`);
        this.streaming = true;
        while (this.streaming) {
            await this.scrape(this.latest_max_position);
            // we may not want to crawl on Twitter too frequently
            await this.sleep(Configs.appConfigs.stream_interval_ms);
        }
    }

    /**
     * Begins the traverse process configuring the traverse's min and max positions
     * @param min_position the min position of where the scrape should stop.
     */
    private async scrape(min_position?: string): Promise<void> {
        // Construct scrape target url encoding all components
        let targetUrlComponents = Object.assign(new SearchComponents(), this.urlComponents);
        // Set the min postion when streaming upwards
        if (min_position) {
            targetUrlComponents.min_position = min_position;
        } else {
            targetUrlComponents.max_position = this.latest_max_position;
        }
        let url = `${Configs.appConfigs.twitterSearchUrl}?${Querystring.stringify(targetUrlComponents)}`;
        // Set the latest max position when the scrape started
        await this.traverseTimeLine(url);
    }

    /**
     * Finds all result on twitter with the query specified going down the timeline.
     * @param url target url of the traverse page
     */
    private async traverseTimeLine(url: string, last_max_position?: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            console.log(`[0_0] ${this.botName}: Scanning ${url}\n`);
            // Retrieve scrape result and parse html to json
            HttpRequest.get(url, async (error, response, body) => {
                if (error) {
                    Utils.handleError(error, reject);
                }
                if (body) {
                    let result: TweetSearchResult = JSON.parse(body);
                    if (result) {
                        // Process the results
                        this.processResults(result)
                        // Set the next target page and continue the traverse
                        let newTargetUrlComponents = Object.assign(new SearchComponents(), this.urlComponents);

                        if (result.min_position) { // If we are traversing downwards, use the min_position as max for the next traverse
                            newTargetUrlComponents.max_position = result.min_position.replace('+', '%2B');
                        }

                        if (!this.latest_max_position) {
                            // If the stream has hit it's end we have to set the latest max_position and use it 
                            // as the min_position in the next query
                            this.latest_max_position = newTargetUrlComponents.max_position ?
                                newTargetUrlComponents.max_position :
                                result.max_position.replace('+', '%2B');
                        }

                        if (last_max_position === newTargetUrlComponents.max_position) {
                            // No difference in the last max positions and the current so stop the traverse
                            console.log(`[^_^] ${this.botName}: Scrape complete\n`);
                            resolve();
                        } else {
                            // Execute the next traverse going down the timeline
                            await this.traverseTimeLine(`${Configs.appConfigs.twitterSearchUrl}?${Querystring.stringify(newTargetUrlComponents)}`, newTargetUrlComponents.max_position);
                        }
                    } else {
                        Utils.handleError('Could not parse data retrieved', reject);
                    }
                } else {
                    Utils.handleError('Could not receive any data from twitter', reject);
                }
                resolve();
            });
        });
    }

    /**
     * Filter and process only important information about the results.
     * @param scrape_results results returned from Twitter as a list of Tweets in HTML
     * @param since_id the oldest Id we should process.
     * @returns {success} indicates whether scrape should continue. False if since_id is surpassed.
     */
    private processResults(scrape_results: TweetSearchResult): void {
         // save the results to the emulated document to parse as HTML
        document.body.innerHTML = scrape_results.items_html;
        let tweets = Utils.htmlCollectionToArray<HTMLLIElement>(document.body.children);
        for (let tweetBlock of tweets) {
            let id = tweetBlock.querySelector('[data-tweet-id]').getAttribute('data-tweet-id');
            if (FileSystem.existsSync(`${this.storageLocation}/${id}`)) {
                // The Tweet has already been saved so we do not need to save anything, Twitter does not allow users to edit their Tweet
                continue;
            }
            // Filter out blacklisted url phrases from the expanded urls
            let validTweet = true;
            for (let phrase of this.blacklistedUrlPhrases) {
                if (tweetBlock.querySelector(`[data-expanded-url*="${phrase}"]`)) {
                    console.warn(`[X_X] ${this.botName}: Item blacklisted Id: ${id}\n L->  Illegal phrase matched: "${phrase}"\n`);
                    validTweet = false;
                    break;
                }
            }
            // Save valid tweet block to file
            if (validTweet) {
                this.saveResult(`${id}`, tweetBlock);
            }
        }
        console.log(`[^_^] ${this.botName}: Results processed`);
    }

    /**
     * Parse and saves the result to the destination folder.
     * @param name name of result to be used
     * @param {saved} whether or not the result was saved
     */
    private saveResult(name: string, result: HTMLLIElement): boolean {
        FileSystem.mkdirSync(`${this.storageLocation}/${name}`);
        // Save original result
        FileSystem.writeFileSync(
            `${this.storageLocation}/${name}/${name}.html`,
            result.outerHTML
        );
        // More data analysis friendly json result
        let tweet = TwitterUtils.parseResult(result);
        FileSystem.writeFileSync(
            `${this.storageLocation}/${name}/${name}.json`,
            JSON.stringify(tweet, null, 4) // Pretty print json
        );
        // Collect images from this Tweet
        this.getTweetImages(name, tweet);
        console.log(`[^_^] ${this.botName}: Saved item: ${name}\n`);
        return true;
    }

    /**
     * Downloads the tweet's media images and saves it.
     * @param name name of result to be used to save the images
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
     * @param name name of result to be used to save the image
     * @param imageUrl url of image to be downloaded
     */
    private downloadImage(name: string, imageUrl: string): void {
        console.log(`[o_O] ${this.botName}: Collecting images for item: ${name}\n`);
        HttpRequest.get({ url: imageUrl, encoding: 'binary' }, (error, response, body) => {
            if (error) {
                Utils.handleError(error);
            }
            if (body) {
                // save the image as a binary file
                FileSystem.writeFileSync(
                    `${this.storageLocation}/${name}/${Utils.getFileName(imageUrl)}`,
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
    private async sleep(ms: number): Promise<void> {
        console.log(`[v_v] ${this.botName}: Sleeping for ${ms} ms\n`);
        return new Promise<void>(resolve => setTimeout(resolve, ms));
    }
}