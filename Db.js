'use strict';
var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
var collectionName = 'Items';
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
        item._id = item._id || uuid.v1(); //use the id supplied by the user or generate a new one.
        if(findById(item._id, data)) {
            return done('Invalid item id. If you supply an id for the item it must be unique.', item);
        }

        self.writeItems(item, function(err) {
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
    var self = this;

    this.readItems(function(err, data) {
        if(err){
            return done(err);
        }

        var currentItem = findById(id, data);
        if(!currentItem) {
            return done('Item not found');
        }

        item._id = currentItem._id;

        self.updateItem(item, currentItem, function(err) {
            if(err){
                return done(err);
            }
            done(null, item);
        })
    });
};

/**
 * Deletes an item by id. Callbacks with the item that was deleted or an error if it wasn't found.
 * @param id
 * @param done
 */
Db.prototype.deleteById = function(id, done){
    var self = this;

    this.readItems(function(err, data) {
        if(err){
            return done(err);
        }

        var item = findById(id, data);
        if(!item) {
            return done('Item not found');
        }

        self.removeItem(id, function(err) {
            if(err){
                return done(err);
            }
            done(null, item);
        })
    });
};

/**
 * Deletes all items in the database. Callbacks with the count of the items that were deleted.
 * @param done - done(err, count)
 */
Db.prototype.deleteAll = function(done){
    var self = this;

    this.readItems(function(err, data) {
        if(err){
            return done(err);
        }

        var count = data.length;

        self.clear(function(err){
            if(err){
                return done(err);
            }
            done(null, count);
        })
    });
};

/**
 * Writes the items array to the database.
 * @param item
 * @param done
 */
Db.prototype.writeItems = function(item, done) {
    MongoClient.connect(this.databasename, function (err, db) {
        var collection = db.collection(collectionName);
        collection.insert(item, function (err) {
            assert.equal(err, null);
            if (err){
                db.close();
                done(err);
            } else{
                db.close();
                done();
            }
        })
    });
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
                db.close();
                return done(err);
            }

            done(null, data);
            db.close();
        });
    });
};

/**
 * Updates an item in the database.
 * @param item
 * @param currentItem
 * @param done
 */
Db.prototype.updateItem = function(item, currentItem, done) {
    MongoClient.connect(this.databasename, function(err, db) {
        var collection = db.collection(collectionName);
        collection.updateOne(currentItem, {$set: item}, {upsert: false}, function(err, result) {
            assert.equal(err, null);
            if (err){
                db.close();
                done(err);
            } else{
                db.close();
                done();
            }
        });
    });
};

/**
 * Removes an item in the database.
 * @param id
 * @param done
 */
Db.prototype.removeItem = function(id, done) {
    MongoClient.connect(this.databasename, function(err, db) {
        var collection = db.collection(collectionName);
        collection.remove({"_id": {$eq: id}}, {justOne: true}, function(err) {
            assert.equal(err, null);
            if (err){
                db.close();
                done(err);
            } else{
                db.close();
                done();
            }
        });
    });
};

Db.prototype.clear = function(done){
    MongoClient.connect(this.databasename, function(err, db) {
        db.dropDatabase(function(err) {
            assert.equal(err, null);
            if (err){
                db.close();
                done(err);
            } else{
                db.close();
                done();
            }
        });
    });
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
