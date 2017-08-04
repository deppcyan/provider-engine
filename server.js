const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ProviderEngine = require('./index.js')
const ZeroClientProvider = require('./zero.js')

const PORT = process.env.PORT || 9000;

const engine = ZeroClientProvider({
    getAccounts: function(){},
    rpcUrl: 'https://ropsten.infura.io/',
});

// log new blocks
engine.on('block', function(block){
    console.log('BLOCK CHANGED:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))
});

const app = express();
app.use(cors());
app.use(bodyParser.text({ type: '*/*' }));
app.use(bodyParser.json());

app.post('/', function(req, res){

    // parse request
    /*try {
        var requestObject = JSON.parse(req.body);
    } catch (err) {
        return didError(new Error('JSON parse failure - '+err.message));
    }*/

    var requestObject;

    if ( typeof req.body !== 'object' ){
        var strBody = req.body;

        if ( strBody[0] === '[') {
            strBody = strBody.substr(1, strBody.length-2);
            requestObject = JSON.parse(strBody);
        }
        else {
            requestObject = JSON.parse(strBody);
        }
    }
    else
        requestObject = req.body;

    console.log('RPC REQ:', requestObject);

    // validate request
    if (!validateRequest( requestObject ))
        return invalidRequest();

    // process request
    engine.sendAsync( requestObject, function(err, result){
        if (err) {
            didError(err);
        } else {
            console.log('RPC RES:', result);
            res.send(result);
        }
    });

    function didError(err){
        console.error(err.stack);
        res.status(500).json({ error: err.message });
    }

    function invalidRequest(){
        console.error('BAD REQUEST');
        res.status(400).json({ error: 'Not a valid request.' });
    }

});

app.listen(PORT, function(){
    console.log('ethereum rpc listening on', PORT);
    //console.log('and proxying to', RPC_NODE);
});

function validateRequest( requestObject ){
    return typeof requestObject === 'object' && !!requestObject.method;
}

