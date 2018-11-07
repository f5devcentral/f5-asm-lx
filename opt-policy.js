var logger = require('f5-logger').getInstance(),
    request = require("../node_modules/request"),
    md5 = require("../node_modules/md5"),
    bigipusername = "replace with bigip username",
    bigippassword = "replace with bigip password",
    vcsusername = "replace with vcs username",
    vcspassword = "replace with vcs password",
    vcsemail = "replace with vcs email",
    vcsrepo = "replace with vcs repo name",
    vcspath = "replace with vcs path name",
    bigipCredentials = {"user": bigipusername, "pass": bigippassword},
    vcsCredentials = {"username": vcsusername, "password": vcspassword},
    bigipver = "replace with bigip version",
    DEBUG = false;


function optPolicy() {}

optPolicy.prototype.WORKER_URI_PATH = "/shared/workers/opt-policy";
optPolicy.prototype.isPublic = true;
var bigipCredentials = {"user": bigipusername, "pass": bigippassword};

//=============================================================================
//Starting POST Request Process To Import Policy from VCS
// ============================================================================

optPolicy.prototype.onPost = function (restOperation) {
    var athis = this;

    global.policyVcsPath = restOperation.getBody().policyvcsname;
    global.policyName = restOperation.getBody().policyname;
    global.policyParName = restOperation.getBody().policyparentname;

    if (DEBUG) {logger.info(`Starting Post Policy Event. VCS URL: ${policyVcsPath}, Policy Name: ${policyName}, Parent Name: ${policyParName}`); }

    pullPolicy(policyVcsPath).then(function(Apolicy) {
      return transferPolicy(Apolicy);
	  }).then(function() {
	    return getPolicyId(policyParName);
    }).then(function(policyParId) {
      return importPolicy([policyName,policyParId]);
    }).then(function(valimportId) {
      return validatePolicy(valimportId);
    }).then(function(Msg) {

		var responsePostResult = {  "import_result": "COMPLETED",
                                "imported_policy_name": policyName
								             };

        restOperation.setBody(responsePostResult);
        athis.completeRestOperation(restOperation);

        if (DEBUG) { logger.info("Completed Post Policy Event. Import Policy Result:\n" + JSON.stringify(responsePostResult)); }

    }).catch(function(err) {
      logger.severe("Import Error Catch: " + err);

      var responseErrPostResult = {"import_error__result":err};
      restOperation.setBody(responseErrPostResult);
      athis.completeRestOperation(restOperation);
    });
};

//=============================================================================
//Starting DELETE Request Process To Delete Policy
// ============================================================================

optPolicy.prototype.onDelete = function (restOperation) {

  var dthis = this,
      delPolicyName = restOperation.getBody().policyname;

  if (DEBUG) {logger.info(`Starting Delete Policy Event. Policy Name: ${delPolicyName}`); }

    getPolicyId(delPolicyName).then(function(result) {
        return deletePolicy(result).then(function(Msg) {

      var responseDeleteResult = { "delete_result": "COMPLETED",
                                    "policy_deleted_name": delPolicyName
                                 };

          restOperation.setBody(responseDeleteResult);
          dthis.completeRestOperation(restOperation);

      if (DEBUG) { logger.info("Completed Delete Policy Event. Delete Policy Result:\n" + JSON.stringify(responseDeleteResult)); }

      }).catch(function(err) {
          logger.severe("Delete Error Catch: " + err);

            var responseErrDeleteResult = { "delete_error_result":err };

            restOperation.setBody(responseErrDeleteResult);
            dthis.completeRestOperation(restOperation);
      });
  });
};

//=============================================================================
//Starting GET Request Process To Export Policy to vcs
// ============================================================================

