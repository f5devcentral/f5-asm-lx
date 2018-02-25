/**
 * A simple iControl LX extension that handles only HTTP GET
 */
var logger = require('f5-logger').getInstance();
function ImportPolicy() {}

ImportPolicy.prototype.WORKER_URI_PATH = "asm/import_policy";
ImportPolicy.prototype.isPublic = true;


ImportPolicy.prototype.onStart = function(success, error) {

    logger.info("ImportPolicy LX Started";

    var options = {
        "method": "GET",
        "hostname": "raw.githubusercontent.com",
        "port": null,
        "path": "/nashkenazi/ASM-LX/master/Policy_Example.xml",
        "headers": {
            "cache-control": "no-cache"
        }
    };

    var req = http.request(options, function (res) {

        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = Buffer.concat(chunks);
            this.state = JSON.parse(body);
        });
    });

    req.end();
    /*  logger.info("Recieve policy from SC: " + body);
      sucess();
    };


    /**
    * handle onGet HTTP request
    */

    ImportPolicy.prototype.onGet = function(restOperation) {
        restOperation.setBody(JSON.stringify( { value: "Hello World!" } ));
        this.completeRestOperation(restOperation);
    };

/**
 * handle /example HTTP request