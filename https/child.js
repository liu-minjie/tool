const http = require('http')
const str = process.argv[2];

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(str);
}).listen(8002);