optPolicy.prototype.onGet = function (restOperation) {

  var ethis = this;
  global.exportPolicyName = restOperation.getUri().query.policy;

  if (DEBUG) {logger.info(`Starting Export Policy Event. Policy Name: ${exportPolicyName}`); }

  getPolicyId(exportPolicyName).then(function(result) {
      return exportPolicy(result);
  }).then(function(result) {
      return expValidatePolicy(result);
  }).then(function(result) {
      return downloadPolicy(result);
  }).then(function(result) {
      return uploadPolicy(result);
  }).then(function(expPolicyName) {

    var responseExportResult = { "export_result": "COMPLETED",
                                 "policy_exported_name": expPolicyName
                               };

    restOperation.setBody(responseExportResult);
    ethis.completeRestOperation(restOperation);

  if (DEBUG) { logger.info("Completed Export Policy Event. Export Policy Result:\n" + JSON.stringify(responseExportResult)); }

  }).catch(function(err) {
            logger.severe("Export Error Catch: " + err);

            var responseErrDeleteResult = { "export_error_result":err };

            restOperation.setBody(responseExportResult);
            ethis.completeRestOperation(restOperation);
  });
};

//==============================================================================
// Pull XML policy function from URL source control
//==============================================================================

var pullPolicy = function(policyVcsPath) {
  if (DEBUG) { logger.info(`Starting pullPolicy function. Pull Policy ${policyName} from VCS `); }

  return new Promise (function(resolve, reject) {

      request (policyVcsPath, function(err, response, body) {

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

// =============================================================================
// Upload the policy to ASM device
// =============================================================================

var transferPolicy = function(Apolicy) {

    if (DEBUG) { logger.info(`Starting transferPolicy function. Transfer Policy: ${policyName} to BIG-IP`); }

    return new Promise (function(resolve,reject) {

        var newContentRange = "0-" + (Number(Apolicy[1]) + 1) + "/" + (Number(Apolicy[1]) + 1);
        var TransferPolicyURL = `https://localhost/mgmt/tm/asm/file-transfer/uploads/${policyName}?ver=${bigipver}`;

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

//==============================================================================
// Import vcs policy into the new created policy
//==============================================================================

var importPolicy = function(impolicyId) {

    if (DEBUG) {logger.info(`Starting importPolicy function. Import Policy into the BIG-IP Created Policy Name: ${impolicyId[0]} `); }

    return new Promise (function(resolve, reject) {

        //var ImportPolicyOptions;

        if (impolicyId[1] === "none") {

           ImportPolicyOptions = {
              url: "https://localhost/mgmt/tm/asm/tasks/import-policy",
              method: "POST",
              auth: bigipCredentials,
              rejectUnauthorized: false,
              headers: { "content-type": "application/json" },
              json: {
                  "filename": impolicyId[0],
                  "name": impolicyId[0]
                  }
            };

        } else {

            var parentRef = `https://localhost/mgmt/tm/asm/policies/${impolicyId[1]}`;

             ImportPolicyOptions = {
                url: "https://localhost/mgmt/tm/asm/tasks/import-policy",
                method: "POST",
                auth: bigipCredentials,
                rejectUnauthorized: false,
                headers: { "content-type": "application/json" },
                json: {
                    "filename": impolicyId[0],
                    "name": impolicyId[0],
                    "parentPolicyReference": { "link": `https://localhost/mgmt/tm/asm/policies/${impolicyId[1]}` }
                   }
            };
        }

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
};

//=============================================================================
// Validate import result and response back to the caller
//==========================================================================

var validatePolicy = function(validateIDResponse) {

    if (DEBUG) {logger.info(`Starting validatePolicy function. Validate Policy Import ID ${validateIDResponse}`); }
    var vtimeOut = 25000;
    global.valimportID = validateIDResponse.replace(/^"+|"+$/g, '');
    var ValidatePolicyURL = `https://localhost/mgmt/tm/asm/tasks/import-policy/${valimportID}?ver=${bigipver}`;

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
      }, vtimeOut);
  });
};

//=============================================================================
// Get Policy ID by Policy Name
//==========================================================================

var getPolicyId = function(policyname) {

  if (policyname === undefined) {
    if (DEBUG) {logger.info(`Starting getPolicyId function. Parent policy is undefined`); }
    return "none";
   }

    if (DEBUG) {logger.info(`Starting getPolicyId function. Get Policy Id by Name: ${policyname} `); }

    var getPolicyFound = true;
    var getPolicyList = `https://localhost/mgmt/tm/asm/policies?ver=${bigipver}`;

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
                      global.policyID = bodyResponse.items[i].id;
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


//=============================================================================
// Delete policy - Based on getPolicy ID
//==============================================================================

var deletePolicy = function(delpolicyid) {

    if (DEBUG) { logger.info(`Starting deletePolicy function. Delete Policy Name: ${delpolicyid}`); }

    return new Promise(function(resolve, reject) {

        var DeletePolicyOptions = {
            url: `https://localhost/mgmt/tm/asm/policies/${delpolicyid}?ver=${bigipver}`,
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

                logger.severe(`Delete Policy Error: Received Status code: ${response.statusCode} from BIG-IP:\n${body}`);
                reject(resDelBody.message);
            } else {
                  if (DEBUG) {logger.info(`Delete Policy ID ${resDelBody.id} Completed: Received Status code ${response.statusCode} from BIG-IP`); }
                  resolve(resDelBody.id);
            }
        });
    });
};


//==============================================================================
// Export policy - Based on getPolicy ID
//==============================================================================

var exportPolicy = function(expvalidatePolicy) {

    if (DEBUG) { logger.info(`Starting exportPolicy function. Export Policy Name: ${exportPolicyName}, Export Policy ID: ${policyID}`); }

    return new Promise(function(resolve, reject) {

        var expfilename = `${exportPolicyName}.xml`;
        var exppolicyReference = `https://localhost/mgmt/tm/asm/policies/${policyID}`;

        var ExportPolicyOptions = {
            url: `https://localhost/mgmt/tm/asm/tasks/export-policy?ver=${bigipver}`,
            method: "POST",
            auth: bigipCredentials,
            rejectUnauthorized: false,
            headers: { "Content-type": "application/json" },
            json: { "filename": expfilename,
                    "minimal": true,
                    "policyReference": { "link":exppolicyReference }
                  }
       };

        request (ExportPolicyOptions, function(err, response, body) {

            if (err) {
              if (DEBUG) {logger.severe("Something went wrong with Export Policy:\n " + err); }
                reject(err);
            } else if (response.statusCode !== 201) {

                logger.severe(`Export Policy Error: Received Status code: ${response.statusCode} from BIG-IP:\n${body}`);
                reject(body.message);
            } else {
                  if (DEBUG) {logger.info(`Export Policy ID ${body.id} for Policy Name ${exportPolicyName} Completed: Received Status code ${response.statusCode} from BIG-IP`); }
                  resolve(body.id);
            }
        });
    });
};

//==============================================================================
// Validate Export result
//==============================================================================

var expValidatePolicy = function(expvalidateIDResponse) {

    if (DEBUG) {logger.info(`Starting expvalidatePolicy function. Validate Policy Export ID ${expvalidateIDResponse}`); }
    var etimeOut = 4000;
    var expValidatePolicyURL = `https://localhost/mgmt/tm/asm/tasks/export-policy/${expvalidateIDResponse}?ver=${bigipver}`;

    return new Promise (function(resolve,reject) {

        var expValidatePolicyOptions = {
            url: expValidatePolicyURL,
            method: "GET",
            rejectUnauthorized: false,
            auth: bigipCredentials
          };

        setTimeout(function() {

            request(expValidatePolicyOptions, function (err, response, body) {

                var bodyResponse = JSON.parse(body);

                if (err) {
                  if (DEBUG) {logger.severe(`Something went wrong with Policy Export Validation Request:\n ${err}`); }
                  reject(err);

                } else if (response.statusCode !== 200) {
                  if (DEBUG) {logger.severe(`Validate Policy Export Error, Received Status code: ${response.statusCode} from BIGIP device:\n${JSON.stringify(bodyResponse)}`); }
                  reject(JSON.stringify(bodyResponse));
                } else if  (!body.search("COMPLETED")) {
                  if (DEBUG) {logger.severe(`Validate Policy Export Error, Received Status code: ${response.statusCode} from BIGIP device: ${bodyResponse.status}`); }
                  reject(JSON.stringify(bodyResponse));
                } else {
                  if (DEBUG) {logger.info(`Validate Policy Export Completed, Received Status code: ${response.statusCode} from BIGIP device: ${bodyResponse.status}`); }
                  resolve(bodyResponse.result.message);
                }
            });
      }, etimeOut);
  });
};

//==============================================================================
// Download Policy - Download policy to local folder
//==============================================================================

var downloadPolicy = function(exppolicyid) {

    if (DEBUG) { logger.info(`Starting downloadPolicy function. Download Policy Name: ${exportPolicyName}, Download Policy Id: ${policyID}`); }

    return new Promise(function(resolve, reject) {

        var DownloadPolicyOptions = {
            url: `https://localhost/mgmt/tm/asm/file-transfer/downloads/${exportPolicyName}.xml`,
            method: "GET",
            auth: bigipCredentials,
            rejectUnauthorized: false
       };

       request (DownloadPolicyOptions, function(err, response, body) {

            if (err) {
              if (DEBUG) {logger.severe("Something went wrong with Download Policy:\n " + err); }
                reject(err);
            } else if (response.statusCode !== 200) {

                logger.severe(`Download Policy Error: Received Status code: ${response.statusCode} from BIG-IP:\n${body}`);
                reject(body.message);
            } else {
                  if (DEBUG) {logger.info(`Download Policy ID ${body.id} Completed: Received Status code ${response.statusCode} from BIG-IP`); }
                  resolve(body);
            }
        });
  });
};


//==============================================================================
//Upload exported file to VCS
//==============================================================================

var uploadPolicy = function(policyfile) {

  if (DEBUG) { logger.info(`Starting uploadPolicy function. upload Policy Name: ${exportPolicyName}`); }
  var vcsCredentials = {"username": vcsusername, "password": vcspassword};
  var updataPolicy = Buffer.from(policyfile).toString("base64");
  var vcsuploadpath = `api.github.com/repos/${vcsusername}/${vcsrepo}/contents/${vcspath}/`;
  var d = new Date(),
    dformat = [d.getMonth()+1,
               d.getDate(),
               d.getFullYear()].join('-')+'-'+
              [d.getHours(),
               d.getMinutes(),
               d.getSeconds()].join('-');

  exportPolicyName = exportPolicyName + '-' + dformat + '.xml';

    return new Promise(function(resolve, reject) {

        var UploadPolicyOptions = {
            url: `https://${vcsuploadpath}${exportPolicyName}`,
            method: "PUT",
            rejectUnauthorized: false,
            auth: vcsCredentials,
            headers: { "Content-type": "application/json", 'User-Agent': 'request' },
            json: { "message": "upload ASM policy commit message from ictrl-lx",
                    "committer": {
                    "name": vcsusername,
                    "email": vcsemail
                  },
                    "content": updataPolicy
            }
        };

        request (UploadPolicyOptions, function(err, response, body) {

            if (err) {
              if (DEBUG) {logger.severe("Something went wrong with Upload to VCS Policy Request:\n" + err); }
              reject(err);
            } else if (response.statusCode !== 201) {
              logger.severe(`Upload to VCS Policy Error: Received Status code: ${response.statusCode}`);
              reject(body.message);
            } else {
                  if (DEBUG) {logger.info(`Upload to VCS Policy Completed: Received Status code ${response.statusCode}, policy name: ${exportPolicyName}`); }
                  resolve(exportPolicyName);
            }
        });
    });
};

module.exports = optPolicy;
