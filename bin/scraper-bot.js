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
var BigInt = require("big-integer");
var Configs = require("./configs");
var FileSystem = require("fs-extra");
var HttpRequest = require("request");
var Querystring = require("querystring");
var twitter_1 = require("./twitter");
var utils_1 = require("./utils");
var jsdom_1 = require("jsdom");
var util_1 = require("util");
var dom = new jsdom_1.JSDOM("<!DOCTYPE html>"); // create a fake document environment to parse HTML result
var window = dom.window;
var document = window.document;
/**
 *  Twitter scraper bot
 */
var ScraperBot = /** @class */ (function () {
    function ScraperBot(name) {
        this.blacklistedUrlPhrases = [];
        this.searchQuery = '';
        if (!name.length) {
            throw new Error(name + " is invalid, try 'Bot 1'\n");
        }
        // Bot names should be unique
        if (ScraperBot.bot_names.indexOf(name) > -1) {
            throw new Error("A bot with name \"" + name + "\" has already been created\n");
        }
        this.bot_name = name;
        ScraperBot.bot_names.push(name);
        // Set up storage parameters to store data using current timestamp
        this.storage_label = name + " " + new Date().toISOString().replace(new RegExp(':', 'g'), '-');
        this.storage_location = Configs.appConfigs.saveLocation + "/" + this.storage_label;
        // Create destination folder
        FileSystem.mkdirSync(this.storage_location);
        this.running = false;
        this.streaming = false;
        this.latest_tweet_id = '';
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
                            console.log(this.bot_name + " is already running");
                            return [2 /*return*/];
                        }
                        this.running = true;
                        console.log("[v_v] " + this.bot_name + ": initialising\n");
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
     * Finds all result on twitter with the query specified going back in time.
     * @param max_position the max position of where the scrape shold start from.
     * @param since_id the minimum Id of the Tweet the scrape can go back to.
     */
    ScraperBot.prototype.scrape = function (max_position, since_id) {
        var _this = this;
        // construct scrape target url encoding all components
        var components = {
            'f': 'tweets',
            'q': this.searchQuery,
            'src': 'typd',
            'include_entities': 1,
            'include_available_features': 1
        };
        if (util_1.isNullOrUndefined(max_position)) {
            components['min_position'] = ''; // only add this parameter if max position has not been defined
        }
        else {
            components['max_position'] = max_position; // only add this parameter if it has been set
        }
        var url = Configs.appConfigs.twitterSearchUrl + "?" + Querystring.stringify(components);
        return new Promise(function (resolve, reject) {
            console.log("[0_0] " + _this.bot_name + ": Scanning " + url + "\n");
            // Retrieve scrape result and parse html to json
            HttpRequest.get(url, function (error, response, body) { return __awaiter(_this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (error) {
                                utils_1.Utils.handleError(error);
                                reject(error);
                            }
                            if (!body) return [3 /*break*/, 8];
                            result = JSON.parse(body);
                            if (!result) return [3 /*break*/, 6];
                            if (!this.processResults(result, since_id)) return [3 /*break*/, 5];
                            console.log("[^_^] " + this.bot_name + ": Results processed");
                            console.log("[^_^] " + this.bot_name + ": Has more items: " + result.has_more_items + "\n");
                            if (!result.has_more_items) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.scrape(result.min_position, since_id)];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 2:
                            if (!(!util_1.isNullOrUndefined(result.max_position) && result.max_position !== this.stream_max_position)) return [3 /*break*/, 4];
                            console.log("[^_^] " + this.bot_name + ": Starting from the top\n");
                            return [4 /*yield*/, this.scrape(result.max_position, since_id)];
                        case 3:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            console.log("[^_^] " + this.bot_name + ": Scrape complete\n");
                            _a.label = 5;
                        case 5: return [3 /*break*/, 7];
                        case 6:
                            utils_1.Utils.handleError('Could not parse data retrieved');
                            _a.label = 7;
                        case 7: return [3 /*break*/, 9];
                        case 8:
                            utils_1.Utils.handleError('Could not receive any data from twitter');
                            _a.label = 9;
                        case 9:
                            resolve();
                            return [2 /*return*/];
                    }
                });
            }); });
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
                            console.log(this.bot_name + " is already streaming");
                            return [2 /*return*/];
                        }
                        console.log("[D_D] " + this.bot_name + ": Stream started\n");
                        this.streaming = true;
                        _a.label = 1;
                    case 1:
                        if (!this.streaming) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.scrape(null, this.latest_tweet_id)];
                    case 2:
                        _a.sent();
                        console.log("[^_^] " + this.bot_name + ": Latest Id: " + this.latest_tweet_id);
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
     * Filter and process only important information about the results.
     * @param scrape_results results returned from Twitter as a list of Tweets in HTML
     * @param since_id the oldest Id we should process.
     * @returns {success} indicates whether scrape should continue. False if since_id is surpassed.
     */
    ScraperBot.prototype.processResults = function (scrape_results, since_id) {
        // save the results to the emulated document to parse as HTML
        document.body.innerHTML = scrape_results.items_html;
        for (var _i = 0, _a = utils_1.Utils.htmlCollectionToArray(document.body.children); _i < _a.length; _i++) {
            var tweetBlock = _a[_i];
            // Set the latest Id as the largest Id seen so that 
            // We can keep track of the next group to query for using since_id
            var id = tweetBlock.querySelector('[data-tweet-id]').getAttribute('data-tweet-id'), bigId = BigInt(id); // Need to convert the Id to big int since normal number will overflow
            if (bigId) {
                // End the scrape if since_id has been surpassed
                if (since_id && bigId <= BigInt(since_id)) {
                    return false;
                }
                // Set the latest tweet id so that the stream knows not to look for anything older
                if (!this.latest_tweet_id || bigId > BigInt(this.latest_tweet_id)) {
                    this.latest_tweet_id = id;
                }
            }
            else {
                return false;
            }
            // Filter out blacklisted url phrases from the expanded urls
            var validResult = true;
            for (var _b = 0, _c = this.blacklistedUrlPhrases; _b < _c.length; _b++) {
                var phrase = _c[_b];
                if (tweetBlock.querySelector("[data-expanded-url*=\"" + phrase + "\"]")) {
                    console.warn("[X_X] " + this.bot_name + ": Item blacklisted Id: " + id + "\n L->  Illegal phrase matched: \"" + phrase + "\"\n");
                    validResult = false;
                    break;
                }
            }
            // Save valid tweet block to file
            if (validResult) {
                this.saveResult("" + id, tweetBlock);
                console.log("[^_^] " + this.bot_name + ": Saved item: " + id + "\n");
            }
        }
        return true;
    };
    /**
     * Parse and saves the result to the destination folder.
     * @param name name of result to be used
     * @param result
     */
    ScraperBot.prototype.saveResult = function (name, result) {
        var _this = this;
        // Create destination folder for result
        FileSystem.mkdir(this.storage_location + "/" + name, function (error) {
            if (error) {
                utils_1.Utils.handleError(error);
            }
            else {
                // Save original result
                FileSystem.writeFileSync(_this.storage_location + "/" + name + "/" + name + ".html", result.outerHTML);
                // More data analysis friendly json result
                var tweet = twitter_1.TwitterUtils.parseResult(result);
                FileSystem.writeFileSync(_this.storage_location + "/" + name + "/" + name + ".json", JSON.stringify(tweet, null, 4) // Pretty print json
                );
                _this.getTweetImages(name, tweet);
                console.log("[o_O] " + _this.bot_name + ": Collecting images for item: " + name + "\n");
            }
        });
    };
    /**
     * Downloads the tweet's media images and saves it.
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
     * @param name name of result to be used
     * @param imageUrl url of image to be downloaded
     */
    ScraperBot.prototype.downloadImage = function (name, imageUrl) {
        var _this = this;
        HttpRequest.get({ url: imageUrl, encoding: 'binary' }, function (error, response, body) {
            if (error) {
                utils_1.Utils.handleError(error);
            }
            if (body) {
                FileSystem.writeFileSync(_this.storage_location + "/" + name + "/" + utils_1.Utils.getFileName(imageUrl), body, 'binary');
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
        console.log("[v_v] " + this.bot_name + ": Sleeping for " + ms + " ms\n");
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    ScraperBot.bot_names = [];
    return ScraperBot;
}());
exports.ScraperBot = ScraperBot;
