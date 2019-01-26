"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
class SearchQueryParams {
}
exports.SearchQueryParams = SearchQueryParams;
class TweetSearchResult {
}
exports.TweetSearchResult = TweetSearchResult;
class Tweet {
}
exports.Tweet = Tweet;
class TwitterUser {
}
exports.TwitterUser = TwitterUser;
class Media {
}
exports.Media = Media;
class TwitterUtils {
    /**
     *  Stitches all operators and term to a usable query string for Twitter search
     */
    static generateSearchQuery(queryParams) {
        let result = queryParams.term || '';
        if (queryParams.operators) {
            for (let operator of queryParams.operators) {
                result += ` ${operator.operator}${operator.value}`;
            }
        }
        return result.trim();
    }
    static getImages(tweetBlock) {
        let result = [];
        for (let container of utils_1.Utils.nodeListOfToArray(tweetBlock.querySelectorAll('.js-adaptive-photo'))) {
            result.push(container.getAttribute('data-image-url'));
        }
        return result;
    }
    static getVideos(tweetBlock) {
        let result = [];
        for (let container of utils_1.Utils.nodeListOfToArray(tweetBlock.querySelectorAll('video'))) {
            result.push(container.getAttribute('src'));
        }
        return result;
    }
    static getOtherMedia(tweetBlock) {
        let result = [];
        for (let container of utils_1.Utils.nodeListOfToArray(tweetBlock.querySelectorAll('[data-card-name]'))) {
            result.push({
                mediaType: container.getAttribute('data-card-name'),
                url: container.getAttribute('data-card-url')
            });
        }
        return result;
    }
    static parseResult(tweetBlock) {
        let has_cards = tweetBlock.querySelector('[data-has-cards]') ? true : false;
        return {
            id: +tweetBlock.querySelector('[data-tweet-id]').getAttribute('data-tweet-id'),
            created_on: new Date(+tweetBlock.querySelector('.stream-item-header .tweet-timestamp').getAttribute('data-time')),
            user: {
                user_id: +tweetBlock.querySelector('[data-user-id]').getAttribute('data-user-id'),
                name: tweetBlock.querySelector('[data-name]').getAttribute('data-name'),
                screen_name: tweetBlock.querySelector('[data-screen-name]').getAttribute('data-screen-name'),
                avatar: tweetBlock.querySelector('.content .stream-item-header a img').getAttribute('src')
            },
            text: tweetBlock.querySelector('.js-tweet-text-container p').innerHTML,
            url: tweetBlock.querySelector('[data-permalink-path]').getAttribute('data-permalink-path'),
            is_retweet: tweetBlock.querySelector('.js-retweet-text') ? true : false,
            is_reply: tweetBlock.querySelector('.ReplyingToContextBelowAuthor') ? true : false,
            retweet_count: +tweetBlock.querySelector('.ProfileTweet-action--retweet .ProfileTweet-actionCount').getAttribute('data-tweet-stat-count'),
            reply_count: +tweetBlock.querySelector('.ProfileTweet-action--reply .ProfileTweet-actionCount').getAttribute('data-tweet-stat-count'),
            favorite_count: +tweetBlock.querySelector('.ProfileTweet-action--favorite .ProfileTweet-actionCount').getAttribute('data-tweet-stat-count'),
            images: has_cards ? this.getImages(tweetBlock) : [],
            videos: has_cards ? this.getVideos(tweetBlock) : [],
            other_media: has_cards ? this.getOtherMedia(tweetBlock) : []
        };
    }
}
exports.TwitterUtils = TwitterUtils;
