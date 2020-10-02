// server.js
// where your node app starts

// init project
require('dotenv').config();
var express = require('express');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var shortid = require('shortid');
var app = express();
var port = process.env.PORT || 3000

let uri = process.env.MONGODB_URI;
console.log(typeof uri)
mongoose.connect(uri, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  console.log('DB IS CONNECTED')
});

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/timestamp", function (req, res) {
  res.sendFile(__dirname + '/views/timestamp.html');
});

app.get("/requestheaderparser", function (req, res) {
  res.sendFile(__dirname + '/views/requestheaderparser.html');
});

app.get("/urlshortener", function (req, res) {
  res.sendFile(__dirname + '/views/urlshortener.html');
});

// testing API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({ greeting: 'hello API' });
});

// Timestamp Microservice
// no user input
app.get("/api/timestamp", (request, response) => {
  let unix = new Date().getTime();
  let utc = new Date().toUTCString();

  response.json({
    unix,
    utc
  })
})

// with user input
app.get("/api/timestamp/:date_string", (req, res) => {
  // user's input from req.params.date_string
  const { date_string } = req.params;

  // make valid date
  let date = new Date(date_string);

  // if user input is a timestamp e.g 1601506923003
  if (date.toString() === 'Invalid Date') {
    date = new Date(parseInt(date_string));
  }
  
  if (date.toString() === 'Invalid Date') {
    res.json({ error: 'Invalid Date' })
  } else {
    res.json({
      unix: date.getTime(),
      utc: date.toUTCString()
    })
  }
});

// Request Header Parser Microservice
app.get("/api/whoami", (req, res) => {
  let ipaddress = req.ip;
  let language = req.headers["accept-language"]
  let software = req.headers["user-agent"]
  res.json({
    ipaddress,
    language,
    software
  })
})

// URL Shortener Microservice
// define the schema and build a model to store saved urls
let urlSchema = new mongoose.Schema({
  original: {type: String, required: true},
  short: Number
});  

let Url = mongoose.model('HerokuUrl', urlSchema);

let responseObject = {}

app.post("/api/shorturl/new", bodyParser.urlencoded({ extended: false }), (req, res) => {
  let inputUrl = req.body['url']; 

  responseObject['original_url'] = inputUrl

  let inputShort = 1;

  Url.findOne({})
  // sort the short by descending order so you get the highest number one
    .sort({short: 'desc'})
    .exec((error, result) => {
    // no error and found document
      if(!error && result != undefined) {
        // the new url will have short incremented
        inputShort = result.short + 1
      }
      if (!error) {
        // find one, if it doesn't exist, create it, if it exists, update it
        // from mongoose: A.findOneAndUpdate(conditions, update, options, callback) // executes
        Url.findOneAndUpdate(
          // already exist
          {original: inputUrl}, // conditions
          {original: inputUrl, short: inputShort}, // update
          // new returns the newly updated/saved record. upset creates the object if it doesn't exist
          {new: true, upsert: true}, // options
          (error, savedUrl) => { // callback
            if (!error) {
              responseObject['short_url'] = savedUrl.short
              res.json(responseObject);
            }
          }
        ); 
      }
  })
})

// app.get("/api/shorturl/:suffix", (req, res) => {
//   let urlSuffix = req.params.suffix;
//   ShortUrl.findOne({ suffix: urlSuffix }).then(foundUrl => {
//     res.redirect(foundUrl.original_url);
//   });
// })

// listen for requests
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
