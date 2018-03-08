var logger = require('f5-logger').getInstance();
const request = require("/var/config/rest/iapps/InstallPolicy/nodejs/node_modules/request");
const util = require("/var/config/rest/iapps/InstallPolicy/nodejs/node_modules/util");
const hostname = "10.241.188.23";
const PolicyUploadName = "Policy_Example";
const url = "https://raw.githubusercontent.com/nashkenazi/LX-ASM/master/Policy_Example.xml";
var policyID = "A_Q712olFUfWmpIrm8L21A";
var filename = "Policy_Example";
var ImportPolicyURL = "https://" + hostname + "/mgmt/tm/asm/tasks/import-policy";
var TransferPolicyURL = "https://" + hostname + "/mgmt/tm/asm/file-transfer/uploads/" + PolicyUploadName;
var getName;
var dataPolicy;


function InstallPolicy() {}

InstallPolicy.prototype.WORKER_URI_PATH = "asm/install_policy";
InstallPolicy.prototype.isPublic = true;

/*
InstallPolicy.prototype.onStart = function(success, err) {

    this.logger.info("Install Policy LX is onStart");

    if (err) {
        this.logger.severe("Install Policy onStart error: something went wrong" + err);
        err();
    } else {
        this.logger.info("Install Policy onStart success");
        success();
    }
};
*/

InstallPolicy.prototype.onPost = function (restOperation) {
  logger.info("onPost Event: Policy URL to pull from GIT is: " + getName);
  var getName = restOperation.getBody().policyname;

  request(getName, function(err, response, body) {

      if (err) {
          logger.severe("Something went wrong with GIT Pull: " + err);

      } else if (response.statusCode !== 200) {
          logger.severe("Pull Policy from GIT: NOT Received Status 200OK from GIT: " + util.inspect(response));
      } else {
             logger.info("Pull Policy from GIT: Received Status 200OK from GIT");
              dataPolicy = Buffer.from(body).toString("base64");

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
                logger.info("Transfer Policy Event");
                  if (err) {
                      logger.severe("Something went wrong with Transfer Policy: " + err);

                  } else if (response.statusCode !== 200) {

                      logger.severe("Transfer Policy response code is not 200 OK: " + util.inspect(body));

                  } else {
                          logger.info("Transfer Policy File: Received Status 200 OK from F5 device: ");

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
                              logger.info("Import Policy Event");
                              if (err) {
                                  logger.severe("Something went wrong with Import Policy: " + err);

                              } else if (response.statusCode !== 200) {
                                  logger.severe("Import Policy File: NOT Received Status 200OK from F5 device" + util.inspect(body));

                              } else {

                                  logger.info("Import Policy body: " + util.inspect(body));
                                  restOperation.setBody(body);
                                  this.completeRestOperation(restOperation);
                              }

                          });
                  }
              });
      }
  });
};

InstallPolicy.prototype.getExampleState = function () {
  return {
    "value": "your_string"
  };
};

module.exports = InstallPolicy;
