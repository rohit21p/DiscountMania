const express = require('express');
const mongod = require('mongodb');
const session = require('express-session')

const app = express();
const mongoc = mongod.MongoClient;
let dbc;
let dbi;
let body = [];

app.use(session({
    secret: 'DiscountMania',
    resave: true,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
})

app.post('/sign-in', (req,res) => {
    parseBody(req);
    req.on('end', () => {
        dbi.collection("Sign-up").findOne(JSON.parse(body)).then(result=>{
            console.log(result)
            if(result!=null) {
                req.session.LoggedIn = true;
                res.write(JSON.stringify({LoggedIn: true}));
            } else {
                res.write(JSON.stringify({LoggedIn: false}));
                console.log(req.session.LoggedIn);
            }
            res.end();
        })
    });
});

app.post('/sign-up', (req,res) => {
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
});

function parseBody(req) {
    body = [];
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
            app.listen(3000);
        }
        dbi.collection("Sign-up").createIndex( { "email": 1 }, { unique: true } );
    });
});
