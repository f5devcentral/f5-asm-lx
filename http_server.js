// requiring the HTTP interfaces in node
var http = require('http');

// create an http server to handle requests and response
http.createServer(function (req, res) {

// sending a response header of 200 OK
res.writeHead(200, {'Content-Type': 'text/plain'});

// print out Hello World
res.end('Hello World\n');

// use port 8080
}).listen(8080);

console.log('Server running on port 8080.');
