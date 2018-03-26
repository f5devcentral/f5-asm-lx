const logger = require('f5-logger').getInstance();
const request = require("/var/config/rest/iapps/InstallPolicy/nodejs/node_modules/request");
const async = require("/var/config/rest/iapps/InstallPolicy/nodejs/node_modules/async");
const username = 'admin';
const password = 'admin';
const timeOut = 35000;
const DEBUG = true;

function InstallPolicy() {}

InstallPolicy.prototype.WORKER_URI_PATH = "asm/install_policy";
InstallPolicy.prototype.isPublic = true;

InstallPolicy.prototype.onPost = function (restOperation) {
  athis = this;
  var policySCName = restOperation.getBody().policygitname;
  var policyFName = policySCName.slice(policySCName.lastIndexOf("/")+1,-4);

  if (DEBUG) {logger.info(`onPost Event: Policy Name ${policyFName} to pull URL from GIT: ${policySCName}`); }

  async.waterfall([
      requestFromGit,
      transferPolicy,
      createPolicy,
      importPolicy,
      validatePolicyImport,
  ], function (err, result) {

      if (DEBUG) {logger.info("Finished to install Policy, with the follwing result:\n" + result); }
      var responsePostResult = {"policy_Name:": policySCName,
                                "policy_id": policyid,
                                "import_id": importid,
                                "install_result":result};
      restOperation.setBody(responsePostResult);
      athis.completeRestOperation(restOperation);

  });

  function requestFromGit (gitpolicy) {
      if (DEBUG) {logger.info("Starting to Pull Policy from GIT"); }

      request (policySCName, function(err, response, body) {
          if (err) {
              if (DEBUG) {logger.severe("Something went wrong with GIT Pull: " + err); }
              return;
          } else if (response.statusCode !== 200) {
              if (DEBUG) {logger.severe(`Error Pull Policy: Received Status: ${response.statusCode} from GIT: \n` + JSON.stringify(body)); }

          } else {
                if (DEBUG) {logger.info(`Pull Policy from GIT Completed: Received Response Code: ${response.statusCode} from GIT`); }
                  dataPolicy = Buffer.from(body).toString("base64");
                  contentLength = dataPolicy.length;
                  gitpolicy(null,dataPolicy,contentLength);
                  return;
          }
      });
  }

  function transferPolicy(dataPolicy, contentLength, transferResult) {
    if (DEBUG) {logger.info("Starting to Transfer Policy to the BIG-IP"); }

    const TransferPolicyURL = "https://localhost/mgmt/tm/asm/file-transfer/uploads/" + policyFName;
    const newContentRange = "0-" + (Number(contentLength) + 1) + "/" + (Number(contentLength) + 1);

    const TransferPolicyOptions = {
        url: TransferPolicyURL,
        method: "POST",
        auth: {'user': username, 'pass': password},
        headers: {
            "Content-type": "application/json",
            "Content-Range": newContentRange, },
        json: dataPolicy
    };

    request(TransferPolicyOptions, function (err, response, body) {

        if (err) {
            if (DEBUG) {logger.severe("Something went wrong with Transfer Policy: " + err); }
            return;
        } else if (response.statusCode !== 200) {
            if (DEBUG) {logger.severe(`Transfer Policy Error: Recieved status code: ${response.statusCode}: \n` + JSON.stringify(body)); }
            return;
        } else {
            if (DEBUG) {logger.info(`Transfer Policy File: Received Status code: ${response.statusCode} from BIG-IP`); }
                transferResult(null, response.statusMessage);
                return;
        }
    });
  }

  function createPolicy (transferResult,policyID) {
    if (DEBUG) {logger.info(`Starting to Create a New ${policyFName} Policy`); }

    const CreatePolicyOptions = {
        url: "https://localhost/mgmt/tm/asm/policies",
        method: "POST",
        auth: {'user': username, 'pass': password},
        headers: { "Content-type": "application/json" },
        json: {"name": policyFName}
    };

    request (CreatePolicyOptions, function(err, response, body) {

        if (err) {
            if (DEBUG) {logger.severe("Something went wrong with Policy Creation: " + err); }
            policyID(err,null);
            return;
        /*Return 404 due to bug 707169
            } else if (response.statusCode !== 201) {
            logger.severe(`Create Policy Error: Received Status code: ${response.statusCode} from BIG-IP: \n ${body.message}`);
            policyID(err,null);
            return
        */} else {
                if (DEBUG) {logger.info(`Create Policy: Received Status code: ${response.statusCode} from BIG-IP, policy ID is: ${body.id}`); }
                policyID(null, body.id);
                return;
        }
    });
  }

  function importPolicy (policyID,importIDResponse) {
    if (DEBUG) {logger.info(`Starting to Import Policy to the BIG-IP`); }
    var policyRef = "https://localhost/mgmt/tm/asm/policies/" + policyID;
    global.policyid = policyID;

    if (!policyID)  {
      if (DEBUG) {logger.severe(`Import Policy Error: no Policy ID return from BIG-IP Policy Creation. Policy Already Created`); }
      importIDResponse(null,'Import Policy Error: no Policy ID return from BIG-IP Policy Creation. Policy Already Created');
      return;
    } else {

            var ImportPolicyOptions = {
                url: "https://localhost/mgmt/tm/asm/tasks/import-policy",
                method: "POST",
                auth: {'user': username, 'pass': password},
                headers: { "content-type": "application/json" },
                json: {
                    "filename": policyFName,
                    "policyReference": { "link": policyRef }
                }
            };

            request(ImportPolicyOptions, function (err, response, body) {
                if (err) {
                    if (DEBUG) {logger.severe("Something went wrong with Import Policy: " + err); }
                    importIDResponse(err,null);
                    return;
                } else if (response.statusCode !== 201) {
                    if (DEBUG) {logger.severe(`Import Policy File Error: Received Status code: ${response.statusCode} from BIGIP device \n` + JSON.stringify(body)); }
                    importIDResponse(err,null);
                    return;
                } else {
                    if (DEBUG) {logger.info(`Import Policy File: Received Status code: ${response.statusCode} from BIGIP device with Import Id: ${JSON.stringify(body.id)}`); }
                    importIDResponse(null, JSON.stringify(body.id));
                    return;
                }
            });
          }
  }

  function validatePolicyImport (validateIDResponse,validateImport) {
    if (DEBUG) {logger.info(`Starting to Validate Policy Import on BIG-IP`); }
    const importID = validateIDResponse.replace(/^"+|"+$/g, '');
    const ValidatePolicyURL = "https://localhost/mgmt/tm/asm/tasks/import-policy/" + importID;
    global.importid = importID

    var ValidatePolicyOptions = {
        url: ValidatePolicyURL,
        method: "GET",
        auth: {'user': username, 'pass': password}
      };

    setTimeout(function() {

      request(ValidatePolicyOptions, function (err, response, body) {
      var bodyResponse = JSON.parse(body);

          if (err) {
              if (DEBUG) {logger.severe("Something went wrong with Policy Creation: " + err); }
              validateImport(err,null);
              return;
          } else if (response.statusCode !== 200) {
              if (DEBUG) {logger.severe(`Validate Policy Creation Error: Received Status code: ${response.statusCode} from BIGIP device \n ${JSON.stringify(bodyResponse)}`); }
              validateImport(err,null);
              return;

          } else if  (!body.search("COMPLETED")) {
              if (DEBUG) {logger.severe(`Validate Policy Creation Error: Received Status code: ${response.statusCode} from BIGIP device ${bodyResponse.status}`); }
          } else {
              if (DEBUG) {logger.info(`Validate Policy Creation Completed: Received Status code: ${response.statusCode} from BIGIP device ${bodyResponse.status}\n`); }
              validateImport(null, bodyResponse.result.message);
              return;
          }
      });
    }, timeOut);
  }

};

InstallPolicy.prototype.getExampleState = function () {
  return {
    "value": "your_string"
  };
};

module.exports = InstallPolicy;
