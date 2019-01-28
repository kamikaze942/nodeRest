const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const Log = require('./models/log');

const app = express();
const path = require('path');
const multer = require('multer');
const uuidv4 = require('uuid/v4');
const morgan = require('morgan')
//const morgan = require('mongoose-morgan');
//const mongoMorgan = require('mongo-morgan')

var isWin = process.platform === "win32";
console.log(isWin);
const MONGODB_URI = 'mongodb+srv://root:AnoiXVrS8ImymtRj@nodetest-7shdr.mongodb.net/messages';


// const store = new MongoDBStore({
//   uri: MONGODB_URI,
//   collection: 'sessions'
// });
//app.use(bodyParser.urlencoded());  // x-www-form-urlencoded form
let fileStorage;
if(isWin == true){
  fileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, 'images');
    },
    filename: function(req, file, cb) {
      cb(null, uuidv4())
    }
  });
} else{
  fileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, 'images');
    },
    filename: function(req, file, cb) {
      cb(null, new Date().toISOString() + file.originalname);
    }
  });
}

const fileFilter = (req, file, cb) =>{
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
    cb(null, true);
  } else{
    cb(null, false);
  }
}

app.use(bodyParser.json());  // application/json
app.use(multer({
  storage: fileStorage, fileFilter: fileFilter
}).single('image'));
 

app.use('/images', express.static(path.join(__dirname,'images')));
const MONGODB_URI_LOGS = 'mongodb+srv://root:AnoiXVrS8ImymtRj@nodetest-7shdr.mongodb.net/logs-db';


// // EXAMPLE: save logs to logs collection
// mongoMorgan(MONGODB_URI_LOGS, ':method :status :url :user-agent', {
//   collection: 'myLogs'
// })
app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

app.use(morgan(function(tokens, req,res){
   const alog = new Log({
     url: tokens.url(req, res),
     method: tokens.method(req, res),
     status: tokens.status(req,res),
     size: tokens.res(req,res, 'content-length'),
     responseTime: tokens['response-time'](req,res),
     referrer: tokens.referrer(req,res),
     userAgent: tokens['user-agent'](req,res),
     ip: tokens['remote-addr'](req,res)
   });
   alog.save();
   return alog;
 },
 {
  skip: function (req, res) {
    return res.statusCode < 100 || !req.method || req.method == 'OPTIONS'
  }
 }
));
// ':method :status :url :user-agent :referrer :remote-addr :req[header] :res[header] :response-time[1] :date[‘web’] :res[content-length]'
// app.use(morgan({
//   collection: 'error_logger',
//   connectionString: 'mongodb://nodetest-7shdr.mongodb.net',
//   user: 'root',
//   pass: 'AnoiXVrS8ImymtRj',
//   dbName: 'applogs'
//  },
//  {
//   skip: function (req, res) {
//     return res.statusCode < 100 || !req.method || req.method == 'OPTIONS'
//   }
//  },
//  ':method :status :url :user-agent :referrer :remote-addr :req[header] :res[header] :response-time[1] :date[‘web’] :res[content-length]'
// ));
//TODO: add user id to logs, Req.session.frontier (if exists)
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500; 
  const message = error.message;
  const data = error.data;
  return res.status(status).json(
    {
        message: message,
        data: data
    })      
})

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    const server = app.listen(8080);
    const io = require('./socket').init(server);
    io.on('connection', socket=>{
      console.log('client connected')
    })

})
  .catch(err => {
    console.log(err);
  });


