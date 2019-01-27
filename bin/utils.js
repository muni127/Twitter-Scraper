"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.htmlCollectionToArray = function (collection) {
        return Array.prototype.slice.call(collection);
    };
    ;
    Utils.nodeListOfToArray = function (collection) {
        return Array.prototype.slice.call(collection);
    };
    ;
    /**
     * Returns the file name and extension from the file's path.
     * @param filePath path to the file's exact location inluding name and extension.
     */
    Utils.getFileName = function (filePath) {
        return filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
    };
    /**
     * Sturtured error logging to console.
     * @param error error to be logged.
     * @param callback function to execute when done.
     */
    Utils.handleError = function (error, callback) {
        console.error('!!!!! Error. An Error has occured.');
        console.error("----> " + error);
        if (callback) {
            callback.call(this.arguments, error);
        }
    };
    return Utils;
}());
exports.Utils = Utils;
