import * as FileSystem from 'fs-extra';
import * as HttpRequest from 'request';
import * as Querystring from 'querystring';
import * as Configs from './configs';

import { TweetSearchResult, SearchQueryParams, TwitterUtils, Tweet, TwitterUser } from './data/twitter';
import { Utils } from './utils';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!DOCTYPE html>`); // create a fake document environment to parse HTML result
const window = dom.window;
const document = window.document;

/**
 *  Twitter scrapper bot
 */
export class ScrapperBot {
    blacklistedUrlPhrases: string[] = [];
    searchQuery: string = '';

    private streaming: boolean = false;
    private latest_tweet_id: number = 0;

    constructor() {
        console.log('[v_v] Twitter Bot initialising\n');
        // clear content of destination file
        FileSystem.remove(Configs.appConfigs.saveLocation, (error) => {
            if (error) {
                this.handleError(error);
            } else {
                FileSystem.mkdirSync(Configs.appConfigs.saveLocation);
            }
        });
    }

    /**
     *  Begins the scrape and stream processes
     */
    start() {
        console.log('{-.-} The bot has been released !!!');
        this.scrape().then(this.stream.bind(this));
    }

    /**
     * Finds all result on twitter with the query specified
     * @param includeImages should scrape images as well
     */
    private scrape(max_position?: string, since_id?: number): Promise<void> {
        // construct scrape target url
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
            console.log(`[0_0] Scanning`);
            // Retrieve scrape result and parse html to json
            HttpRequest.get(url, (error, response, body) => {
                if (error) {
                    this.handleError(error);
                    reject(error);
                }
                if (body) {
                    let result: TweetSearchResult = JSON.parse(body);
                    if (result) {
                        if (this.processResults(result, since_id)) {
                            console.log(`[^_^] Results processed`);
                            console.log(`[^_^] Has more items: ${result.has_more_items}\n`);
                            // if there is still more results continue
                            if (result.has_more_items) {
                                this.scrape(result.min_position, since_id);
                            } else {
                                console.log('[^_^] Scrape complete');
                            }
                        }
                    } else {
                        this.handleError('Could not parse data retrieved');
                    }
                } else {
                    this.handleError('Could not receive any data from twitter');
                }
                resolve();
            });
        });
    }

    /**
     * Finds all content on Twitter by term provided and stores anything found
     * to Azure blob storage
     * @param term for filtering search
     * @param includeImages specify if bot should save images
     */
    private async stream() {
        console.log('[D_D] Stream started\n');
        this.streaming = true;
        while (this.streaming) {
            await this.scrape(null, this.latest_tweet_id);
            console.log(`[^_^] Latest Id: ${this.latest_tweet_id}`);

            // we may not want to crawl on Twitter too frequently
            await this.sleep(Configs.appConfigs.stream_interval_ms);
        }
    }

    /**
     * Filter and take only important information about the results.
     * find all data-expanded-url include accordo.com/"
     * @param scrapeResult
     * @returns {success} indicates whether scrape should continue
     */
    private processResults(scrapeResults: TweetSearchResult, since_id: number): boolean {
         // save the results to the emulated document to parse as HTML
        document.body.innerHTML = scrapeResults.items_html;
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
                    console.warn(`[X_X] Item blacklisted Id: ${id}\n L->  Illegal phrase matched: "${phrase}"\n`);
                    validResult = false;
                    break;
                }
            }
            // save valid tweet block to file
            if (validResult) {
                this.saveResult(`${id}`, tweetBlock);
                console.log(`[^_^] Saved item: ${id}\n`);
            }
        }
        return true;
    }

    /**
     * Parse and saves the result to the destination folder.
     * @param name
     * @param result
     */
    private saveResult(name: string, result: HTMLLIElement): void {
        // create destination folder for result
        FileSystem.mkdirSync(`${Configs.appConfigs.saveLocation}/${name}`);
        // save original result
        FileSystem.writeFileSync(
            `${Configs.appConfigs.saveLocation}/${name}/${name}.html`,
            result.outerHTML
        );
        // more data analysis friendly json result
        let tweet = TwitterUtils.parseResult(result);
        FileSystem.writeFileSync(
            `${Configs.appConfigs.saveLocation}/${name}/${name}.json`,
            JSON.stringify(tweet, null, 4) // pretty print json
        );
        this.getTweetImages(name, tweet);
        console.log(`[o_O] Collecting images for item: ${name}\n`);
    }

    /**
     * Downloads the tweet's media images and saves it.
     * @param tweet tweet containing image urls
     */
    private getTweetImages(name: string, tweet: Tweet): void {
        this.downloadImage(name, tweet.user.avatar);
        let index = 0;
        for (let imageUrl of tweet.images) {
            this.downloadImage(name, imageUrl);
        }
    }

    private downloadImage(name: string, imageUrl: string): void {
        HttpRequest.get({ url: imageUrl, encoding: 'binary' }, (error, response, body) => {
            if (error) this.handleError(error);
            if (body) {
                FileSystem.writeFileSync(
                    `${Configs.appConfigs.saveLocation}/${name}/${Utils.getFileName(imageUrl)}`,
                    body,
                    'binary'
                );
            } else {
                this.handleError(`Could not receive any image from ${imageUrl}`);
            }
        });
    }

    private sleep(ms: number): Promise<void> {
        console.log(`[v_v] Sleeping for ${ms} ms`);
        return new Promise<void>(resolve => setTimeout(resolve, ms));
    }

    /**
     * Sturtured error logging to console
     * @param err error to be logged
     */
    private handleError(err: Error | string): any {
        console.error('[6_6] Warning. An Error has occured.');
        console.error(`----> ${err}`);
    }
}