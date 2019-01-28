const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const logSchema = new Schema({
    url:{
        type: String,
        required: true
    },
    method:{
        type: String,
        required: true
    },
    status:{
        type: Number,
        required: true        
    },
    size: {
        type: Number
    },
    responseTime: {
        type: Number
    },
    referrer:{
        type: String,
    },
    userAgent:{
        type: String,
        required: true
    },    
    ip:{
        type: String,
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    requestHeaders:{
        type: String,
    },
    responseHeaders:{
        type: String,
    }
}, {timestamps: true}
);

module.exports = mongoose.model('Log', logSchema)