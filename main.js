const http = require('http');

const server = http.createServer((req, res) => {
    console.log("Incoming request");
    res.setHeader('Access-Control-Allow-origin', '*');
    res.end();
});

server.listen(3000);