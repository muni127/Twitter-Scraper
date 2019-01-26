import { Utils } from './utils';

/**
 *  Valid query operators for Twitter search
 */
export interface QueryOperator {
    'filter:': string;
    'from:': string;
    'list:': string;
    'OR': string;
    'to:': string;
    'since:': string;
    'until:': string;
    'url:': string;
    '-': string;
    '#': string;
    '@': string;
}

export interface QueryOperatorPair {
    operator: keyof QueryOperator;
    value: string;
}

export class SearchQueryParams {
    term?: string;
    operators?: QueryOperatorPair[];
} 

export class TweetSearchResult {
    has_more_items: boolean;
    items_html: string;
    new_latent_count: number;
    focused_refresh_interval: number;
    min_position: string;
}

export class Tweet {
    id: number;
    created_on: Date;
    user: TwitterUser;
    text: string;
    url: string;
    is_retweet: boolean;
    is_reply: boolean;
    replying_to: TwitterUser[];
    retweet_count: number;
    reply_count: number;
    favorite_count: number;
    images: string[];
    videos: string[];
    other_media: Media[];
}

export class TwitterUser {
    id: number;
    name?: string;
    screen_name?: string;
    avatar?: string;
}

export class Media {
    mediaType: string;
    url: string;
}

export class TwitterUtils {
    /**
     *  Stitches all operators and term to a usable query string for Twitter search
     */
    static generateSearchQuery(queryParams: SearchQueryParams): string {
        let result = queryParams.term || '';
        if (queryParams.operators) {
            for (let operator of queryParams.operators) {
                result += ` ${operator.operator}${operator.value}`;
            }
        }
        return result.trim();
    }

    static getReplyingTo(tweetBlock: HTMLElement): TwitterUser[] {
        let result: TwitterUser[] = [];
        for (let container of Utils.nodeListOfToArray(tweetBlock.querySelectorAll('.ReplyingToContextBelowAuthor .js-user-profile-link'))) {
            result.push({
                id: +container.getAttribute('data-user-id'),
                screen_name: container.getAttribute('href').replace('/', ''),
            });
        }
        return result;
    }

    static getImages(tweetBlock: HTMLElement): string[] {
        let result: string[] = [];
        // collect images from both photo containers and text block
        for (let container of Utils.nodeListOfToArray(tweetBlock.querySelectorAll('img'))) {
            let url = container.getAttribute('src');
            // make sure we get unique urls only
            if (url && result.indexOf(url) === -1) {
                result.push(url);
            }
        }
        return result;
    }

    static getVideos(tweetBlock: HTMLElement): string[] {
        let result: string[] = [];
        for (let container of Utils.nodeListOfToArray(tweetBlock.querySelectorAll('video'))) {
            let url = container.getAttribute('src');
            // make sure we get unique urls only
            if (url && result.indexOf(url) === -1) {
                result.push(url);
            }
        }
        return result;
    }

    static getOtherMedia(tweetBlock: HTMLElement): Media[] {
        let result: Media[] = [];
        for (let container of Utils.nodeListOfToArray(tweetBlock.querySelectorAll('[data-card-name]'))) {
            let url = container.getAttribute('data-card-url');
            // make sure we get unique media only
            if (url && result.findIndex(media => media.url === url) === -1) {
                result.push({
                    mediaType: container.getAttribute('data-card-name'),
                    url: url
                });
            }
        }
        return result;
    }

    /**
     * Collect useful  information about the Tweet from the HTML provided and returns it as a Tweet object.
     * @param tweetBlock HTML form of the tweet
     * @returns {Tweet} a Tweet object serializable by JSON
     */
    static parseResult(tweetBlock: HTMLElement): Tweet {
        return {
            id: +tweetBlock.querySelector('[data-tweet-id]').getAttribute('data-tweet-id'),
            created_on: new Date(+tweetBlock.querySelector('.tweet-timestamp [data-time-ms]').getAttribute('data-time-ms')),
            user: {
                id: +tweetBlock.querySelector('[data-user-id]').getAttribute('data-user-id'),
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
    }
}
