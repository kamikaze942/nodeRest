const express = require('express');
const {body} = require('express-validator/check');
const router = express.Router();
const feedController = require('../controllers/feed');
const isAuth = require('../middleware/isAuth');

router.get('/posts', isAuth, feedController.getPosts);
//router.post('/posts', feedController.addPosts);
router.post('/post', isAuth,
    [
        body('title').trim().isLength({min: 5}),
        body('content').trim().isLength({min: 5}),
    ],
    feedController.addPosts);


router.get('/post/:postId', isAuth, feedController.getPost);
router.get('/status', isAuth, feedController.getUserStatus);
router.put('/status', isAuth, feedController.updateUserStatus);
router.put('/post/:postId', isAuth,
    [
        body('title')
            .trim().
            isLength({min: 5}),
        body('content')
            .trim()
            .isLength({min: 5}),    
    ],
    feedController.editPost);

router.delete('/post/:postId', isAuth, feedController.deletePost);
module.exports = router;