"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Configs = require("./configs");
var FileSystem = require("fs-extra");
var HttpRequest = require("request");
var Querystring = require("querystring");
var twitter_1 = require("./twitter");
var utils_1 = require("./utils");
var jsdom_1 = require("jsdom");
var dom = new jsdom_1.JSDOM("<!DOCTYPE html>"); // create a fake document environment to parse HTML result
var window = dom.window;
var document = window.document;
/**
 *  Twitter scraper bot
 */
var ScraperBot = /** @class */ (function () {
    /**
     * @param name name of the bot
     */
    function ScraperBot(name) {
        this.running = false;
        this.streaming = false;
        this.blacklistedUrlPhrases = [];
        if (!name.length) {
            throw new Error(name + " is invalid, try 'Bot 1'\n");
        }
        // Bot names should be unique
        if (ScraperBot.botNames.indexOf(name) > -1) {
            throw new Error("A bot with name \"" + name + "\" has already been created\n");
        }
        this.botName = name;
        ScraperBot.botNames.push(name);
        // Set up storage parameters to store data using current timestamp
        this.storage_label = name + " " + new Date().toISOString().replace(new RegExp(':', 'g'), '-');
        this.storageLocation = Configs.appConfigs.saveLocation + "/" + this.storage_label;
        // Create destination folder
        FileSystem.mkdirSync(this.storageLocation);
    }
    /**
     *  Begins the scrape and stream processes
     */
    ScraperBot.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.running) {
                            console.log(this.botName + " is already running");
                            return [2 /*return*/];
                        }
                        this.running = true;
                        console.log("[v_v] " + this.botName + ": initialising\n");
                        this.urlComponents = {
                            f: 'tweets',
                            q: this.query,
                            src: 'typd',
                            include_entities: true,
                            include_available_features: true
                        };
                        return [4 /*yield*/, this.scrape()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.stream()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check Twitter for any updates. Sleeps when scan is completed.
     * This stream is async because we don't want the bot to spam Twitter.
     */
    ScraperBot.prototype.stream = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.streaming) {
                            console.log(this.botName + " is already streaming");
                            return [2 /*return*/];
                        }
                        console.log("[D_D] " + this.botName + ": Stream started\n");
                        this.streaming = true;
                        _a.label = 1;
                    case 1:
                        if (!this.streaming) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.scrape(this.latest_max_position)];
                    case 2:
                        _a.sent();
                        // we may not want to crawl on Twitter too frequently
                        return [4 /*yield*/, this.sleep(Configs.appConfigs.stream_interval_ms)];
                    case 3:
                        // we may not want to crawl on Twitter too frequently
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Begins the traverse process configuring the traverse's min and max positions
     * @param min_position the min position of where the scrape should stop.
     */
    ScraperBot.prototype.scrape = function (min_position) {
        return __awaiter(this, void 0, void 0, function () {
            var targetUrlComponents, url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        targetUrlComponents = Object.assign(new twitter_1.SearchComponents(), this.urlComponents);
                        // Set the min postion when streaming upwards
                        if (min_position) {
                            targetUrlComponents.min_position = min_position;
                        }
                        else {
                            targetUrlComponents.max_position = this.latest_max_position;
                        }
                        url = Configs.appConfigs.twitterSearchUrl + "?" + Querystring.stringify(targetUrlComponents);
                        // Set the latest max position when the scrape started
                        return [4 /*yield*/, this.traverseTimeLine(url)];
                    case 1:
                        // Set the latest max position when the scrape started
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Finds all result on twitter with the query specified going down the timeline.
     * @param url target url of the traverse page
     */
    ScraperBot.prototype.traverseTimeLine = function (url, last_max_position) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        console.log("[0_0] " + _this.botName + ": Scanning " + url + "\n");
                        // Retrieve scrape result and parse html to json
                        HttpRequest.get(url, function (error, response, body) { return __awaiter(_this, void 0, void 0, function () {
                            var result, newTargetUrlComponents;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (error) {
                                            utils_1.Utils.handleError(error, reject);
                                        }
                                        if (!body) return [3 /*break*/, 6];
                                        result = JSON.parse(body);
                                        if (!result) return [3 /*break*/, 4];
                                        // Process the results
                                        this.processResults(result);
                                        newTargetUrlComponents = Object.assign(new twitter_1.SearchComponents(), this.urlComponents);
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
                                        if (!(last_max_position === newTargetUrlComponents.max_position)) return [3 /*break*/, 1];
                                        // No difference in the last max positions and the current so stop the traverse
                                        console.log("[^_^] " + this.botName + ": Scrape complete\n");
                                        resolve();
                                        return [3 /*break*/, 3];
                                    case 1: 
                                    // Execute the next traverse going down the timeline
                                    return [4 /*yield*/, this.traverseTimeLine(Configs.appConfigs.twitterSearchUrl + "?" + Querystring.stringify(newTargetUrlComponents), newTargetUrlComponents.max_position)];
                                    case 2:
                                        // Execute the next traverse going down the timeline
                                        _a.sent();
                                        _a.label = 3;
                                    case 3: return [3 /*break*/, 5];
                                    case 4:
                                        utils_1.Utils.handleError('Could not parse data retrieved', reject);
                                        _a.label = 5;
                                    case 5: return [3 /*break*/, 7];
                                    case 6:
                                        utils_1.Utils.handleError('Could not receive any data from twitter', reject);
                                        _a.label = 7;
                                    case 7:
                                        resolve();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    })];
            });
        });
    };
    /**
     * Filter and process only important information about the results.
     * @param scrape_results results returned from Twitter as a list of Tweets in HTML
     * @param since_id the oldest Id we should process.
     * @returns {success} indicates whether scrape should continue. False if since_id is surpassed.
     */
    ScraperBot.prototype.processResults = function (scrape_results) {
        // save the results to the emulated document to parse as HTML
        document.body.innerHTML = scrape_results.items_html;
        var tweets = utils_1.Utils.htmlCollectionToArray(document.body.children);
        for (var _i = 0, tweets_1 = tweets; _i < tweets_1.length; _i++) {
            var tweetBlock = tweets_1[_i];
            var id = tweetBlock.querySelector('[data-tweet-id]').getAttribute('data-tweet-id');
            if (FileSystem.existsSync(this.storageLocation + "/" + id)) {
                // The Tweet has already been saved so we do not need to save anything, Twitter does not allow users to edit their Tweet
                continue;
            }
            // Filter out blacklisted url phrases from the expanded urls
            var validTweet = true;
            for (var _a = 0, _b = this.blacklistedUrlPhrases; _a < _b.length; _a++) {
                var phrase = _b[_a];
                if (tweetBlock.querySelector("[data-expanded-url*=\"" + phrase + "\"]")) {
                    console.warn("[X_X] " + this.botName + ": Item blacklisted Id: " + id + "\n L->  Illegal phrase matched: \"" + phrase + "\"\n");
                    validTweet = false;
                    break;
                }
            }
            // Save valid tweet block to file
            if (validTweet) {
                this.saveResult("" + id, tweetBlock);
            }
        }
        console.log("[^_^] " + this.botName + ": Results processed");
    };
    /**
     * Parse and saves the result to the destination folder.
     * @param name name of result to be used
     * @param {saved} whether or not the result was saved
     */
    ScraperBot.prototype.saveResult = function (name, result) {
        FileSystem.mkdirSync(this.storageLocation + "/" + name);
        // Save original result
        FileSystem.writeFileSync(this.storageLocation + "/" + name + "/" + name + ".html", result.outerHTML);
        // More data analysis friendly json result
        var tweet = twitter_1.TwitterUtils.parseResult(result);
        FileSystem.writeFileSync(this.storageLocation + "/" + name + "/" + name + ".json", JSON.stringify(tweet, null, 4) // Pretty print json
        );
        // Collect images from this Tweet
        this.getTweetImages(name, tweet);
        console.log("[^_^] " + this.botName + ": Saved item: " + name + "\n");
        return true;
    };
    /**
     * Downloads the tweet's media images and saves it.
     * @param name name of result to be used to save the images
     * @param tweet tweet containing image urls
     */
    ScraperBot.prototype.getTweetImages = function (name, tweet) {
        // download user's avatar image
        this.downloadImage(name, tweet.user.avatar);
        // download the rest of the images
        for (var _i = 0, _a = tweet.images; _i < _a.length; _i++) {
            var imageUrl = _a[_i];
            this.downloadImage(name, imageUrl);
        }
    };
    /**
     * Retrieves image from URL
     * @param name name of result to be used to save the image
     * @param imageUrl url of image to be downloaded
     */
    ScraperBot.prototype.downloadImage = function (name, imageUrl) {
        var _this = this;
        console.log("[o_O] " + this.botName + ": Collecting images for item: " + name + "\n");
        HttpRequest.get({ url: imageUrl, encoding: 'binary' }, function (error, response, body) {
            if (error) {
                utils_1.Utils.handleError(error);
            }
            if (body) {
                // save the image as a binary file
                FileSystem.writeFileSync(_this.storageLocation + "/" + name + "/" + utils_1.Utils.getFileName(imageUrl), body, 'binary');
            }
            else {
                utils_1.Utils.handleError("Could not receive any image from " + imageUrl);
            }
        });
    };
    /**
     * Pauses the bot for sometime
     * @param ms amount of time to sleep in milliseconds
     * @returns {promise} promise which will end when the bot can start again
     */
    ScraperBot.prototype.sleep = function (ms) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("[v_v] " + this.botName + ": Sleeping for " + ms + " ms\n");
                return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
            });
        });
    };
    ScraperBot.botNames = [];
    return ScraperBot;
}());
exports.ScraperBot = ScraperBot;
