'use strict';

const Homey = require('homey');
const Imap = require('imap');
const inspect = require('util').inspect;
const simpleParser = require('mailparser').simpleParser;

class MyApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  onInit() {
    this.log('MyApp has been initialized');
    this.start();
    this.monitorSettings();
    
  }

  onSetting(res) {
    this.log('onSetting triggered')
  }

  monitorSettings() {
    this.homey.settings.on('set', (settings) => {
      console.log('settings set', settings)
      this.start();
    })
  }

  start = () => {

    console.log(this.homey.settings.get('username'));

    const emailRecievedTrigger = this.homey.flow.getTriggerCard('email_recieved');

    let homey = this.homey;

    let allData = {};

    try {

      console.log(this.homey.settings.get('tls'))

      var imap = new Imap({
        user: this.homey.settings.get('username'),
        password: this.homey.settings.get('password'),
        host: this.homey.settings.get('host'),
        port: this.homey.settings.get('port'),
        tls: this.homey.settings.get('tls'),
        keepalive: true,
        tlsOptions: {
          rejectUnauthorized: false
        },
        autotls: 'always'
      });

      console.log(imap)

      function openInbox(cb) {
        imap.openBox('INBOX', true, cb);
      }

      function triggerFlow(tokens) {
        emailRecievedTrigger.trigger(tokens)
          .then(res => console.log(res))
          .catch(err => console.log(err))
      }

      imap.once('ready', function() {
        openInbox(function(err, box) {
          if (err) throw err;
          imap.on('mail', () => {
            var f = imap.seq.fetch(box.messages.total + ':*', { bodies: ['HEADER.FIELDS (TO FROM SUBJECT)','TEXT'] });
            f.on('message', function(msg, seqno) {
              msg.on('body', function(stream, info) {
                simpleParser(stream).then(mail => {
                  if (mail.subject) {
                    allData['email_subject'] = mail.subject;
                  }
                  if (mail.from) {
                    allData['from_email'] = mail.from.value[0].address;
                    allData['from_name'] = mail.from.value[0].name;
                  }
                  if(mail.text) {
                    allData['email_content'] = mail.text;
                  }
                  if (Object.keys(allData).length > 3) {
                    triggerFlow(allData)
                  }
                })
                stream.once('end', function() {
                  console.log('Finished 1');
                });
              });
              msg.once('attributes', function(attrs) {
                //console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
              });
              msg.once('end', function() {
                console.log('Finished 2');
              });
            });
            f.once('error', function(err) {
              console.log('Fetch error: ' + err);
            });
            f.once('end', function() {
              console.log('Done fetching all messages!');
            });
          })
        });
      });
       
      imap.once('error', function(err) {
        console.log('Error 1')
        console.log(err);
        homey.notifications.createNotification({
          excerpt: err.textCode
        })
        .then(res => console.log(res))
        .catch(err => console.log(err))
      });
       
      imap.once('end', function() {
        console.log('Connection ended');
      });
       
      imap.connect();

    } catch (err) {
      console.log('Error 2')
      console.log(err)
    }
  }

  onSettingsChanged = (data) => {
    console.log('Settings changed: ', data)
  }

}

module.exports = MyApp;