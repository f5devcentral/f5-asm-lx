process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var logger = require('f5-logger').getInstance();
var request = require("/var/config/rest/iapps/Get_Policy/nodejs/node_modules/request");
//var request = require("request")
var hostname = "10.241.188.23";
var PolicyUploadName = "Policy_Example";
var path = "/mgmt/tm/asm/policies";
var DeviceURL = hostname + path;
var policyName = "Auction";
var policyID = "A_Q712olFUfWmpIrm8L21A";
var PolicyURL = "https://raw.githubusercontent.com/nashkenazi/LX-ASM/master/Policy_Example.xml";
var dataPolicy;
var dataTransfer;
var tranpolicyURL = "https://" + hostname + "/mgmt/tm/asm/file-transfer/uploads/" + PolicyUploadName;

function Get_Policy() {
    this.state = {};
}

Get_Policy.prototype.WORKER_URI_PATH = "asm/pull_policy";
Get_Policy.prototype.isPublic = true;

Get_Policy.prototype.onStart = function(success, error) {

    this.logger.info("Get Policy LX is onStart");

    var err = false;
    if (err) {
        this.logger.severe("Get Policy onStart error: something went wrong");
        error();
    } else {
        this.logger.info("Get Policy onStart success");
        success();
    }
};



Get_Policy.prototype.onPost = function (restOperation) {

    var getName = restOperation.getBody().policyname;
    logger.info("policy URL to pull from GIT is: " + getName)


    function pullPolicy(url) {

        return new Promise (function(resolve, reject) {

            request.get(url, function(err, resp, body) {
                if (err) {
                    reject(err);
                } else if (resp.statusCode !== 200) {
                    console.log("Pull Policy from SC was failed, status code: " + resp.statusCode + " and content is: " + body);
                    logger.info("Pull Policy from SC was failed, status code: " + resp.statusCode + " and content is: " + body);
                } else {
                    resolve(body);
                    console.log("Finish successfully pulling policy from SC");
                    logger.info("Finish successfully pulling policy from SC");
                }
            });
        });
    }


    function Get_PolicyMain() {

        var PolicyDetails = pullPolicy(getName);

        PolicyDetails.then(function (result) {

            dataPolicy = Buffer.from(result).toString('base64');
            console.log(dataPolicy);

        });

        var TransferDetails = TransferPolicy(tranpolicyURL);

        TransferDetails.then(function (result) {

            dataTransfer = result;
            console.log(dataTransfer);
            this.completeRestOperation(restOperation);
        });
    }

    Get_PolicyMain();
};

module.exports = Get_Policy;