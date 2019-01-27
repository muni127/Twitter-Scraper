"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var SearchQueryParams = /** @class */ (function () {
    function SearchQueryParams() {
    }
    return SearchQueryParams;
}());
exports.SearchQueryParams = SearchQueryParams;
var TweetSearchResult = /** @class */ (function () {
    function TweetSearchResult() {
    }
    return TweetSearchResult;
}());
exports.TweetSearchResult = TweetSearchResult;
var Tweet = /** @class */ (function () {
    function Tweet() {
    }
    return Tweet;
}());
exports.Tweet = Tweet;
var TwitterUser = /** @class */ (function () {
    function TwitterUser() {
    }
    return TwitterUser;
}());
exports.TwitterUser = TwitterUser;
var Media = /** @class */ (function () {
    function Media() {
    }
    return Media;
}());
exports.Media = Media;
var TwitterUtils = /** @class */ (function () {
    function TwitterUtils() {
    }
    /**
     *  Stitches all operators and term to a usable query string for Twitter search
     */
    TwitterUtils.generateSearchQuery = function (queryParams) {
        var result = queryParams.term || '';
        if (queryParams.operators) {
            for (var _i = 0, _a = queryParams.operators; _i < _a.length; _i++) {
                var operator = _a[_i];
                result += " " + operator.operator + operator.value;
            }
        }
        return result.trim();
    };
    TwitterUtils.getReplyingTo = function (tweetBlock) {
        var result = [];
        for (var _i = 0, _a = utils_1.Utils.nodeListOfToArray(tweetBlock.querySelectorAll('.ReplyingToContextBelowAuthor .js-user-profile-link')); _i < _a.length; _i++) {
            var container = _a[_i];
            result.push({
                id: container.getAttribute('data-user-id'),
                screen_name: container.getAttribute('href').replace('/', ''),
            });
        }
        return result;
    };
    TwitterUtils.getImages = function (tweetBlock) {
        var result = [];
        // collect images from both photo containers and text block
        for (var _i = 0, _a = utils_1.Utils.nodeListOfToArray(tweetBlock.querySelectorAll('img')); _i < _a.length; _i++) {
            var container = _a[_i];
            var url = container.getAttribute('src');
            // make sure we get unique urls only
            if (url && result.indexOf(url) === -1) {
                result.push(url);
            }
        }
        return result;
    };
    TwitterUtils.getVideos = function (tweetBlock) {
        var result = [];
        for (var _i = 0, _a = utils_1.Utils.nodeListOfToArray(tweetBlock.querySelectorAll('video')); _i < _a.length; _i++) {
            var container = _a[_i];
            var url = container.getAttribute('src');
            // make sure we get unique urls only
            if (url && result.indexOf(url) === -1) {
                result.push(url);
            }
        }
        return result;
    };
    TwitterUtils.getOtherMedia = function (tweetBlock) {
        var result = [];
        var _loop_1 = function (container) {
            var url = container.getAttribute('data-card-url');
            // make sure we get unique media only
            if (url && result.findIndex(function (media) { return media.url === url; }) === -1) {
                result.push({
                    mediaType: container.getAttribute('data-card-name'),
                    url: url
                });
            }
        };
        for (var _i = 0, _a = utils_1.Utils.nodeListOfToArray(tweetBlock.querySelectorAll('[data-card-name]')); _i < _a.length; _i++) {
            var container = _a[_i];
            _loop_1(container);
        }
        return result;
    };
    /**
     * Collect useful  information about the Tweet from the HTML provided and returns it as a Tweet object.
     * @param tweetBlock HTML form of the tweet
     * @returns {Tweet} a Tweet object serializable by JSON
     */
    TwitterUtils.parseResult = function (tweetBlock) {
        return {
            id: tweetBlock.querySelector('[data-tweet-id]').getAttribute('data-tweet-id'),
            created_on: new Date(+tweetBlock.querySelector('.tweet-timestamp [data-time-ms]').getAttribute('data-time-ms')),
            user: {
                id: tweetBlock.querySelector('[data-user-id]').getAttribute('data-user-id'),
                name: tweetBlock.querySelector('[data-name]').getAttribute('data-name'),
                screen_name: tweetBlock.querySelector('[data-screen-name]').getAttribute('data-screen-name'),
                avatar: tweetBlock.querySelector('.content .stream-item-header a img').getAttribute('src')
            },
            text: tweetBlock.querySelector('.js-tweet-text-container p').innerHTML,
            url: tweetBlock.querySelector('[data-permalink-path]').getAttribute('data-permalink-path'),
            is_retweet: tweetBlock.querySelector('.js-retweet-text') ? true : false,
            is_reply: tweetBlock.querySelector('.ReplyingToContextBelowAuthor') ? true : false,
            replying_to: this.getReplyingTo(tweetBlock),
            retweet_count: +tweetBlock.querySelector('.ProfileTweet-action--retweet .ProfileTweet-actionCount').getAttribute('data-tweet-stat-count'),
            reply_count: +tweetBlock.querySelector('.ProfileTweet-action--reply .ProfileTweet-actionCount').getAttribute('data-tweet-stat-count'),
            favorite_count: +tweetBlock.querySelector('.ProfileTweet-action--favorite .ProfileTweet-actionCount').getAttribute('data-tweet-stat-count'),
            images: this.getImages(tweetBlock),
            videos: this.getVideos(tweetBlock),
            other_media: this.getOtherMedia(tweetBlock)
        };
    };
    return TwitterUtils;
}());
exports.TwitterUtils = TwitterUtils;
