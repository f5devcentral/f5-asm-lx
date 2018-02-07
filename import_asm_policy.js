/**
 * A simple iControl LX extension that handles only HTTP GET
 */
function ImportPolicy() {}

ImportPolicy.prototype.WORKER_URI_PATH = "asm_api/import_policy";
ImportPolicy.prototype.isPublic = true;

/**
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

var options = {
    host: '10.241.188.23',
    port: 443,
    path: '/mgmt/tm/asm/tasks/import-policy/7Da5eKxPS4yixGXa_UC_tA?ver=13.1.0',
    // These next three lines
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
};


var https = require('https');

https.get(options, (res) => {
    console.log('statusCode:', res.statusCode);
console.log('headers:', res.headers);

res.on('data', (d) => {
    process.stdout.write(d);
});

}).on('error', (e) => {
    console.error(e);
});
