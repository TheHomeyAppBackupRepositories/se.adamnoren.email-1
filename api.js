const Imap = require('imap');
const Homey = require('homey');

module.exports = {

  async testConnection({ homey, body }) {

    return await new Promise(async (resolve, reject) => {

      console.log('Triggered testConnection')

      function openInbox(cb) {
        imap.openBox('INBOX', true, cb);
      }

      try {
        console.log('Try')
        var imap = new Imap({
          user: body.user,
          password: body.password,
          host: body.host,
          port: body.port,
          tls: body.tls,
          keepalive: false,
          tlsOptions: {
            rejectUnauthorized: false
          },
          autotls: 'always'
        });

        imap.once('ready', function () {
          console.log('ready')
          openInbox(function (err, box) {
            console.log('openInbox')
            if (err) {
              console.log('err 1')
              console.log(err)
              imap.end();
              resolve({
                success: false,
                error: err
              })
            } else {
              console.log('success')
              imap.end();
              resolve({
                success: true,
                error: null
              })
            }
          })
        })

        imap.on('error', function (err) {
          console.log('err 2')
          console.log(err.message)
          resolve({
            success: false,
            error: err.message
          });
        })

        imap.connect();

      } catch (err) {
        console.log('err 3')
        console.log(err)
        resolve({
          success: false,
          error: err
        });
      }
    })
  }
};