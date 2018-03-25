const logger = require('f5-logger').getInstance();
const request = require("/var/config/rest/iapps/InstallPolicy/nodejs/node_modules/request");
const async = require("/var/config/rest/iapps/InstallPolicy/nodejs/node_modules/async");
const hostname = "10.241.188.23";
const authorization = "Basic YWRtaW46YWRtaW4=";
const url = "https://raw.githubusercontent.com/nashkenazi/LX-ASM/master/Policy_Example.xml";
//const PolicyUploadName = "Policy_Example";
//const TransferPolicyURL = "https://" + hostname + "/mgmt/tm/asm/file-transfer/uploads/" + PolicyUploadName;
const Pname = "DeclartiveAPIPolicy";
const createDeviceURL = "https://" + hostname + "/mgmt/tm/asm/policies";
const createData = {name: Pname};
const ImportPolicyURL = "https://" + hostname + "/mgmt/tm/asm/tasks/import-policy";
const timeOut = 35000;

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
  athis = this;
  var policySCName = restOperation.getBody().policygitname;
  var policyFName = policySCName.slice(policySCName.lastIndexOf("/")+1,-4);
  var uriValue = restOperation.getUri();

  logger.info("policy name is: " + policyFName);
  logger.info("URIrequest value is: " + JSON.stringify(uriValue));
  logger.info(`onPost Event: Policy URL to pull from GIT: ${policySCName}`);

  async.waterfall([
      requestFromGit,
      transferPolicy,
      createPolicy,
      importPolicy,
      validatePolicyImport,
  ], function (err, result) {
      logger.info("Finished to install Policy, with the follwing result:\n" + result);
      var responsePostResult = {"install result":result};
      restOperation.setBody(responsePostResult);
      athis.completeRestOperation(restOperation);

  });

  function requestFromGit (gitpolicy) {
      logger.info("Starting to Pull Policy from GIT");

      request (policySCName, function(err, response, body) {
          if (err) {
              logger.severe("Something went wrong with GIT Pull: " + err);
          } else if (response.statusCode !== 200) {
              logger.severe(`Error Pull Policy: Received Status: ${response.statusCode} from GIT: \n` + JSON.stringify(body));
          } else {
                  logger.info(`Pull Policy from GIT Completed: Received Response Code: ${response.statusCode} from GIT`);
                  dataPolicy = Buffer.from(body).toString("base64");
                  contentLength = dataPolicy.length;
                  gitpolicy(null,dataPolicy,contentLength);
          }
      });
  }

  function transferPolicy(dataPolicy, contentLength, callback) {
    logger.info("Starting to Transfer Policy to the BIG-IP");
    //const PolicyUploadName = "Policy_Example";
    //const hostname = "10.241.188.23";
    //const TransferPolicyURL = "https://" + hostname + "/mgmt/tm/asm/file-transfer/uploads/" + PolicyUploadName;
    const TransferPolicyURL = "https://localhost/mgmt/tm/asm/file-transfer/uploads/" + policyFName;
    const newContentRange = "0-" + (Number(contentLength) + 1) + "/" + (Number(contentLength) + 1);

    const TransferPolicyOptions = {
        url: TransferPolicyURL,
        method: "POST",
        headers: {
            "Content-type": "application/json",
            "authorization": authorization,
            "Content-Range": newContentRange, },
        json: dataPolicy
    };

    request(TransferPolicyOptions, function (err, response, body) {

        if (err) {
            logger.severe("Something went wrong with Transfer Policy: " + err);
        } else if (response.statusCode !== 200) {
            logger.severe(`Transfer Policy Error: Recieved status code: ${response.statusCode}: \n` + JSON.stringify(body));
        } else {
                logger.info(`Transfer Policy File: Received Status code: ${response.statusCode} from BIG-IP`);
                callback(null, response.statusMessage);
        }
    });
  }

  function createPolicy (policyID) {
    logger.info("Starting to Create a New Policy");
    //const Pname = "DeclartiveAPIPolicy";
    const createDeviceURL = "https://10.241.188.23/mgmt/tm/asm/policies";
    //const createData = {name: Pname};

    const CreatePolicyOptions = {
        url: createDeviceURL,
        method: "POST",
        headers: {
            "Content-type": "application/json",
            "authorization": authorization,
           },
        json: {"name": policyFName}
    };

    request (CreatePolicyOptions, function(err, response, body) {

        if (err) {
            logger.severe("Something went wrong with Policy Creation Pull: " + err);
        } else if (response.statusCode !== 201) {
            logger.severe(`Create Policy Error: Received Status code: ${response.statusCode} from BIG-IP: \n` + body.message);
            policyID(null,body.id);
        } else {
                logger.info(`Create Policy: Received Status code: ${response.statusCode} from BIG-IP`);
                policyID(null, body.id);
        }
    });
  }

  function importPolicy (policyID,importIDResponse) {
    logger.info(`Starting to Import Policy to the BIG-IP`);

    if (!policyID)  {
      importIDResponse(null,'Policy already created');
    } else {

            //const hostname = "10.241.188.23";
            //const ImportPolicyURL = "https://" + hostname + "/mgmt/tm/asm/tasks/import-policy";
            //const filename = "Policy_Example";

            var ImportPolicyOptions = {
                url: ImportPolicyURL,
                method: "POST",
                headers: {
                    "authorization": authorization,
                    "content-type": "application/json",
                },
                json: {
                    "filename": policyFName,
                    "policyReference": { "link": "https://localhost/mgmt/tm/asm/policies/" + policyID }
                }
            };

            request(ImportPolicyOptions, function (err, response, body) {
                if (err) {
                    logger.severe("Something went wrong with Import Policy: " + err);
                } else if (response.statusCode !== 201) {
                    logger.severe(`Import Policy File Error: Received Status code: ${response.statusCode} from BIGIP device \n` + JSON.stringify(body));
                } else {

                    logger.info(`Import Policy File: Received Status code: ${response.statusCode} from BIGIP device`);
                    importIDResponse(null, JSON.stringify(body.id));
                }
            });
    }
  }

  function validatePolicyImport (importIDResponse,validateImport) {
    logger.info(`Starting to Validate Policy Import on BIG-IP`);
    const importID = importIDResponse.replace(/^"+|"+$/g, '');
    const ValidatePolicyURL = "https://" + hostname + "/mgmt/tm/asm/tasks/import-policy/" + importID;

    var ValidatePolicyOptions = {
        url: ValidatePolicyURL,
        method: "GET",
        headers: {
            "authorization": authorization
        }
    };

    setTimeout(function() {

      request(ValidatePolicyOptions, function (err, response, body) {
      var bodyResponse = JSON.parse(body);

          if (err) {
              logger.severe("Something went wrong with Policy Creation: " + err);
          } else if (response.statusCode !== 200) {
              logger.severe(`Validate Policy Creation Error: Received Status code: ${response.statusCode} from BIGIP device \n ${JSON.stringify(bodyResponse)}`);

          } else if  (!body.search("COMPLETED")) {
              logger.severe(`Validate Policy Creation Error: Received Status code: ${response.statusCode} from BIGIP device ${bodyResponse.status}`);
          } else {
              logger.info(`Validate Policy Creation Completed: Received Status code: ${response.statusCode} from BIGIP device ${bodyResponse.status}\n`);
              validateImport(null, bodyResponse.result.message);
          }
      });
    }, timeOut);
  }

};

/*
InstallPolicy.prototype.getExampleState = function () {
  return {
    "value": "your_string"
  };
};
*/

module.exports = InstallPolicy;
