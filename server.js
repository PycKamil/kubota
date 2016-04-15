
const express = require('express');
const request = require('superagent');
const bodyParser = require('body-parser');
const builder = require('botbuilder');

const app = express();
app.use(bodyParser.json());

var pageToken = "EAAOA7gj8NdYBAKehCNkZCoJJqDLD7Jzi3c9IIDANxEFjZAlqUZAtGTbwPS0t2krIBi6HBUyLaJ2L3AEjCizcafgZCX82USmmZB9jioSDQHZCpEtgKb6jf7dyrBGxIZB1YXYZBvyPGvPlsnKGNZB1eNBVu9BNdt6ZCKsaofiAvi3H4xeAZDZD";

var port = process.env.PORT || 1337;

var dialog = new builder.LuisDialog('https://api.projectoxford.ai/luis/v1/application?id=e252a847-190c-4341-b4d2-105acc75f898&subscription-key=5349414a86334241b0bfe3254648fa52');

dialog.onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."));
dialog.on('showMe', [
    function (session, args, next) {
        var task = builder.EntityRecognizer.findEntity(args.entities, 'photo');
        if (!task) {
            builder.Prompts.text(session, "What would you like to call the task?");
        } else {
            next({ response: task.entity });
        }
    },
    function (session, results) {
        if (results.response) {
            // ... save task
            session.send("Ok... Added the '%s' task.", results.response);
        } else {
            session.send("Ok");
        }
    }
]);
var botDict = {};

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'PDK123') {
      res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong validation token');
  })

  app.post('/webhook', (req, res) => {
      var messagingEvents = req.body.entry[0].messaging;

      messagingEvents.forEach((event) => {
        var sender = event.sender.id;

        var bot;
        if (botDict[sender]) {
          bot = botDict[sender];
        } else {
          bot = new builder.TextBot();
          bot.add('/', dialog);
          bot.on('reply', function (message) {
              sendTextMessage(sender, message.text);
          });
          botDict[sender] = bot
        }
        console.log('TEST' + event)
          if (event.postback) {
              var text = JSON.stringify(event.postback).substring(0, 200);
              console.log('Payback: ', event.postback);

              bot.processMessage({ text: text})
          } else if (event.message && event.message.text) {
              var text = event.message.text.trim().substring(0, 200);
              bot.processMessage({ text: text})
              sendGenericMessage(sender)
          }
      });

      res.status(200).send('OK')
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

function sendGenericMessage (sender) {
    sendMessage(sender, {
        attachment: {
            type: 'template',
            payload: {
                template_type: 'generic',
                elements: [{
                    title: 'First card',
                    subtitle: 'Element #1 of an hscroll',
                    image_url: 'http://messengerdemo.parseapp.com/img/rift.png',
                    buttons: [{
                        type: 'web_url',
                        url: 'https://www.messenger.com/',
                        title: 'Web url'
                    }, {
                        type: 'postback',
                        title: 'Postback',
                        payload: 'Payload for first element in a generic bubble'
                    }]
                }, {
                    title: 'Second card',
                    subtitle: 'Element #2 of an hscroll',
                    image_url: 'http://messengerdemo.parseapp.com/img/gearvr.png',
                    buttons: [{
                        type: 'postback',
                        title: 'Postback',
                        payload: 'Payload for second element in a generic bubble'
                    }]
                }]
            }
        }
    });
}
