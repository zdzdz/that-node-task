'use strict';
var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
var collectionName = 'Items';
var fs = require('fs');
var uuid = require('node-uuid');



var Db = function(key) {
    this.databasename = 'mongodb://localhost:27017/' + key;
};

Db.prototype.initialize = function(done){

    MongoClient.connect(this.databasename,function(err, db){
        assert.equal(null, err);
        console.log("Connected correctly to server");

        if (err){
            done(err);
        } else{
            db.createCollection(collectionName, { capped: false});
            db.close();
            done();
        }
    });
};

Db.prototype.addItem = function(item, done){
    var self = this;

    if(typeof item !== 'object') {
        return done('Invalid item');
    }
    if(typeof done !== 'function') {
        return done('Callback not supplied');
    }
    /*
        Get the data, push the new item and writeItems it back.
     */
    this.readItems(function(err, data) {
        if(err){
            return done(err);
        }
        item.id = item.id || uuid.v1(); //use the id supplied by the user or generate a new one.
        if(findById(item.id, data)) {
            return done('Invalid item id. If you supply an id for the item it must be unique.');
        }
        data.push(item);
        self.writeItems(data, function(err) {
            if(err){
                return done(err);
            }
            done(null, item);
        })
    });
};

/**
 * Gets all items in the database. Callbacks with the items.
 * @param done
 */
Db.prototype.getAll = function(done){
    this.readItems(function(err, items){
        done(err, items);
    })
};

/**
 * Gets an item by id. Callbacks with the item or an error if the item wasn't found.
 * @param id
 * @param done
 */
Db.prototype.getById = function(id, done) {
    this.readItems(function(err, data) {
        if(err){
            return done(err);
        }
        var item = findById(id, data);
        if(!item) {
            done('Item not found');
        }
        done(null, item);
    });
};

/**
 * Updates an item by id. Callbacks with the new state of the item or an error if the item wasn't found.
 * @param id
 * @param item - item that will update the existing item. Id is preserved.
 * @param done
 */
Db.prototype.updateById = function(id, item, done){
    //See Db.prototype.getById
    done('Method updateById in Db.js not implemented');
};

/**
 * Deletes an item by id. Callbacks with the item that was deleted or an error if it wasn't found.
 * @param id
 * @param done
 */
Db.prototype.deleteById = function(id, done){
    done('Method deleteById in Db.js not implemented');
};

/**
 * Deletes all items in the database. Callbacks with the count of the items that were deleted.
 * @param done - done(err, count)
 */
Db.prototype.deleteAll = function(done){
    done('Method deleteAll in Db.js not implemented');
};

/**
 * Writes the items array to the database.
 * @param items
 * @param done
 */
Db.prototype.writeItems = function(items, done) {
    fs.writeFile(this.filename, JSON.stringify({
        data: items
    }), {
        flag: 'w+'
    }, done);
};

/**
 * Reads the data array from the database.
 * @param done
 */
Db.prototype.readItems = function(done) {
    MongoClient.connect(this.databasename, function(err, db) {
        var collection = db.collection(collectionName);
        collection.find().toArray(function (err, data) {
            if (err) {
                return done(err);
            }

            done(null, data);
            db.close();
        });
    });
};

Db.prototype.clear = function(done){
    fs.writeFile(this.filename, JSON.stringify({
        data: []
    }), {
        flag: 'w+'
    }, done);
};

/**
 * Returns the item from the data array (if found) that has the specified id. Returns null if the item is not found.
 * @param id - id of the item to find
 * @param data - array that contains items with ids to go through.
 * @returns {*}
 */
var findById = function(id, data) {
    for(var i = 0;i < data.length;i++){
        if(data[i]._id === id){
            return data[i];
        }
    }
    return null;
};

module.exports = Db;
