//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var logger = require('f5-logger').getInstance();
var request = require("/var/config/rest/iapps/PullPolicy/nodejs/node_modules/request");
var async = require("/var/config/rest/iapps/PullPolicy/nodejs/node_modules/async");

//var request = require("request")
var hostname = "10.241.188.23";
var PolicyUploadName = "Policy_Example";
var path = "/mgmt/tm/asm/policies";
var DeviceURL = hostname + path;
var policyName = "Auction";
var policyID = "A_Q712olFUfWmpIrm8L21A";
//var PolicyURL = "https://raw.githubusercontent.com/nashkenazi/LX-ASM/master/Policy_Example.xml";
var dataPolicy;
var dataToPolicy;
var dataTransfer;
var getName;
var tranpolicyURL = "https://" + hostname + "/mgmt/tm/asm/file-transfer/uploads/" + PolicyUploadName;


function PullPolicy() {
    this.state = {};
}

PullPolicy.prototype.WORKER_URI_PATH = "asm/pull_policy";
PullPolicy.prototype.isPublic = true;

PullPolicy.prototype.onStart = function(success, error) {

    this.logger.info("Pull Policy LX is onStart");

    var err = false;
    if (err) {
        this.logger.severe("Pull Policy onStart error: something went wrong");
        error();
    } else {
        this.logger.info("Pull Policy onStart success");
        success();
    }
};

PullPolicy.prototype.onPost = function (restOperation) {

    var getName = restOperation.getBody().policyname;
    logger.info("policy URL to pull from GIT is: " + getName);


    function pullPolicy(url) {

        logger.info("Starting pullPolicy, URL to pull from: " + url);

        return new Promise (function (resolve, reject) {

            request.get(url, function (err, resp,body) {

                if (err) {
                    logger.info("Pull Policy from GIT failed with error" + err);
                    reject(err);
                } else if (resp.statusCode !== 200) {
                    //console.log("Pull Policy from SC was failed, status code: " + resp.statusCode + " and content is: " + body);
                    logger.info("Pull Policy from SC was failed, status code: " + resp.statusCode + " and content is: " + body);
                } else {
                    resolve(body);
                    //console.log("Finish successfully pulling policy from SC");
                    logger.info("Finish successfully pulling policy from SC");
                }
            });
        });
    }

    function TransferPolicy(url, dataToPolicy) {

        var options = {
            url: url,
            method: "POST",
            headers: {
                "authorization": "Basic YWRtaW46YWRtaW4=",
                "Content-type": "application/json",
                "cache-control": "no-cache",
                "referer": "10.241.188.28",
                "Content-Range": "0-933294/933294",
                "isBase64": "true",
                "policyReference": '{"link": "https://localhost/mgmt/tm/asm/policies/A_Q712olFUfWmpIrm8L21A"}'
            },
            json: {
                "file": dataToPolicy
            }
        };

        return new Promise (function (resolve, reject) {

            request(options, function (error, response, body) {

                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            })
        });
    }


    function PullPolicyMain() {
        logger.info("Starting PullPolicyMain");

        var PolicyDetails = pullPolicy(getName);

        PolicyDetails.then(function (result) {
            logger.info("Response from GIT: " + result);
            dataPolicy = Buffer.from(result).toString('base64');
            logger.info("Policy base64 is: " + dataPolicy);
            //console.log(dataPolicy);
            dataToPolicy = dataPolicy;

            var TransferDetails = TransferPolicy(tranpolicyURL, dataToPolicy);

            TransferDetails.then(function (result) {

                dataTransfer = result;
                logger.info(dataTransfer);
                //console.log(dataTransfer);
                this.compvareRestOperation(restOperation);
            });


        });


    }

    PullPolicyMain();
};

