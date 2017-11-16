var spawn = require('child_process').spawn;
var http = require('http');
var hostname = '0.0.0.0';
var fs = require('fs');
var mysql = require('mysql');
var url = require('url');
var port = 1338;
var command;

var pushType = {
  tag_push: 'release',
  push: 'run'
};

var appMap = {
  "name": "ip"
}

var queue = [];
var flag = false;

function tryNext () {
  if (flag) {
    return;
  }
  if (queue.length) {
    flag = true;
    run(queue[0].arg, queue[0].kind);
    queue.splice(0, 1);
    setTimeout( function () {
      flag = false;
      tryNext();
    }, 1000 * 60);
  }
}


function run (arg, type) {
  var output  = [];
  command = spawn(__dirname + '/' + (pushType[type] || 'run') + '.sh', [arg]);
  command.stdout.on('data', function(chunk) {
      output.push(chunk);
  });
  command.on('close', function(code) {
      if (code === 0) {
        console.log(Buffer.concat(output).toString());
      } else {
        console.log('error: ', code);
      }
  });
}
http.createServer( function (req, res) {
  var body = "";

  if (req.url == '/') {
    req.on('data', function (chunk) {
      body += chunk;
    });
    req.on('end', function () {
      if (req.method == 'POST') {
        body = JSON.parse(body);
        //console.log(body);
        var  ref = body.ref.split('/');
        var arg = body.repository.name;
        var ip = appMap[body.repository.name] || '';
        arg += ',' + body.repository.url;
        arg +=',' + ref[ref.length - 1];
        arg += ',' + body.repository.url.match(/:(.+)\//)[1];
        //if (ip) {
          arg += ',' + ip;
          queue.push({
            arg: arg,
            kind: body.object_kind
          });
          tryNext()
        //}
        //console.log(arg);
      }
      res.writeHead(200);
      res.end('ok');
    });
  } else {
    var conn = mysql.createConnection({
       host: 'host',
       user: 'user',
       password: 'password',
       database: 'database',
       port: 3306 
    });

    var match = req.url.match(/\/log\/([^/]+)\/?(\d+)?/);
    if (match) {
      res.setHeader("Content-Type", "text/html");
      res.writeHead(200);
      var sql = 'select * from log where name=? order by id desc limit ?';
      conn.query(sql, [match[1], parseInt(match[2], 10) || 1], function (error, data) {
        var html = '<pre>';
        data.forEach( function (item, i) {
          html += '<h1>发布' + (i + 1) + '</h1>' +  item.description + '\n\n';
        });
        html += '</pre>';

        var str = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title></title>
        </head>
        <body>
        ${html}
        </body>
        </html>`;

        res.end(error ? 'error' : str);
      });
    } else {
      res.writeHead(200);
      res.end('ok');
    }
  }
}).listen(port, hostname, function () {
  console.log('Server running at http://' + hostname + ':' + port );
});

