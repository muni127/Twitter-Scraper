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
    Utils.getFileName = function (filePath) {
        return filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
    };
    /**
     * Sturtured error logging to console
     * @param err error to be logged
     */
    Utils.handleError = function (err) {
        console.error('!!!!! Error. An Error has occured.');
        console.error("----> " + err);
    };
    return Utils;
}());
exports.Utils = Utils;
