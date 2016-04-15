
const express = require('express');
const request = require('superagent');
const bodyParser = require('body-parser');
const builder = require('botbuilder');

const app = express();
app.use(bodyParser.json());

var pageToken = "EAAOA7gj8NdYBAKehCNkZCoJJqDLD7Jzi3c9IIDANxEFjZAlqUZAtGTbwPS0t2krIBi6HBUyLaJ2L3AEjCizcafgZCX82USmmZB9jioSDQHZCpEtgKb6jf7dyrBGxIZB1YXYZBvyPGvPlsnKGNZB1eNBVu9BNdt6ZCKsaofiAvi3H4xeAZDZD";

var port = process.env.PORT || 1337;

var dialog = new builder.LuisDialog('https://api.projectoxford.ai/luis/v1/application?id=e252a847-190c-4341-b4d2-105acc75f898&subscri...')
var bot = new builder.TextBot();
bot.add('/', function (session) {

    //respond with user's message
    session.send("You said " + session.message.text);
});

// dialog.onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."));
// dialog.on('showMe', [
//     function (session, args, next) {
//         var task = builder.EntityRecognizer.findEntity(args.entities, 'photo');
//         if (!task) {
//             builder.Prompts.text(session, "What would you like to call the task?");
//         } else {
//             next({ response: task.entity });
//         }
//     },
//     function (session, results) {
//         if (results.response) {
//             // ... save task
//             session.send("Ok... Added the '%s' task.", results.response);
//         } else {
//             session.send("Ok");
//         }
//     }
// ]);

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

          if (event.postback) {
              var text = JSON.stringify(event.postback).substring(0, 200);
              bot.processMessage(text)
              sendTextMessage(sender, 'Postback received: ' + text);
          } else if (event.message && event.message.text) {
              var text = event.message.text.trim().substring(0, 200);
              bot.processMessage({ text: text})
            //   bot.use(function (session, next) {
            //       sendTextMessage(sender, 'Text received ' + session.message);
            //        next();
            //
            // });
            bot.on('reply', function (message) {
                sendTextMessage(sender, 'Text received ' + message.text);
            });
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
