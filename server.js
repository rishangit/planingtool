//dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const session = require('express-session')
var nStatic = require('node-static');
var fileServer = new nStatic.Server('./img');


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, './dist')));
app.use(express.static(path.join(__dirname, './dist/gulity')));
var hour = 36000000;
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: "secret",
  secureProxy: true,
  cookie: { expires: new Date(Date.now() + hour ) }
}))

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// get API routes
const api = require('./server/routes/api');
app.use('/api', api);


app.use("/img", (req, res) => {
  fileServer.serve(req, res);
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/dist/gulity/index.html'));
});

const port = process.env.PORT || '3005';
app.set('port', port);

const server = http.createServer(app);

server.listen(port, () => console.log(`API running on localhost:${port}`));