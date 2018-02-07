/**
 * A simple iControl LX extension that handles only HTTP GET
 */
function ImportPolicy() {}

ImportPolicy.prototype.WORKER_URI_PATH = "asm/import_policy";
ImportPolicy.prototype.isPublic = true;
// c1
/*
 * handle onGet HTTP request
 */
ImportPolicy.prototype.onGet = function(restOperation) {
    restOperation.setBody(JSON.stringify( { value: "Starting to Import" } ));
    this.completeRestOperation(restOperation);
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
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var http = require("https");

var options = {
    "method": "POST",
    "hostname": "10.241.188.23",
    "port": null,
    "path": "/mgmt/tm/asm/tasks/import-policy",
    "headers": {
        "authorization": "Basic YWRtaW46YWRtaW4=",
        "content-type": "application/json",
        "cache-control": "no-cache",
        "postman-token": "33bdc421-9a51-5b2e-5e8c-4187f55b36ee"
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

req.write(JSON.stringify({ filename: '/var/ts/var/rest/Common_Sharepoint_Template_Edited2.xml',
    isBase64: 'false',
    policyReference: { link: 'https://localhost/mgmt/tm/asm/policies/A_Q712olFUfWmpIrm8L21A' } }));
req.end();
