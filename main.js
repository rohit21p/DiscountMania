const http = require('http');
const mongod = require('mongodb');

const mongoc = mongod.MongoClient;
let dbc;
let dbi;

let body = [];
const server = http.createServer((req, res) => {
    console.log("Incoming request");
    res.setHeader('Access-Control-Allow-origin', '*');
    if(req.url=="/sign-up" && req.method=="POST") {
        parseBody(req);
        req.on('end', () => {
            dbi.collection("Sign-up").insertOne(JSON.parse(body), (err) => {
                if(!err) {
                    console.log("Inserted");
                    res.write(JSON.stringify({
                        LoggedIn: true
                    }));
                } else {
                    console.log(err.errmsg);
                    res.write(JSON.stringify({
                        err: err.errmsg,
                        LoggedIn: false
                        }));
                }
                res.end();
            });
        })
    }
    else if(req.url=="/sign-in" && req.method=="POST") {
        parseBody(req);
        req.on('end', () => {
            dbi.collection("Sign-up").findOne(JSON.parse(body)).then(result=>{
                console.log(result)
                if(result!=null) {
                    res.write(JSON.stringify({LoggedIn: true}));
                } else {
                    res.write(JSON.stringify({LoggedIn: false}));
                }
                res.end();
            })
        })
    }
    else {
        res.end();
    }
    body = [];
    console.log("request end");
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


mongoc.connect("mongodb://localhost:27017", { useUnifiedTopology: true }, (err, db) => {
    dbc = db;
    dbi = dbc.db("rohit");
    dbi.createCollection("Sign-up", (error) => {
        if(!error) {
            console.log("Ready to Listen");
            server.listen(3000);
        }
        dbi.collection("Sign-up").createIndex( { "email": 1 }, { unique: true } );
    });
});
