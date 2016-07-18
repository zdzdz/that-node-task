'use strict';
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var collection;
var collectionName = 'Items';
var uuid = require('node-uuid');


var Db = function (key) {
    this.databasename = 'mongodb://localhost:27017/' + key;
};

Db.prototype.initialize = function (done) {

    mongoose.connect(this.databasename);
    console.log("Connected correctly to server");

    var Schema = mongoose.Schema;
    var itemSchema = new Schema({
        _id: String,
        name: String
    });

    collection = mongoose.model(collectionName, itemSchema);

    done();
};

Db.prototype.addItem = function (item) {
    var self = this;

    // if (typeof item !== 'object') {
    //     return done('Invalid item');
    // }
    // if (typeof done !== 'function') {
    //     return done('Callback not supplied');
    // }
    /*
     Get the data, push the new item and writeItems it back.
     */
    item._id = item._id || uuid.v1(); //use the id supplied by the user or generate a new one.

    return collection.findOne({"_id": item._id})
        .exec()
        .then(function (foundItem) {
            if (!foundItem) {
                self.writeItems(item);
                return item;
            }

            return 'Invalid item id. If you supply an id for the item it must be unique.';
        })
        .catch(function (err) {
            return err;
        });
};

/**
 * Gets all items in the database. Returns the items.
 */
Db.prototype.getAll = function () {
    return this.readItems();
};

/**
 * Gets an item by id. Returns the item or an error if the item wasn't found.
 * @param id
 */
Db.prototype.getById = function (id) {
    return collection.findOne({"_id": id})
        .exec()
        .then(function (item) {
            if (!item) {
                return 'Item not found';
            }

            return item;
        })
        .catch(function (err) {
            return err;
        });
};

/**
 * Updates an item by id. Returns the new state of the item or an error if the item wasn't found.
 * @param id
 * @param item - item that will update the existing item. Id is preserved.
 */
Db.prototype.updateById = function (id, item) {
    var query = {"_id": id};
    item._id = id;

    return collection.findOneAndUpdate(query, item)
        .exec()
        .then(function(foundItem){
            if(!foundItem){
                return 'Item not found'
            }

            return foundItem;
        })
        .catch(function(err){
            return err;
        });
};

/**
 * Deletes an item by id. Returns the item that was deleted or an error if it wasn't found.
 * @param id
 */
Db.prototype.deleteById = function (id) {
    var query = {"_id": id};

    return collection.findOneAndRemove(query)
        .exec()
        .then(function(foundItem){
            if(!foundItem){
                return 'Item not found';
            }

            return foundItem;
        })
        .catch(function(err){
            return err;
        });
};

/**
 * Deletes all items in the database. Returns the count of the items that were deleted.

 */
Db.prototype.deleteAll = function () {
    var self = this;

    return this.readItems()
        .then(function(data){
            var count = data.length;

            self.clear();
            return count;
        })
        .catch(function(err){
            return err;
        });
};

/**
 * Writes the item to the database.
 * @param item
 */
Db.prototype.writeItems = function (item) {
    var newItem = new collection({
        _id: item._id,
        name: item.name
    });

    newItem.save(function(err){
        return err;
    });
};

/**
 * Reads the data array from the database.
 */
Db.prototype.readItems = function () {
    return collection.find({}).exec()
        .then(function (data) {
            return data;
        })
        .catch(function (err) {
            return err;
        });
};

Db.prototype.clear = function () {
    collection.remove({}, function(err){
        return err;
    })
};

module.exports = Db;
