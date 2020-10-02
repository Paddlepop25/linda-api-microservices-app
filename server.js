'use strict';

require('dotenv').config();
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var app = express();
var port = process.env.PORT || 3000;
var cors = require('cors');
var shortid = require('shortid');

let uri = process.env.MONGODB_URI;
mongoose.connect(uri, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

app.use(cors());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// test api
app.get('/api/hello', (req, res) => {
  res.json({
    hi: 'We are okay'
  })  
})

// youtube Useful Programmer
// Build a schema and model to store saved URLs
let ShortURL = mongoose.model('ShortURL', new mongoose.Schema({ 
  short_url: String,
  original_url: String,
  suffix: String
}));

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.post('/api/shorturl/new', (req, res) => {
  
  let client_requested_url = req.body.url
  let suffix = shortid.generate();
  let newShortURL = suffix
  
  let newURL = new ShortURL({
    short_url: client_requested_url + "/api/shorturl/" + suffix,
    original_url: client_requested_url,
    suffix: suffix
  })
  
  newURL.save((error, doc) => {
    if (error) return console.error(error);
    res.json({
      short_url: newURL.short_url,
      original_url: newURL.original_url,
      suffix: newURL.suffix
  });
  });
}); 

app.get('/api/shorturl/:suffix', (req, res) => {
  let userGeneratedSuffix = req.params.suffix
  ShortURL
    .find({ suffix: userGeneratedSuffix })
    .then(foundUrls => {
      let urlForRedirect = foundUrls[0];
      res.redirect(urlForRedirect.original_url);
  });
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});