  var logger = require('f5-logger').getInstance(),
      request = require("../node_modules/request"),
      username = 'admin',
      password = 'admin',
      bigipCredentials = {'user': username, 'pass': password},
      ver = "13.1.0", //ASM Version
      DEBUG = true,
      timeOut = 25000;

function InstallPolicy() {}

InstallPolicy.prototype.WORKER_URI_PATH = "/shared/workers/install_policy";
InstallPolicy.prototype.isPublic = true;
InstallPolicy.prototype.onPost = function (restOperation) {

    var athis = this;
    global.policySCName = restOperation.getBody().policyvcsname;
    global.policyFName = policySCName.slice(policySCName.lastIndexOf("/")+1,-4);

    if (DEBUG) {logger.info(`Starting Post Policy Event. VCS URL: ${policySCName}`); }

    pullPolicy(policySCName).then(function(result) {
      return transferPolicy(result);
    }).then(function(result) {
      return createPolicy(result);
    }).then(function(result){
      return importPolicy(result);
    }).then(function(result){
      return validatePolicy(result);
    }).then(function(Msg) {

        var responsePostResult = {"policy_vcsame": policySCName,
                                  "policy_id": policyid,
                                  "import_id": importID,
                                  "create_result":Msg
                                };

        restOperation.setBody(responsePostResult);
        athis.completeRestOperation(restOperation);

        if (DEBUG) { logger.info("Completed Post Policy Event. Install Policy Result:\n" + JSON.stringify(responsePostResult)); }

    }).catch(function(err) {
      logger.severe("Error Catch: " + err);

      var responseErrPostResult = {"create_error__result":err};
      restOperation.setBody(responseErrPostResult);
      athis.completeRestOperation(restOperation);
    });
};

InstallPolicy.prototype.onDelete = function (restOperation) {

  var dthis = this,
      delPolicyFName = restOperation.getBody().policyname;

  if (DEBUG) {logger.info(`Starting Delete Policy Event. Policy Name: ${delPolicyFName}`); }

    getPolicyId(delPolicyFName).then(function(result) {
      return deletePolicy(result).then(function(Msg) {

          var responseDeleteResult = { "policy_name": delPolicyFName,
                                       "policy_deleted_id":Msg };

          restOperation.setBody(responseDeleteResult);
          dthis.completeRestOperation(restOperation);

          if (DEBUG) { logger.info("Completed Delete Policy Event. Delete Result:\n" + JSON.stringify(responseDeleteResult)); }

      }).catch(function(err) {
            logger.severe("Error Catch: " + err);

            var responseErrDeleteResult = { "delete_error_result":err };

            restOperation.setBody(responseErrDeleteResult);
            dthis.completeRestOperation(restOperation);
      });
    });
};

// function to pull XML policy from source control and save it to memeory as base64 file

var pullPolicy = function(policySCName) {
  if (DEBUG) { logger.info(`Starting pullPolicy function. Pull Policy ${policySCName} from VCS `); }

  return new Promise (function(resolve, reject) {

      request (policySCName, function(err, response, body) {

          if (err) {
              logger.severe(`Something went wrong with with VCS Policy Pull Request:\n${err}`);
              reject(err);
          } else if (response.statusCode !== 200) {
              logger.severe(`Pull Policy Error: Received Status: ${response.statusCode} from VCS:\n${response.statusMessage}`);
              reject(response);
          } else {
                if (DEBUG) { logger.info(`Pull Policy from VCS Completed: Received Response Code: ${response.statusCode} ${response.statusMessage} from VCS`); }
                  var dataPolicy = Buffer.from(body).toString("base64");
                  var contentLength = dataPolicy.length;
                  resolve([dataPolicy,contentLength]);
          }
      });
  });
};

// ========================================================
// function to transfer the policy and upload to ASM device
// =============================================

