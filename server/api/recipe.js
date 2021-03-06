var express = require('express');
var router = express.Router();
var fs = require('graceful-fs');
var Util = require('../lib/util');
var db = require('firebase').database();

var recipesRef = db.ref('recipes');

router.post('/submit', (req, res) => {
    var recipe = recipesRef.push();

    if (req.body.photo) {
        var filepath = '/recipes/' + recipe.key;
        Util.uploadPhoto(req.body.photo, filepath);
        req.body.photo = filepath;
    } else {
        req.body.photo = '/recipes/default.png';
    }
    req.body.uid = recipe.key;
    recipe.setWithPriority(req.body, 0 - Date.now())
        .then(result => Util.responseHandler(res, true, "", req.body))
        .catch(error => Util.responseHandler(res, false, error.message))
});

router.get('/get', (req, res) => {
    recipesRef.once('value', (snapshot) => {
        if (snapshot.val() == null) {
            Util.responseHandler(res, false);
            return;
        } else {
            var recipes = [];
            for (var key in snapshot.val()) {
                if (snapshot.val().hasOwnProperty(key)) {
                    var element = snapshot.val()[key];
                    recipes.push(element);
                }
            }
            Util.responseHandler(res, true, '', recipes);
        }
    })
})

router.get('/get/:uid', (req, res) => {
    recipesRef.orderByKey().equalTo(req.params.uid).once('value', (snapshot) => {
        if (snapshot.val() == null) {
            Util.responseHandler(res, false);
            return;
        } else {
            var recipes = [];
            for (var key in snapshot.val()) {
                if (snapshot.val().hasOwnProperty(key)) {
                    var element = snapshot.val()[key];
                    recipes.push(element);
                }
            }
            Util.responseHandler(res, true, '', recipes);
        }
    })
})

router.post('/search', (req, res) => {
    var keyword = new RegExp(req.body.keyword, "i");

    recipesRef.once('value', (snapshot) => {
        var recipes = snapshot.val();
        var result = [];
        for (var key in recipes) {
            if (recipes.hasOwnProperty(key)) {
                var recipe = recipes[key];
                if (recipe.name.search(keyword) != -1)
                    result.push(recipe)
                else {
                    if (recipe.brewer.search(keyword) != -1)
                        result.push(recipe);
                }
            }
        }
        Util.responseHandler(res, true, "Success", result);
    })
})

router.get('/get-beer-types', (req, res) => {

    recipesRef.once('value', (snapshot) => {
        var recipes = snapshot.val();
        var result = [];
        for (var key in recipes) {
            if (recipes.hasOwnProperty(key)) {
                var recipe = recipes[key];
            }
        }
        Util.responseHandler(res, true, "Success", result);
    })
})

router.post('/submit-review', (req, res) => {
    var recipeId = req.body.recipeId;

    var review = {
        username: req.body.writerName,
        userId: req.body.writerId,
        note: req.body.review,
        date: new Date()
    }

    db.ref('recipes/' + recipeId).once('value', (snapshot) => {
        var recipe = snapshot.val();
        if (!recipe.reviews)
            recipe.reviews = [];
        recipe.reviews.unshift(review);
        db.ref('recipes/' + recipeId).update({reviews: recipe.reviews});
        Util.responseHandler(res, true);
    });
})

router.get('/:uid/reviews', (req, res) => {
    var recipeId = req.params.uid;

    db.ref('recipes/' + recipeId).once('value', (snapshot) => {
        var reviews = snapshot.val().reviews;
        if(!reviews) reviews = [];
        Util.responseHandler(res, true, '', reviews);
    });
})

module.exports = router;