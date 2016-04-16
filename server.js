
const express = require('express');
const request = require('superagent');
const bodyParser = require('body-parser');
const builder = require('botbuilder');

const app = express();
app.use(bodyParser.json());

var pageToken = "EAAOA7gj8NdYBAKehCNkZCoJJqDLD7Jzi3c9IIDANxEFjZAlqUZAtGTbwPS0t2krIBi6HBUyLaJ2L3AEjCizcafgZCX82USmmZB9jioSDQHZCpEtgKb6jf7dyrBGxIZB1YXYZBvyPGvPlsnKGNZB1eNBVu9BNdt6ZCKsaofiAvi3H4xeAZDZD";

var port = process.env.PORT || 1337;

var siateczka = false

var dialog = new builder.LuisDialog('https://api.projectoxford.ai/luis/v1/application?id=e252a847-190c-4341-b4d2-105acc75f898&subscription-key=5349414a86334241b0bfe3254648fa52');
var popularItems = [];

dialog.onDefault(builder.DialogAction.send("Hm, nie do końca rozumiem… Możesz sformułować to nieco prościej?"));
dialog.on('showMe', [
    function (session, args, next) {
      message = new builder.Message()
      siateczka = true
      session.send(message);
      session.send("Obraz „Helenka z wazonem” został namalowany przez Stanisława Wyspiańskiego w 1902 roku. Obecnie można go podziwiać w Muzeum Narodowym w Krakowie.");
    },
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
            if (siateczka) {
              siateczka = false
              sendImageMessage(sender, "https://upload.wikimedia.org/wikipedia/commons/4/4f/Dziewczynka_z_wazonem_z_kwiatami,1902.jpg");
              sendTextMessage(sender, "Obraz „Helenka z wazonem” został namalowany przez Stanisława Wyspiańskiego w 1902 roku. Obecnie można go podziwiać w Muzeum Narodowym w Krakowie.");
            } else if (message.elements && message.elements.lenght > 0) {
              sendGenericMessage(sender, message.elements);
            } else {
              sendTextMessage(sender, message.text);
            }
          });


          // Install First Run middleware and dialog
          bot.use(function (session, next) {
              if (!session.userData.firstRun) {
                  session.userData.firstRun = true;
                  session.beginDialog('/firstRun');
              } else {
                  next();
              }
          });
          bot.add('/firstRun', [
              function (session) {
                getUserData(session, sender);
              },
              function (session, results) {
                  // We'll save the prompts result and return control to main through
                  // a call to replaceDialog(). We need to use replaceDialog() because
                  // we intercepted the original call to main and we want to remove the
                  // /firstRun dialog from the callstack. If we called endDialog() here
                  // the conversation would end since the /firstRun dialog is the only
                  // dialog on the stack.
                  session.userData.name = results.response;
                  session.replaceDialog('/');
              }
          ]);

          botDict[sender] = bot
        }
          if (event.postback) {
              //var text = JSON.stringify(event.postback).substring(0, 200);
              //console.log('Payback: ', text);
              popularItems.push(event.postback.payload)
              sendTextMessage(sender, "Świetnie! Przypomnę Ci o tym wydarzeniu dzień wcześniej.")
          } else if (event.message && event.message.text) {
              var text = event.message.text.trim().substring(0, 200);
              bot.processMessage({ text: text})
          }
      });

      res.status(200).send('OK')
  });

function sendTextMessage (sender, text) {
    sendMessage(sender, {
        text: text
    });
}

function sendImageMessage (sender, image) {
  sendMessage(sender, {
      attachment: {
          type: 'image',
          payload: {
              url: image
          }
      }
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

function sendGenericMessage (sender, elements) {
    sendMessage(sender, {
        attachment: {
            type: 'template',
            payload: {
                template_type: 'generic',
                elements: elements
            }
        }
    });
}

dialog.on('goTo', [
    function (session, args, next) {

        var task = builder.EntityRecognizer.findEntity(args.entities, 'kids');
        if (task) {
          downloadOffersForCategory(session, 1);
        }

        var task = builder.EntityRecognizer.findEntity(args.entities, 'esk');
        if (task) {
          downloadOffersForCategory(session, 69);
        }

        var task = builder.EntityRecognizer.findEntity(args.entities, 'outdoors');
        if (task) {
          downloadOffersForCategory(session, 109);
        }

        var task = builder.EntityRecognizer.findEntity(args.entities, 'seniors');
        if (task) {
          downloadOffersForCategory(session, 111);
        }

        var task = builder.EntityRecognizer.findEntity(args.entities, 'everyone');
        if (task) {
          downloadOffersForCategory(session, 287);
        }

        var task = builder.EntityRecognizer.findEntity(args.entities, 'adults');
        if (task) {
          downloadOffersForCategory(session, 253);
        }
    }
]);

function getUserData(session, userID) {
  var request = require('request');

    request('https://graph.facebook.com/v2.6/'+userID+'?fields=first_name,last_name,profile_pic&access_token='+pageToken, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          obj = JSON.parse(body)
          console.log(obj);
          session.send('Witaj, ' + obj.first_name + '! Nazywam się Kubot i będę Twoim źródłem informacji o kulturze. W czym mogę Ci pomóc?')
          session.userData.name = obj.first_name;
          session.replaceDialog('/');
      }
    })
}

function downloadOffersForCategory(session, category) {
  var request = require('request');
  request('http://go.wroclaw.pl/api/v1.0/offers?key=1008954996011385882032213270462822894601&&category-id=' + category.toString(), function (error, response, body) {
    if (!error && response.statusCode == 200) {
      obj = JSON.parse(body)
      items = obj.items
      // session.send(items[0].title)
      message = new builder.Message()
      message.setText(session, "Zobacz moje propozycje")
      message.elements = []

      for (var i = 0; i < items.length && i < 10; i++) {
        var item = items[i];
        console.log(popularItems);
        console.log(item.id);
        if (popularItems.indexOf( (item.id.toString())) > -1) {
          session.send("W ostatnim czasie popularnością cieszy się " + item.title +".");
        }
          message.elements.push({
              title: item.title,
              subtitle: item.longDescription.replace(/<\/?[^>]+(>|$)/g, ""),
              image_url: item.mainImage.standard,
              buttons: [
                {
                    type: 'postback',
                    title: 'Wybieram się',
                    payload: item.id
                },

                {
                  type: 'web_url',
                  title: 'Więcej informacji',
                  url: item.pageLink
              }]
            });
      }

      session.send(message);
    }
  })
}
