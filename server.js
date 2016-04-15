
const express = require('express');
const request = require('superagent');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

var pageToken = "EAAOA7gj8NdYBAKehCNkZCoJJqDLD7Jzi3c9IIDANxEFjZAlqUZAtGTbwPS0t2krIBi6HBUyLaJ2L3AEjCizcafgZCX82USmmZB9jioSDQHZCpEtgKb6jf7dyrBGxIZB1YXYZBvyPGvPlsnKGNZB1eNBVu9BNdt6ZCKsaofiAvi3H4xeAZDZD";

var port = process.env.PORT || 1337;
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'PDK123') {
      res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong validation token');
  })

app.post('/webhook/', function (req, res) {
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    if (event.message && event.message.text) {
      text = event.message.text;
      sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200));
    }
  }
  res.sendStatus(200);
});

function sendTextMessage (sender, text) {
    sendMessage(sender, {
        text: text
    });
}
app.listen(port);

function sendMessage (sender, message) {
    request
        .post('https://graph.facebook.com/v2.6/me/messages')
        .query({access_token: pageToken})
        .send({
            recipient: {
                id: sender
            },
            message: message
        })
        .end((err, res) => {
            if (err) {
                console.log('Error sending message: ', err);
            } else if (res.body.error) {
                console.log('Error: ', res.body.error);
            }
        });
}