var transferPolicy = function(Apolicy) {

    if (DEBUG) { logger.info(`Starting transferPolicy function. Transfer Policy: ${policyFName} to BIG-IP`); }

    return new Promise (function(resolve,reject) {

        var newContentRange = "0-" + (Number(Apolicy[1]) + 1) + "/" + (Number(Apolicy[1]) + 1);
        var TransferPolicyURL = `https://localhost/mgmt/tm/asm/file-transfer/uploads/${policyFName}?ver=${ver}`;

        var TransferPolicyOptions = {
            url: TransferPolicyURL,
            method: "POST",
            auth: bigipCredentials,
            rejectUnauthorized: false,
            headers: {
                "Content-type": "application/json",
                "Content-Range": newContentRange, },
            json: Apolicy[0]
        };

        request(TransferPolicyOptions, function (err, response, body) {

            if (err) {
                logger.severe("Something went wrong with Transfer Policy Request:\n" + err);
                reject(err);
            } else if (response.statusCode !== 200) {
                logger.severe(`Transfer Policy Error: Recieved status code: ${response.statusCode}:\n` + JSON.stringify(body));
                reject(response);
            } else {
                if (DEBUG) { logger.info(`Transfer Policy File Completed: Received Status code: ${response.statusCode} from BIG-IP`); }
                resolve (response.statusCode);
            }
        });
    });
};

// function to create new ASM policy based on the imported file name

var createPolicy = function(transferResult) {

    if (DEBUG) { logger.info(`Starting createPolicy function. Create Policy Name: ${policyFName}`); }

    return new Promise(function(resolve, reject) {

        var CreatePolicyOptions = {
            url: `https://localhost/mgmt/tm/asm/policies`,
            method: "POST",
            auth: bigipCredentials,
            rejectUnauthorized: false,
            headers: { "Content-type": "application/json" },
            json: {"name": policyFName}
          };

        request (CreatePolicyOptions, function(err, response, body) {

            if (err) {
              if (DEBUG) {logger.severe("Something went wrong with Create Policy Request:\n" + err); }
              reject(err);
            } else if (response.statusCode !== 201) {
              logger.severe(`Create Policy Error: Received Status code: ${response.statusCode} from BIG-IP`);
              reject(body.message);
            } else {
                  if (DEBUG) {logger.info(`Create Policy Completed: Received Status code ${response.statusCode} from BIG-IP, policy ID is: ${JSON.stringify(body.id)}`); }
                  resolve(body.id);
            }
        });
    });
};

// Delete Policy Function

var deletePolicy = function(delpolicyid) {

    if (DEBUG) { logger.info(`Starting deletePolicy function. Delete Policy Name: ${delpolicyid}`); }

    return new Promise(function(resolve, reject) {

        var DeletePolicyOptions = {
            url: `https://localhost/mgmt/tm/asm/policies/${delpolicyid}?ver=${ver}`,
            method: "DELETE",
            auth: bigipCredentials,
            rejectUnauthorized: false,
            headers: { "Content-type": "application/json" }
        };

        request (DeletePolicyOptions, function(err, response, body) {

            var resDelBody = JSON.parse(body);

            if (err) {
              if (DEBUG) {logger.severe("Something went wrong with Delete Policy:\n " + err); }
                reject(err);
            } else if (response.statusCode !== 201) {
              logger.severe(typeof body)
                logger.severe(`Delete Policy Error: Received Status code: ${response.statusCode} from BIG-IP:\n${body}`);
                reject(resDelBody.message);
            } else {
                  if (DEBUG) {logger.info(`Delete Policy ID ${resDelBody.id} Completed: Received Status code ${response.statusCode} from BIG-IP`); }
                  resolve(resDelBody.id);
            }
        });
    });
};


// function to import the imported policy into the new policy that just created

var importPolicy = function(policyID) {

    if (DEBUG) {logger.info(`Starting importPolicy function. Import Policy into the BIG-IP Created Policy ID: ${policyID} `); }

    //global.policyid = policyID.slice(1,-1);
    global.policyid = policyID;
    var policyRef = `https://localhost/mgmt/tm/asm/policies/${policyid}?ver=${ver}`;

    if (!policyid)  {
        if (DEBUG) {logger.severe(`Import Policy Error: No Policy ID return from BIG-IP Policy Creation. No matching record was found`); }

    } else {

        return new Promise (function(resolve, reject) {

            var ImportPolicyOptions = {
                url: `https://localhost/mgmt/tm/asm/tasks/import-policy?ver=${ver}`,
                method: "POST",
                auth: bigipCredentials,
                rejectUnauthorized: false,
                headers: { "content-type": "application/json" },
                json: {
                    "filename": policyFName,
                    "policyReference": { "link": policyRef }
                }
            };

            request(ImportPolicyOptions, function (err, response, body) {

                if (err) {
                    if (DEBUG) {logger.severe(`Something went wrong with Policy Request:\n ${err}`); }
                    reject(err);
                } else if (response.statusCode !== 201) {
                    if (DEBUG) {logger.severe(`Import Policy Error, Received Status code: ${response.statusCode} from BIGIP device:\n${JSON.stringify(body)}`); }
                    reject(JSON.stringify(body));
                } else {
                    if (DEBUG) {logger.info(`Import Policy File Completed, Received Status code: ${response.statusCode} from BIGIP device with import Id: ${JSON.stringify(body.id)}`); }
                    resolve(JSON.stringify(body.id));
                }
            });
        });
    }
};

