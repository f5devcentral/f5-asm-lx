const logger = require('f5-logger').getInstance();
const request = require("/var/config/rest/iapps/InstallPolicy/nodejs/node_modules/request");
const request = require("request");
const async = require("async");

const hostname = "10.241.188.23";
const authorization = "Basic YWRtaW46YWRtaW4=";
const url = "https://raw.githubusercontent.com/nashkenazi/LX-ASM/master/Policy_Example.xml";
const PolicyUploadName = "Policy_Example";
const TransferPolicyURL = "https://" + hostname + "/mgmt/tm/asm/file-transfer/uploads/" + PolicyUploadName;
const Pname = "DeclartiveAPIPolicy";
const createDeviceURL = "https://" + hostname + "/mgmt/tm/asm/policies";
const createData = {name: Pname};
const ImportPolicyURL = "https://" + hostname + "/mgmt/tm/asm/tasks/import-policy";
const timeOut = 30000

InstallPolicy.prototype.onStart = function(success, error) {
    var err = false;
    if (err) {
        logger.severe("Install Policy onStart error: something went wrong");
        error();
    } else {
        logger.info("Install Policy onStart success");
        success();
    }
};

function InstallPolicy() {}

InstallPolicy.prototype.WORKER_URI_PATH = "asm/install_policy";
InstallPolicy.prototype.isPublic = true;

InstallPolicy.prototype.onPost = function (restOperation) {

  var policySCName = restOperation.getBody().policyname;
  var hostName = restOperation.getUri().host;

  logger.info(`onPost Event: Policy URL to pull from GIT: ${policySCName}`);
  logger.info(`onPost Event: hostname is: ${hostName}`);

  request(policySCName, function(err, response, body) {

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
                              var URL = request.url;

                              if (err) {
                                  logger.severe("Something went wrong with Import Policy: " + err);

                              } else if (response.statusCode !== 201) {
                                  logger.severe("Import Policy File: NOT Received Status 201 OK from F5 device" + util.inspect(body));

                              } else {
                                  logger.info("Import Policy: Import body recieved: \n" + body);
                                }
                        });
                  }
              });
        }
    });
    restOperation.setBody(this.state);
    this.completeRestOperation(restOperation);
};

/*
InstallPolicy.prototype.getExampleState = function () {
  return {
    "value": "your_string"
  };
};
*/

module.exports = InstallPolicy;
