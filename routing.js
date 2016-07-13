/*global db*/
'use strict';

function setupRoutes(app) {

    /* Get single item from the database. Response should be in the following format
     {
     Result: (Object: Item with the specified id)
     }

     If the item doest not exist then an Error must be returned to the user.
     {
     Error: 'Item not found'
     }
     with a status code of 404.*/
    app.get('/db/:id', function (req, res, next) {
        var id = req.params.id;

        db.getById(id)
            .then(function (item) {
                res.status(200).send({
                    Result: item
                });
            }, function (err) {
                if (err === 'Item not found') {
                    res.status(404).send({
                        Error: err
                    });
                }
            });
    });

    /* Get all items in the database. Response should be in the following format
     {
     Result: (Array of objects: all items in the database)
     } */
    app.get('/db', function (req, res, next) {

        db.getAll()
            .then(function (items) {
                res.status(200).send({
                    Result: items
                })
            }, function (err) {
                next(err);
            });

    });

    /*Creates the item. Response should be in the following format:
     {
     Result: (Object: item that was created)
     }
     with a status code of 201.

     If another item exists with the same id we want to return:
     {
     Error: <errorMessage>
     }
     with a status code of 400.*/
    app.post('/db', function (req, res, next) {
        var item = req.body;

        db.addItem(item)
            .then(function (result) {
                if (result === 'Invalid item id. If you supply an id for the item it must be unique.') {
                    res.status(400).send({
                        Error: 'Invalid item id ' + item._id
                        //Error: 'Item with the same id already exists'
                    })
                } else {
                    res.status(201).send({
                        Result: result
                    })
                }
            }, function (err) {
                next(err);
            });
    });

    app.post('/db/:id', function (req, res, next) {
        var id = req.params.id;
        var item = req.body;

        db.updateById(id, item)
            .then(function (result) {
                if (result === 'Item not found') {
                    res.status(404).send({
                        Error: result
                    });
                } else {
                    res.status(200).send({
                        Result: result
                    });
                }
            }, function (err) {
                next(err);
            });
        /*
         Updates the item with the specified id. Response should be in the following format:
         {
         Result: (Object: New state of the item with the specified id)
         }
         If the item doest not exist then an error must be returned to the user.
         {
         Error: 'Item not found'
         }
         with a status code of 404.
         */
    });

    app.delete('/db', function (req, res, next) {
        db.deleteAll()
            .then(function (count) {
                res.status(200).send({
                    Result: count
                });
            }, function (err) {
                next(err);
            });
        /*
         Delete all items in the database. Response should contain the count of the delete items like so:
         {
         Result: (Number: count of the items)
         }
         */
    });

    app.delete('/db/:id', function (req, res, next) {
        var id = req.params.id;


        db.deleteById(id)
            .then(function (result) {
                if (result === 'Item not found') {
                    res.status(404).send({
                        Error: result
                    });
                } else {
                    res.status(200).send({
                        Result: result
                    });
                }
            }, function (err) {
                next(err);
            });
        /*
         Delete single item from the database by id. Response should contain the item that was deleted like so:
         {
         Result: (Object: item that was deleted)
         }
         If the item doest not exist then an error must be returned to the user.
         {
         Error: 'Item not found'
         }
         with a status code of 404.
         */
    });
}

module.exports = {
    setup: setupRoutes
};