// function to validate the import result and response it back to the caller

var validatePolicy = function(validateIDResponse) {

    if (DEBUG) {logger.info(`Starting validatePolicy function. Validate Policy Import ID ${validateIDResponse}`); }

    global.importID = validateIDResponse.replace(/^"+|"+$/g, '');
    var ValidatePolicyURL = `https://localhost/mgmt/tm/asm/tasks/import-policy/${importID}?ver=${ver}`;

    return new Promise (function(resolve,reject) {

        var ValidatePolicyOptions = {
            url: ValidatePolicyURL,
            method: "GET",
            rejectUnauthorized: false,
            auth: bigipCredentials
          };

        setTimeout(function() {

            request(ValidatePolicyOptions, function (err, response, body) {

                var bodyResponse = JSON.parse(body);

                if (err) {
                  if (DEBUG) {logger.severe(`Something went wrong with Policy Validation Request:\n ${err}`); }
                  reject(err);

                } else if (response.statusCode !== 200) {
                  if (DEBUG) {logger.severe(`Validate Policy Import Error, Received Status code: ${response.statusCode} from BIGIP device:\n${JSON.stringify(bodyResponse)}`); }
                  reject(JSON.stringify(bodyResponse));
                } else if  (!body.search("COMPLETED")) {
                  if (DEBUG) {logger.severe(`Validate Policy Creation Error, Received Status code: ${response.statusCode} from BIGIP device: ${bodyResponse.status}`); }
                  reject(JSON.stringify(bodyResponse));
                } else {
                  if (DEBUG) {logger.info(`Validate Policy Creation Completed, Received Status code: ${response.statusCode} from BIGIP device: ${bodyResponse.status}`); }
                  resolve(bodyResponse.result.message);
                }
            });
      }, timeOut);
  });
};

var getPolicyId = function(policyname) {

    if (DEBUG) {logger.info(`Starting getPolicyId function. Get Policy Id by Name: ${policyname} `); }

    var getPolicyFound = true;
    var getPolicyList = `https://localhost/mgmt/tm/asm/policies?ver=${ver}`;

    return new Promise (function(resolve,reject) {

        var getPolicyOptions = {
              url: getPolicyList,
              method: "GET",
              rejectUnauthorized: false,
              auth: bigipCredentials
            };

        request(getPolicyOptions, function (err, response, body) {

            var bodyResponse = JSON.parse(body);

            if (err) {
              if (DEBUG) {logger.severe(`Something went wrong with Get Policy Id Request:\n ${err}`); }
              reject(err);

            } else if (response.statusCode !== 200) {
              if (DEBUG) {logger.severe(`Get Policy Id by Name Error, Received Status code: ${response.statusCode} from BIGIP device:\n${JSON.stringify(bodyResponse)}`); }
              reject(JSON.stringify(bodyResponse));
            } else {
              if (DEBUG) {logger.info(`Get Policy ID by Name, Received Status code: ${response.statusCode}`); }

                for (var i = 0; i < bodyResponse.totalItems; i++) {

                    if (bodyResponse.items[i].name === policyname) {
                      if (DEBUG) {logger.info(`Get Policy ID by Name: ${policyname} Completed, Policy Id: ${bodyResponse.items[i].id}`); }
                      resolve(bodyResponse.items[i].id);
                      getPolicyFound = false;
                      break;
                    }
                }

                if (getPolicyFound) {

                  if (DEBUG) {logger.info(`Get Policy ID by Name Result, Policy Name: ${policyname}, No matching record was found `); }
                  resolve(`Get Policy ID by Name Result, Policy Name: ${policyname}, No matching record was found`);
                }
            }
        });
    });
};
module.exports = InstallPolicy;
