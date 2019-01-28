
const io = require('../socket');
const {validationResult} = require('express-validator/check');
const fs = require('fs');
const path = require('path');
const Post = require('../models/post');
const User = require('../models/user');
var isWin = process.platform === "win32";

exports.getPosts = async (req, res, next) =>{
    const currentPage = req.query.page || 1;
    const perPage = 2;
    try {
        const totalItems = await Post.find().countDocuments()
        const posts = await Post.find()
            .populate('creator')
            .sort({createdAt: -1})
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        res.status(200).json({
            message: 'posts fetched',
            posts: posts,
            totalItems: totalItems
        });
    } catch(err){
        if(!err.statusCode){
            const error = new Error('there was a problem');
            error.statusCode = 500;
        }
        throw error;
    }
}

exports.getPost = async (req, res, next) =>{
    const postId = req.params.postId;
    try{
        const post = await Post.findById(postId);
        if (!post){
            const error = new Error('Could not find post');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            message: 'Post fetched',
            post: post
        })                
    } catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }

};

exports.addPosts = async(req, res, next) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;

    }

    if(!req.file){
        const error = new Error('no image provided')
        error.statusCode = 422;
        throw error;
    }
    let imageUrl = req.file.path;
    
    if(isWin){
        imageUrl = imageUrl.replace("\\" ,"/");
    }
    
    const title = req.body.title;
    const content = req.body.content;
    
    const post = new Post({
        title: title, 
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });
    try {
      await post.save();
      const user = await User.findById(req.userId);
      user.posts.push(post);
      await user.save();
      io.getIO().emit('posts', 
        {
            action: 'create', 
            post: { ...post._doc, creator: { _id: req.userId, name: user.name }}
        });
      res.status(201).json({
        message: 'Post created successfully!',
        post: post,
        creator: {_id: user._id, name: user.name}
      })
    } catch(error) {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    };

};

exports.getUserStatus = async(req, res, next) =>{
  try{
    const user = await User.findById(req.userId);
    res.status(200).json({status: user.status})
  } catch(err){
    if(!err.statusCode){
        err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateUserStatus = async(req, res, next) =>{
    const status = req.body.status;
    try {
      const user = await User.findById(req.userId);
      if(user.status !== status){
        user.status = status;
      }
      const result = await user.save();
      console.log(result);
      res.status(201).json({message: 'user updated', userId: result._id})
    } catch(err){
        if(!err.statusCode){
        err.statusCode = 500;
        }
        next(err);
    }
}

exports.editPost = async(req, res, next) =>{
    const errors = validationResult(req);
    const postId = req.params.postId;
    
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
        
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    console.log(imageUrl);

    if(req.file){
        imageUrl = req.file.path;
        if(isWin){
            imageUrl = imageUrl.replace("\\" ,"/");
        }        
    }
    console.log(imageUrl);
    if(!imageUrl){
        const error = new Error ('no file picked');
        error.statusCode = 422;
        throw error;
    }
    try {
        const updatedPost = await Post.findById(postId).populate('creator');
        if(!updatedPost){
            const error = new Error('post not found')
            error.statusCode = 404;
            throw error;
        }
        if(updatedPost.creator._id.toString() !== req.userId){
            const error = new Error('not authorized to edit this post');
            error.statusCode = 401;
            throw error;
        }
        if(imageUrl !== updatedPost.imageUrl){
            clearImage(updatedPost.imageUrl)
        }
        updatedPost.title = title;
        updatedPost.content = content;
        updatedPost.imageUrl = imageUrl;
        const result = await updatedPost.save();
        io.getIO().emit('posts', 
        {
            action: 'update', 
            post: result
        });
        res.status(200).json({message: 'updated', post: result})
    } catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }

};

exports.deletePost = async(req, res, next) =>{
    const postId = req.params.postId;
    try{
      const result = await Post.findById(postId);
      if(!result){
        const error = new Error('post not found')
        error.statusCode = 404;
        throw error;
      }
      //check if logged in user
      if(result.creator.toString() !== req.userId){
        const error = new Error('not authorized to edit this post');
        error.statusCode = 401;
        throw error;
      }         

      clearImage(result.imageUrl);
      await Post.findByIdAndRemove(postId);
      const user = await User.findById(req.userId);
      user.posts.pull(postId);
      await user.save();
      io.getIO().emit('posts', 
      {
          action: 'delete', 
          post: postId
      });

      res.status(200).json({message: 'deleted post'})
    } catch(err){
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    }
    
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};
