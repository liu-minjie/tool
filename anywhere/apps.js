#!/usr/bin/env node


/*
Switcheroo Redirector

openssl genrsa -out privatekey.pem 1024
openssl req -new -key privatekey.pem -out certrequest.csr
openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
*/

var os = require('os');
var fs = require('fs');
var https = require('https');
var connect = require('connect');
var serveStatic = require('serve-static');
var serveIndex = require('serve-index');

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var argv = require("minimist")(process.argv.slice(2), {
  alias: {
    'silent': 's',
    'port': 'p',
    'hostname': 'h',
    'dir': 'd'
  },
  string: ['port', 'hostname'],
  boolean: 'silent',
  'default': {
    'port': 8000,
    'dir': process.cwd()
  }
});

if (argv.help) {
  console.log("Usage:");
  console.log("  anywhere --help // print help information");
  console.log("  anywhere // 8000 as default port, current folder as root");
  console.log("  anywhere 8888 // 8888 as port");
  console.log("  anywhere -p 8989 // 8989 as port");
  console.log("  anywhere -s // don't open browser");
  console.log("  anywhere -h localhost // localhost as hostname");
  console.log("  anywhere -d /home // /home as root");
  process.exit(0);
}

var openURL = function (url) {
  switch (process.platform) {
    case "darwin":
      exec('open ' + url);
      break;
    case "win32":
      exec('start ' + url);
      break;
    default:
      spawn('xdg-open', [url]);
    // I use `spawn` since `exec` fails on my machine (Linux i386).
    // I heard that `exec` has memory limitation of buffer size of 512k.
    // http://stackoverflow.com/a/16099450/222893
    // But I am not sure if this memory limit causes the failure of `exec`.
    // `xdg-open` is specified in freedesktop standard, so it should work on
    // Linux, *BSD, solaris, etc.
  }
};

/**
 * Get ip(v4) address
 * @return {String} the ipv4 address or 'localhost'
 */
var getIPAddress = function () {
  var ifaces = os.networkInterfaces();
  var ip = '';
  for (var dev in ifaces) {
    ifaces[dev].forEach(function (details) {
      if (ip === '' && details.family === 'IPv4' && !details.internal) {
        ip = details.address;
        return;
      }
    });
  }
  return ip || "127.0.0.1";
};

var app = connect();
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});
app.use(serveStatic(argv.dir, {'index': ['index.html']}));
app.use(serveIndex(argv.dir, {'icons': true}));
// anywhere 8888
// anywhere -p 8989
// anywhere 8888 -s // silent
// anywhere -h localhost
// anywhere -d /home
var port = argv._[0] || argv.port;
var hostname = argv.hostname || getIPAddress();

var pk = fs.readFileSync('./privatekey.pem');
var pc = fs.readFileSync('./certificate.pem');
var opts = { key: pk, cert: pc };

https.createServer(opts, app).listen(port, function () {
  // 忽略80端口
  port = (port != '443' ? ':' + port : '');
  var url = "https://" + hostname + port + '/';
  console.log("Running at " + url);
  if (!argv.silent) {
    openURL(url);
  }
})
