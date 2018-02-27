logger = require('f5-logger').getInstance();
var WorkerName = "Import Policy";
function ImportPolicy() {}

ImportPolicy.prototype.WORKER_URI_PATH = "asm/import_policy";
ImportPolicy.prototype.isPublic = true;

ImportPolicy.prototype.onStart = function(success, error) {

    var err = false;
    if (err) {
        this.logger.severe("ImportPolicy onStart error: something went wrong");
        error();
    } else {
        this.logger.info("ImportPolicy onStart success");
        success();
    }
};


ImportPolicy.prototype.onPost = function(restOperation) {
    var newData = restOperation.getBody().SomeData;
    this.logger.info("SomeData is:"+newData);

    var http = require("https");

    var options = {
        "method": "POST",
        "hostname": "10.241.188.23",
        "port": null,
        "path": "/mgmt/tm/asm/policies",
        "headers": {
            "authorization": "Basic YWRtaW46YWRtaW4=",
            "content-type": "application/json",
            "cache-control": "no-cache",
            "postman-token": "517ccc08-4f46-9c2f-86bb-cd84f96ae749"
        }
    };

    var req = http.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
        });
    });

    req.write(JSON.stringify({ name: 'PolicyLXProfile' }));
    req.end();
};

/**
 * handle /example HTTP request
 */
ImportPolicy.prototype.getExampleState = function () {
    return {
        "value": "your_string"
    };
};

module.exports = ImportPolicy;

