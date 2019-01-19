const express = require('express');
const {body} = require('express-validator/check');
const router = express.Router();
const feedController = require('../controllers/feed');

router.get('/posts', feedController.getPosts);
//router.post('/posts', feedController.addPosts);
router.post('/post', [
            body('title').trim().isLength({min: 5}),
            body('content').trim().isLength({min: 5}),
            ],
            feedController.addPosts);

module.exports = router;