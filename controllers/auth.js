const User = require('../models/user');
const {validationResult} = require('express-validator/check');
const fs = require('fs');
const path = require('path');
const Post = require('../models/post');
var isWin = process.platform === "win32";
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async(req, res, next) =>{
    const errors = validationResult(req);
    
    if(!errors.isEmpty()){
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        error.data = errors.array()
        throw error;
        
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    try{
        const hashedPw = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            password: hashedPw,
            name: name
        });
        const result = await user.save();
        res.status(201).json({message: 'user created', userId: result._id})
    } catch(err){
        if(!err.statusCode){
        err.statusCode = 500;
        }
        next(err);        
    }
};

exports.login = async(req,res, next) =>{
    const email = req.body.email;
    const password = req.body.password;
    //let loadedUser;
    try{
      const loadedUser = await User.findOne({email: email})
      if(!loadedUser){
        const error = new Error('no user found associated with this email');
        error.statusCode = 401;
        throw error;
      }
      const isEqual = await bcrypt.compare(password, loadedUser.password);
      if(!isEqual){
        const error = new Error('invalid password');
        error.statusCode = 401;
        throw error;                
      }
      const token =jwt.sign(
        {
        email: loadedUser.email, 
        userId: loadedUser._id.toString()
        }, 
        'AlexIsASecret', 
        {expiresIn: '1h'}
      );
      res.status(200).json({token: token, userId: loadedUser._id.toString()})
    } catch(err){
        if(!err.statusCode){
          err.statusCode = 500;
        }
        next(err);
    }
};