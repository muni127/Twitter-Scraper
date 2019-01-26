"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const FileSystem = require("fs-extra");
const HttpRequest = require("request");
const Querystring = require("querystring");
const Configs = require("./configs");
const twitter_1 = require("./data/twitter");
const utils_1 = require("./utils");
const jsdom_1 = require("jsdom");
const dom = new jsdom_1.JSDOM(`<!DOCTYPE html>`); // create a fake document environment to parse HTML result
const window = dom.window;
const document = window.document;
/**
 *  Twitter scrapper bot
 */
class ScrapperBot {
    constructor() {
        this.blacklistedUrlPhrases = [];
        this.searchQuery = '';
        this.streaming = false;
        this.latest_tweet_id = 0;
        console.log('[v_v] Twitter Bot initialising\n');
        // clear content of destination file
        FileSystem.remove(Configs.appConfigs.saveLocation, (error) => {
            if (error) {
                this.handleError(error);
            }
            else {
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
    scrape(max_position, since_id) {
        // construct scrape target url
        let components = Querystring.stringify({
            'f': 'tweets',
            'q': this.searchQuery,
            'src': 'typd',
            'include_entities': 1,
            'include_available_features': 1,
            'max_position': max_position
        });
        let url = `${Configs.appConfigs.twitterSearchUrl}?${components}`;
        return new Promise((resolve, reject) => {
            console.log(`[0_0] Scanning`);
            // Retrieve scrape result and parse html to json
            HttpRequest.get(url, (error, response, body) => {
                if (error) {
                    this.handleError(error);
                    reject(error);
                }
                if (body) {
                    let result = JSON.parse(body);
                    if (result) {
                        if (this.processResults(result, since_id)) {
                            console.log(`[^_^] Results processed`);
                            console.log(`[^_^] Has more items: ${result.has_more_items}\n`);
                            // if there is still more results continue
                            if (result.has_more_items) {
                                this.scrape(result.min_position, since_id);
                            }
                            else {
                                console.log('[^_^] Scrape complete');
                            }
                        }
                    }
                    else {
                        this.handleError('Could not parse data retrieved');
                    }
                }
                else {
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
    stream() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[D_D] Stream started\n');
            this.streaming = true;
            while (this.streaming) {
                yield this.scrape(null, this.latest_tweet_id);
                console.log(`[^_^] Latest Id: ${this.latest_tweet_id}`);
                // we may not want to crawl on Twitter too frequently
                yield this.sleep(Configs.appConfigs.stream_interval_ms);
            }
        });
    }
    /**
     * Filter and take only important information about the results.
     * find all data-expanded-url include accordo.com/"
     * @param scrapeResult
     * @returns {success} indicates whether scrape should continue
     */
    processResults(scrapeResults, since_id) {
        document.body.innerHTML = scrapeResults.items_html;
        for (let tweetBlock of utils_1.Utils.htmlCollectionToArray(document.body.children)) {
            // Set the latest Id as the largest Id seen so that 
            // we can keep track of the next group to query for using since_id
            let id = +tweetBlock.getAttribute('data-item-id');
            if (id) {
                // end the scrape if since id has been surpassed
                if (id <= since_id) {
                    return false;
                }
                // set the latest tweet id so that the stream knows not to look for any older than this id
                if (id > this.latest_tweet_id) {
                    this.latest_tweet_id = id;
                }
            }
            else {
                return false;
            }
            // Filter out blacklisted url phrases
            let validResult = true;
            for (let phrase of this.blacklistedUrlPhrases) {
                if (tweetBlock.querySelector(`[data-expanded-url*="${phrase}"]`)) {
                    console.warn(`[X_X] Item blacklisted Id: ${id}\n L->  Illegal phrase matched: "${phrase}"\n`);
                    validResult = false;
                    break;
                }
            }
            // save tweet block to file
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
    saveResult(name, result) {
        FileSystem.mkdirSync(`${Configs.appConfigs.saveLocation}/${name}`);
        // original result
        FileSystem.writeFileSync(`${Configs.appConfigs.saveLocation}/${name}/${name}.html`, result.outerHTML);
        // more data analysis friendly json result
        let tweet = twitter_1.TwitterUtils.parseResult(result);
        FileSystem.writeFileSync(`${Configs.appConfigs.saveLocation}/${name}/${name}.json`, JSON.stringify(tweet, null, 4) // pretty print json
        );
        this.getTweetImages(name, tweet);
        console.log(`[o_O] Collecting images for item: ${name}\n`);
    }
    /**
     * Downloads the tweet's media images and saves it.
     * @param tweet tweet containing image urls
     */
    getTweetImages(name, tweet) {
        this.downloadImage(name, tweet.user.avatar);
        let index = 0;
        for (let imageUrl of tweet.images) {
            this.downloadImage(name, imageUrl);
        }
    }
    downloadImage(name, imageUrl) {
        HttpRequest.get({ url: imageUrl, encoding: 'binary' }, (error, response, body) => {
            if (error)
                this.handleError(error);
            if (body) {
                FileSystem.writeFileSync(`${Configs.appConfigs.saveLocation}/${name}/${utils_1.Utils.getFileName(imageUrl)}`, body, 'binary');
            }
            else {
                this.handleError(`Could not receive any image from ${imageUrl}`);
            }
        });
    }
    sleep(ms) {
        console.log(`[v_v] Sleeping for ${ms} ms`);
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Sturtured error logging to console
     * @param err error to be logged
     */
    handleError(err) {
        console.error('[6_6] Warning. An Error has occured.');
        console.error(`----> ${err}`);
    }
}
exports.ScrapperBot = ScrapperBot;
