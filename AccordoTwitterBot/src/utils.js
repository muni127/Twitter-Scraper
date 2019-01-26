"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utils {
    static htmlCollectionToArray(collection) {
        return Array.prototype.slice.call(collection);
    }
    ;
    static nodeListOfToArray(collection) {
        return Array.prototype.slice.call(collection);
    }
    ;
    static getFileName(filePath) {
        return filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
    }
}
exports.Utils = Utils;
