export class Utils {
    static htmlCollectionToArray<T>(collection: HTMLCollection): T[] {
        return Array.prototype.slice.call(collection);
    };

    static nodeListOfToArray<T extends Node>(collection: NodeListOf<T>): T[] {
        return Array.prototype.slice.call(collection);
    };

    static getFileName(filePath: string): string {
        return filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
    }
}