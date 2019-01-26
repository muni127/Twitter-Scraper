import { Utils } from '../utils';

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
    retweet_count: number;
    reply_count: number;
    favorite_count: number;
    images: string[];
    videos: string[];
    other_media: Media[];
}

export class TwitterUser {
    user_id: number;
    name: string;
    screen_name: string;
    avatar: string;
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

    static getImages(tweetBlock: HTMLElement): string[] {
        let result: string[] = [];
        for (let container of Utils.nodeListOfToArray(tweetBlock.querySelectorAll('.js-adaptive-photo'))) {
            result.push(container.getAttribute('data-image-url'));
        }
        return result;
    }

    static getVideos(tweetBlock: HTMLElement): string[] {
        let result: string[] = [];
        for (let container of Utils.nodeListOfToArray(tweetBlock.querySelectorAll('video'))) {
            result.push(container.getAttribute('src'));
        }
        return result;
    }

    static getOtherMedia(tweetBlock: HTMLElement): Media[] {
        let result: Media[] = [];
        for (let container of Utils.nodeListOfToArray(tweetBlock.querySelectorAll('[data-card-name]'))) {
            result.push({
                mediaType: container.getAttribute('data-card-name'),
                url: container.getAttribute('data-card-url')
            });
        }
        return result;
    }

    static parseResult(tweetBlock: HTMLElement): Tweet {
        let has_cards: boolean = tweetBlock.querySelector('[data-has-cards]') ? true : false;
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
