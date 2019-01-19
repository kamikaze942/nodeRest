const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const feedRoutes = require('./routes/feed');
const app = express();

const MONGODB_URI = 'mongodb+srv://root:AnoiXVrS8ImymtRj@nodetest-7shdr.mongodb.net/messages';
// const store = new MongoDBStore({
//   uri: MONGODB_URI,
//   collection: 'sessions'
// });
//app.use(bodyParser.urlencoded());  // x-www-form-urlencoded form
app.use(bodyParser.json());  // application/json

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})
app.use('/feed', feedRoutes);
mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(8080);
})
  .catch(err => {
    console.log(err);
  });


