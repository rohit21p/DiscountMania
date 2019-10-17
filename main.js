const http = require('http');

let body = [];
const server = http.createServer((req, res) => {
    console.log("Incoming request");
    res.setHeader('Access-Control-Allow-origin', '*');
    if(req.url=="/sign-up") {
        parseBody(req);
    }
    res.end();
});

function parseBody(req) {
    req.on('data', (data) => {
        body.push(data);
    });
    req.on('end', () => {
        body = Buffer.concat(body).toString();
        console.log(body);
    });
}

server.listen(3000);