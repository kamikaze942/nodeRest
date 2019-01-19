const {validationResult} = require('express-validator/check');
const Post = require('../models/post');

exports.getPosts = (req, res, next) =>{
    res.status(200).json({
        posts: [
            {
                title: 'First Post', 
                content: 'This is the first post!',
                imageUrl: 'images/funnyCat.jpg',
                creator:{
                    name: "Bob"
                },
                createdAt: new Date(),
                _id: 12
            }]
    });
}

exports.addPosts = (req, res, next) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json(
            {
                message: 'Validation failed, entered data is incorrect', 
                errors: errors.array()
            })
    }
    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({
        title: title, 
        content: content,
        imageUrl: 'images/funnyCat.jpg',
        creator:{
            name: "mark"
        }
    });
    post.save().then(result=>{
        console.log(result);
        res.status(201).json({
            message: 'Post created successfully!',
            post: result
        })        
    }).catch(err=>{
        console.log(err);
    });
    //create post in db

};