var express = require('express');
var app = express();

var http = require('http')
var port = process.env.PORT || 1337;
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'PDK123') {
      res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong validation token');
  })
app.listen(port);
