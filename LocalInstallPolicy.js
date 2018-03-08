process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const async = require("async");
const request = require("request");
const util = require("util");
const hostname = "10.241.188.23";
const PolicyUploadName = "Policy_Example";
const url = "https://raw.githubusercontent.com/nashkenazi/LX-ASM/master/Policy_Example.xml";
var policyID = "A_Q712olFUfWmpIrm8L21A";
var filename = "Policy_Example";
var ImportPolicyURL = "https://" + hostname + "/mgmt/tm/asm/tasks/import-policy";
var TransferPolicyURL = "https://" + hostname + "/mgmt/tm/asm/file-transfer/uploads/" + PolicyUploadName;
var getName;
var dataPolicy;

request(url, function(err, response, body) {
    console.log("Starting Request waterfall");
    if (err) {
        console.log("Something went wrong with GIT Pull: " + err)

    } else if (response.statusCode !== 200) {
        console.log("Pull Policy from GIT: NOT Received Status 200OK from GIT: " + response.statusCode);
    } else {

            console.log("Pull Policy from GIT: Received Status 200OK from GIT");
            dataPolicy = Buffer.from(body).toString("base64");
            //console.log(dataPolicy);

            var TransferPolicyOptions = {
                url: TransferPolicyURL,
                method: "POST",
                headers: {
                    "authorization": "Basic YWRtaW46YWRtaW4=",
                    "Content-type": "application/json",
                    "cache-control": "no-cache",
                    "referer": "10.241.188.28",
                    "Content-Range": "0-933285/933285", },
                json: dataPolicy
            };

            request(TransferPolicyOptions, function (err, response, body) {

                if (err) {
                    console.log("Something went wrong with Transfer Policy: " + err)

                } else if (response.statusCode !== 200) {

                    console.log("Transfer Policy response code is not 200 OK: " + util.inspect(body));

                } else {
                        console.log("Transfer Policy File: Received Status 200 OK from F5 device: ");

                        var ImportPolicyOptions = {
                            url: ImportPolicyURL,
                            method: "POST",
                            headers: {
                                "authorization": "Basic YWRtaW46YWRtaW4=",
                                "content-type": "application/json",
                                "cache-control": "no-cache",
                                "postman-token": "517ccc08-4f46-9c2f-86bb-cd84f96ae749"
                            },
                            json: {
                                "filename": filename,
                                "policyReference": { "link": "https://localhost/mgmt/tm/asm/policies/" + policyID }
                            }
                        };

                        request(ImportPolicyOptions, function (err, response, body) {
                            console.log("Starting To Import Policy");
                            if (err) {
                                console.log("Something went wrong with Import Policy: " + err)

                            } else if (response.statusCode !== 200) {
                                console.log("Import Policy File: NOT Received Status 200OK from F5 device" + util.inspect(body));

                            } else {

                                console.log("Import Policy ID is: " + body)
                            }

                        });
                }
            })
    }
});
