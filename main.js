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
    if(req.headers.origin != undefined)
        res.setHeader('Access-Control-Allow-origin', req.headers.origin);
    else
        res.setHeader('Access-Control-Allow-origin', '*'); 
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
                req.session.LoggedIn = true;
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


app.get('/isLoggedIn', (req,res) => {
    parseBody(req);
    req.on('end', () => {
        res.send({
            LoggedIn: req.session.LoggedIn
        })
    });
});

app.get('/logout', (req, res) => {
    req.session.LoggedIn = false;
    res.send({
        LoggedIn: req.session.LoggedIn
    })
})

app.post('/create', (req, res) => {
    parseBody(req)
    console.log(body);
    dbi.createCollection("POSTS", () => {
        dbi.collection("POSTS").insertOne(JSON.parse(body), (err) => {
            if(err) {
                console.log(err);
                res.json({
                    success: false
                });
            } else {
                res.json({
                    success: true
                });
            }
        })
    })
})

app.post('/posts', (req, res) => {
    parseBody(req)
    dbi.createCollection("POSTS", () => {
        dbi.collection("POSTS").find(JSON.parse(body), (err,result) => {
            if(err) {
                res.json({
                    success: false
                });
            } else {
                result.toArray((err, data)=>{
                    console.log("data", data);
                    res.json({
                        result: data,
                        success: true
                    });
                })
            }
        })
    })
})

app.post('/post', (req, res) => {
    parseBody(req)
    dbi.createCollection("POSTS", () => {
        dbi.collection("POSTS").find({
            _id: mongod.ObjectID(JSON.parse(body)._id)
        }, (err,result) => {
            if(err) {
                res.json({
                    success: false
                });
            } else {
                result.toArray((err, data)=>{
                    console.log("data", data);
                    res.json({
                        result: data,
                        success: true
                    });
                })
            }
        })
    })
})

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


// paytm code starts here
const https = require('https');
const qs = require('querystring');
const checksum_lib = require('./paytm/checksum.js');
var PaytmConfig = {
	mid: "qXdnRD55315996681574",
	key: "rQtPXO#40RYd1g_B",
	website: "WEBSTAGING"
}

app.post('/setup', (req,res) => {
    let amount = '';
    let body = []
    req.on('data', (data)=> {
        body.push(data);
    })
    req.on('end', ()=>{
        body = Buffer.concat(body).toString();
        amount = +(JSON.parse(body).amount);
        amount = amount.toFixed(2);
        req.session.amount = amount;
        res.end();
    })
})

app.get('/paytm', (req,res) => {
    var params 						= {};
    params['MID'] 					= PaytmConfig.mid;
    params['WEBSITE']				= PaytmConfig.website;
    params['CHANNEL_ID']			= 'WEB';
    params['INDUSTRY_TYPE_ID']	= 'Retail';
    params['ORDER_ID']			= 'TEST_'  + new Date().getTime();
    params['CUST_ID'] 			= 'Customer001';
    params['TXN_AMOUNT']			= req.session.amount;
    params['CALLBACK_URL']		= 'http://localhost:'+3000+'/callback';
    params['EMAIL']				= 'abc@mailinator.com';
    params['MOBILE_NO']			= req.session.mobile || '9669872071';

    checksum_lib.genchecksum(params, PaytmConfig.key, function (err, checksum) {

        var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
        // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
        
        var form_fields = "";
        for(var x in params){
            form_fields += "<input type='hidden' name='"+x+"' value='"+params[x]+"' >";
        }
        form_fields += "<input type='hidden' name='CHECKSUMHASH' value='"+checksum+"' >";

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="'+txn_url+'" name="f1">'+form_fields+'</form><script type="text/javascript">document.f1.submit();</script></body></html>');
        res.end();
    });
})

app.post('/callback', (req,res) => {
    let body = '';
	        
    req.on('data', function (data) {
        body += data;
    });

    req.on('end', function () {
        var html = "";
        var post_data = qs.parse(body);

        // verify the checksum
        var checksumhash = post_data.CHECKSUMHASH;
        // delete post_data.CHECKSUMHASH;
        var result = checksum_lib.verifychecksum(post_data, PaytmConfig.key, checksumhash);
        console.log("Checksum Result => ", result, "\n");



        // Send Server-to-Server request to verify Order Status
        var params = {"MID": PaytmConfig.mid, "ORDERID": post_data.ORDERID};

        checksum_lib.genchecksum(params, PaytmConfig.key, function (err, checksum) {

            params.CHECKSUMHASH = checksum;
            post_data = 'JsonData='+JSON.stringify(params);

            var options = {
                hostname: 'securegw-stage.paytm.in', // for staging
                // hostname: 'securegw.paytm.in', // for production
                port: 443,
                path: '/merchant-status/getTxnStatus',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': post_data.length
                }
            };


            // Set up the request
            var response = "";
            var post_req = https.request(options, function(post_res) {
                post_res.on('data', function (chunk) {
                    response += chunk;
                });

                post_res.on('end', function(){
                    response = JSON.parse(response.TXNID);
                    console.log('S2S Response: ', response, "\n");
                    
                    html = "<script> window.close() </script>";

                    req.session.status = {
                        id: response.TXNID,
                        status: response.STATUS
                    } 
                    console.log(req.session);

                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(html);
                    res.end();
                });
            });

            // post the data
            post_req.write(post_data);
            post_req.end();
        });
    });
})
