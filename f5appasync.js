const logger = require('f5-logger').getInstance();
const request = require("/var/config/rest/iapps/InstallPolicy/node_modules/request");
const username = 'admin';
const password = 'admin';
const ver = "13.1.0";
const DEBUG = true;
const timeOut = 20000;

function InstallPolicy() {}

  InstallPolicy.prototype.WORKER_URI_PATH = "asm/install_policy";
  InstallPolicy.prototype.isPublic = true;
  InstallPolicy.prototype.onPost = function (restOperation) {
    athis = this;
    var policySCName = restOperation.getBody().policygitname;
    var policyFName = policySCName.slice(policySCName.lastIndexOf("/")+1,-4);

    if (DEBUG) {logger.info(`onPost Event: Policy Name: "${policyFName}" to pull URL from GIT: ${policySCName}`); }

    return new Promise (function(resolve, reject) {

    request (policySCName, function(err, response, body) {
        if (err) {
            logger.severe("Something went wrong with GIT Pull: \n" + err);
            reject(err);
        } else if (response.statusCode !== 200) {
            logger.severe(`Error Pull Policy: Received Status: ${response.statusCode} from GIT:\n ${response.statusMessage}`);
            reject(reponse);
        } else {
                logger.info(`Pull Policy from GIT Completed: Received Response Code: ${response.statusMessage} from GIT`);
                dataPolicy = Buffer.from(body).toString("base64");
                contentLength = dataPolicy.length;
                resolve([dataPolicy,contentLength]);
        }
      });
    })
    .then(function(result) {
      logger.info(`Starting to Transfer Policy: ${policyFName} to the BIG-IP`);

      return new Promise (function(resolve,reject) {

        const newContentRange = "0-" + (Number(result[1]) + 1) + "/" + (Number(result[1]) + 1);
        const TransferPolicyURL = "https://localhost/mgmt/tm/asm/file-transfer/uploads/" + policyFName + `?ver=${ver}`;
        const TransferPolicyOptions = {
          url: TransferPolicyURL,
          method: "POST",
          auth: {'user': username, 'pass': password},
          rejectUnauthorized: false,
          headers: {
              "Content-type": "application/json",
              "Content-Range": newContentRange, },
          json: result[0]
        };

      request(TransferPolicyOptions, function (err, response, body) {

        if (err) {
            logger.severe("Something went wrong with Transfer Policy: " + err);
            reject(err);

        } else if (response.statusCode !== 200) {
            logger.severe(`Transfer Policy Error: Recieved status code: ${response.statusCode}: \n` + JSON.stringify(body));
            reject(response);
        } else {
                logger.info(`Transfer Policy File: Received Status code: ${response.statusCode} from BIG-IP`);
            resolve (response.statusCode);
              }
        });
      });
    })
      .then(function(transferResult) {
        logger.info("Recieve Transfer Policy: " + transferResult + ",Starting to create policy");

        return new Promise(function(resolve, reject) {

          if (DEBUG) {logger.info(`Starting to Create a New Policy: ${policyFName}`); }

          const CreatePolicyOptions = {
              url: "https://localhost/mgmt/tm/asm/policies/" + `?ver=${ver}`,
              method: "POST",
              auth: {'user': username, 'pass': password},
              rejectUnauthorized: false,
              headers: { "Content-type": "application/json" },
              json: {"name": policyFName}
          };

          request (CreatePolicyOptions, function(err, response, body) {

              if (err) {
                  if (DEBUG) {logger.severe("Something went wrong with Policy Creation: " + err); }
                  reject(err);
              //Return 404 due to bug 707169
                  } else if (response.statusCode !== 201) {
                  logger.severe(`Create Policy Error: Received Status code: ${response.statusCode} from BIG-IP: \n ${body.message}`);
                  resolve(body.message);
              } else {
                      if (DEBUG) {logger.severe(`Create Policy: Received Status code: ${response.statusCode}, from BIG-IP policy ID is: ${body.id}`); }
                      resolve(body.id);
              }
          });
        });
    })
    .then(function(policyID) {
      if (DEBUG) {logger.info(`Received Policy ID: ${policyID}, Starting to Import Policy to the BIG-IP`); }
      global.policyid = policyID;
      const policyRef = "https://localhost/mgmt/tm/asm/policies/" + policyID + `?ver=${ver}`;

      if (!policyID)  {
        if (DEBUG) {logger.severe(`Import Policy Error: no Policy ID return from BIG-IP Policy Creation. Policy Already Created`); }

      } else {

          return new Promise (function(resolve, reject) {

              var ImportPolicyOptions = {
                  url: "https://localhost/mgmt/tm/asm/tasks/import-policy/" + `?ver=${ver}`,
                  method: "POST",
                  auth: {'user': username, 'pass': password},
                  rejectUnauthorized: false,
                  headers: { "content-type": "application/json" },
                  json: {
                      "filename": policyFName,
                      "policyReference": { "link": policyRef }
                  }
              };

              request(ImportPolicyOptions, function (err, response, body) {
                  if (err) {
                      if (DEBUG) {logger.severe("Something went wrong with Import Policy: " + err); }
                      reject(err);
                  } else if (response.statusCode !== 201) {
                      if (DEBUG) {logger.severe(`Import Policy File Error, Received Status code: ${response.statusCode} from BIGIP device: \n` + JSON.stringify(body)); }
                      reject(JSON.stringify(body));
                  } else {
                      if (DEBUG) {logger.info(`Import Policy File, Received Status code: ${response.statusCode} from BIGIP device with Import Id: ${JSON.stringify(body.id)}`); }
                      resolve(JSON.stringify(body.id));
                  }
              });
          });
        }
    })
    .then(function(validateIDResponse) {

        if (DEBUG) {logger.info(`Starting to Validate Policy Import on BIG-IP`); }

        global.importID = validateIDResponse.replace(/^"+|"+$/g, '');
        const ValidatePolicyURL = "https://localhost/mgmt/tm/asm/tasks/import-policy/" + importID + `?ver=${ver}`;


        return new Promise (function(resolve,reject) {

        var ValidatePolicyOptions = {
            url: ValidatePolicyURL,
            method: "GET",
            rejectUnauthorized: false,
            auth: {'user': username, 'pass': password}
          };

          setTimeout(function() {

          request(ValidatePolicyOptions, function (err, response, body) {
          var bodyResponse = JSON.parse(body);

              if (err) {
                  if (DEBUG) {logger.severe("Something went wrong with Policy Creation: " + err); }
                  reject(err);
                  return;
              } else if (response.statusCode !== 200) {
                  if (DEBUG) {logger.severe(`Validate Policy Creation Error, Received Status code: ${response.statusCode} from BIGIP device: \n ${JSON.stringify(bodyResponse)}`); }
                  reject(JSON.stringify(bodyResponse));
              } else if  (!body.search("COMPLETED")) {
                  if (DEBUG) {logger.severe(`Validate Policy Creation Error, Received Status code: ${response.statusCode} from BIGIP device: ${bodyResponse.status}`); }
                  reject(JSON.stringify(bodyResponse));
              } else {
                  if (DEBUG) {logger.info(`Validate Policy Creation Completed, Received Status code: ${response.statusCode} from BIGIP device: ${bodyResponse.status}\n`); }
                  resolve(bodyResponse.result.message);
              }
          });
        }, timeOut);
      });
    })
    .then(function(Msg) {

      var responsePostResult = {"policy_Name:": policySCName,
                                "policy_id": policyid,
                                "import_id": importID,
                                "install_result":Msg};

      if (DEBUG) { logger.info("Finished To Install Policy:\n" + JSON.stringify(responsePostResult)); }
      restOperation.setBody(responsePostResult);
      athis.completeRestOperation(restOperation);
    })
    .catch(function(err) {
      logger.info("Eror Catch: " + err);
    }
  );
};

module.exports = InstallPolicy;
