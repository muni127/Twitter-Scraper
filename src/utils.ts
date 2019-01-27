export class Utils {
    static htmlCollectionToArray<T>(collection: HTMLCollection): T[] {
        return Array.prototype.slice.call(collection);
    };

    static nodeListOfToArray<T extends Node>(collection: NodeListOf<T>): T[] {
        return Array.prototype.slice.call(collection);
    };

    /**
     * Returns the file name and extension from the file's path.
     * @param filePath path to the file's exact location inluding name and extension.
     */
    static getFileName(filePath: string): string {
        return filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
    }

    /**
     * Sturtured error logging to console.
     * @param error error to be logged.
     * @param callback function to execute when done.
     */
    static handleError(error: Error | string, callback?: Function): any {
        console.error('!!!!! Error. An Error has occured.');
        console.error(`----> ${error}`);
        if (callback) {
            callback.call(this.arguments, error);
        }
    }
}