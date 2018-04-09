//"use strict";
const logger = require('f5-logger').getInstance(),
      request = require("../node_modules/request"),
      username = 'admin',
      password = 'admin',
      bigipCredentials = {'user': username, 'pass': password},
      ver = "13.1.0", //ASM Version
      DEBUG = true,
      timeOut = 30000;

function InstallPolicy() {}

InstallPolicy.prototype.WORKER_URI_PATH = "asm/install_policy";
InstallPolicy.prototype.isPublic = true;
InstallPolicy.prototype.onPost = function (restOperation) {

    var athis = this,
        policySCName = restOperation.getBody().policyvcsname,
        policyFName = policySCName.slice(policySCName.lastIndexOf("/")+1,-4);

    if (DEBUG) {logger.info(`Starting to Pull Policy from VCS URL: ${policySCName}`); }

    pullPolicy(policySCName).then(function(result) {
      return transferPolicy(result);
    }).then(function(result) {
      return createPolicy(result);
    }).then(function(result){
      return importPolicy(result);
    }).then(function(result){
      return validatePolicy(result);
    }).then(function(Msg) {

        var responsePostResult = {"policy_vcsame:": policySCName,
                                  "policy_id": policyid,
                                  "import_id": importID,
                                  "install_result":Msg
                                };

        restOperation.setBody(responsePostResult);
        athis.completeRestOperation(restOperation);

        if (DEBUG) { logger.info("Completed To Install Policy:\n" + JSON.stringify(responsePostResult)); }

    }).catch(function(err) {
      logger.severs("Error Catch: " + err);
    });
};

// function to pull XML policy from source control and save it to memeory as base64 file

var pullPolicy = function(policySCName) {

  return new Promise (function(resolve, reject) {

  request (policySCName, function(err, response, body) {
      if (err) {
          logger.severe(`Error Pull Policy: VCS Policy Pull Error:\n${err}`);
          reject(err);
      } else if (response.statusCode !== 200) {
          logger.severe(`Error Pull Policy: Received Status: ${response.statusCode} from VCS:\n${response.statusMessage}`);
          reject(response);
      } else {
            if (DEBUG) { logger.info(`Pull Policy from VCS Completed: Received Response Code: ${response.statusCode} ${response.statusMessage} from VCS`); }
              //var dataPolicy;
              var dataPolicy = Buffer.from(body).toString("base64");
              //var contentLength;
              var contentLength = dataPolicy.length;
              resolve([dataPolicy,contentLength]);
      }
    });
  });
};

// function to transfer the policy and upload to ASM device

var transferPolicy = function(result) {
  if (DEBUG) { logger.info(`Starting to Transfer Policy: ${policyFName} to the BIG-IP`); }

  return new Promise (function(resolve,reject) {

    var newContentRange = "0-" + (Number(result[1]) + 1) + "/" + (Number(result[1]) + 1);
    var TransferPolicyURL = `https://localhost/mgmt/tm/asm/file-transfer/uploads/${policyFName}?ver=${ver}`;
    var TransferPolicyOptions = {
      url: TransferPolicyURL,
      method: "POST",
      auth: bigipCredentials,
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
        logger.severe(`Transfer Policy Error: Recieved status code: ${response.statusCode}:\n` + JSON.stringify(body));
        reject(response);
    } else {
        if (DEBUG) { logger.info(`Transfer Policy File to BIGIP Completed: Received Status code: ${response.statusCode} from BIG-IP`); }
        resolve (response.statusCode);
    }
  });
});
};

// function to create new ASM policy based on the imported file name

var createPolicy = function(transferResult) {
      if (DEBUG) { logger.info(`Starting to Create Policy Name: ${policyFName}, Recieve Transfer Policy Status: ${transferResult}`); }

      return new Promise(function(resolve, reject) {

          var CreatePolicyOptions = {
            url: `https://localhost/mgmt/tm/asm/policies?ver=${ver}`,
            method: "POST",
            auth: bigipCredentials,
            rejectUnauthorized: false,
            headers: { "Content-type": "application/json" },
            json: {"name": policyFName}
          };

          request (CreatePolicyOptions, function(err, response, body) {

              if (err) {
                if (DEBUG) {logger.severe("Create Policy Error: " + err); }
                reject(err);
              } else if (response.statusCode !== 201) {
                logger.severe(`Create Policy Error: Received Status code: ${response.statusCode} from BIG-IP:\n${body.message}`);
                resolve(body.message);
              } else {
                    if (DEBUG) {logger.info(`Create Policy Completed: Received Status code ${response.statusCode} from BIG-IP, policy ID is: ${body.id}`); }
                    resolve(body.id);
              }
        });
    });
};

// function to import the imported policy into the new policy that just created

var importPolicy = function(policyID) {
  if (DEBUG) {logger.info(`Starting to Import Policy into the BIG-IP Created Policy ID: ${policyID} `); }

  var policyid = policyID;
  var policyRef = `https://localhost/mgmt/tm/asm/policies/${policyID}?ver=${ver}`;

  if (!policyID)  {
    if (DEBUG) {logger.severe(`Import Policy Error: no Policy ID return from BIG-IP Policy Creation. Policy Already Created`); }

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
                  if (DEBUG) {logger.severe(`Import Policy Error: ${err}`); }
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

      if (DEBUG) {logger.info(`Starting to Validate Policy Import on BIG-IP`); }
      //var global.importID = validateIDResponse.replace(/^"+|"+$/g, '');
      var importID = validateIDResponse.replace(/^"+|"+$/g, '');
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
                if (DEBUG) {logger.severe(`Validate Policy Import Error: ${err}`); }
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

module.exports = InstallPolicy;
