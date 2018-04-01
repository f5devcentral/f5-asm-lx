process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const request = require("request");
const username = 'admin';
const password = 'admin';
const giturl = "https://raw.githubusercontent.com/nashkenazi/LX-ASM/master/DeclarativeAPIPolicy.xml";
const DEBUG = true
const timeOut = 35000;
const policyFName = "DeclarativeAPIPolicy";
const hostname = "10.241.188.23";
const authorization = "Basic YWRtaW46YWRtaW4=";
const TransferPolicyURL = "https://" + hostname + "/mgmt/tm/asm/file-transfer/uploads/" + policyFName;

var CreatePolicy = function() {

  return new Promise (function(resolve, reject) {

  request (giturl, function(err, response, body) {
      if (err) {
          console.log("Something went wrong with GIT Pull: " + err);
          reject(err)
      } else if (response.statusCode !== 200) {
          console.log(`Error Pull Policy: Received Status: ${response.statusCode} from GIT:\n ${response.statusMessage}`);
          reject(reponse)
      } else {
              console.log(`Pull Policy from GIT Completed: Received Response Code: ${response.statusMessage} from GIT`);
              dataPolicy = Buffer.from(body).toString("base64");
              contentLength = dataPolicy.length;
              resolve([dataPolicy,contentLength]);
      }
    })
  })
  .then(function(result) {

    const newContentRange = "0-" + (Number(result[1]) + 1) + "/" + (Number(result[1]) + 1);
    const TransferPolicyOptions = {
      url: TransferPolicyURL,
      method: "POST",
      auth: {'user': username, 'pass': password},
      headers: {
          "Content-type": "application/json",
          "Content-Range": newContentRange, },
      json: result[0]
    };

    return new Promise (function(resolve,reject) {

    request(TransferPolicyOptions, function (err, response, body) {

      if (err) {
          console.log("Something went wrong with Transfer Policy: " + err);
          reject(err);

      } else if (response.statusCode !== 200) {
          console.log(`Transfer Policy Error: Recieved status code: ${response.statusCode}: \n` + JSON.stringify(body));
          reject(response)
      } else {
              console.log(`Transfer Policy File: Received Status code: ${response.statusCode} from BIG-IP`);
          resolve (response.statusCode);
            }
      })
    })
  })
    .then(function(transferResult) {
      console.log("Recieve Transfer Policy " + transferResult + ",Starting to create policy");

      return new Promise(function(resolve, reject) {

        if (DEBUG) {console.log(`Starting to Create a New ${policyFName} Policy`); }

        const CreatePolicyOptions = {
            url: "https://"+ hostname + "/mgmt/tm/asm/policies",
            method: "POST",
            auth: {'user': username, 'pass': password},
            headers: { "Content-type": "application/json" },
            json: {"name": policyFName}
        };

        request (CreatePolicyOptions, function(err, response, body) {

            if (err) {
                if (DEBUG) {console.log("Something went wrong with Policy Creation: " + err); }
                reject(err)
            /*Return 404 due to bug 707169
                } else if (response.statusCode !== 201) {
                logger.severe(`Create Policy Error: Received Status code: ${response.statusCode} from BIG-IP: \n ${body.message}`);
                policyID(err,null);
                return
            */} else {
                    if (DEBUG) {console.log(`Create Policy: Received Status code: ${response.statusCode} from BIG-IP, policy ID is: ${body.id}`); }
                    resolve(body.id);
            }
        });
      })
  })
  .then(function(policyID) {
    if (DEBUG) {console.log(`Received Policy ID ${policyID}, Starting to Import Policy to the BIG-IP`); }
    var policyRef = "https://" + hostname + "/mgmt/tm/asm/policies/" + policyID;


    if (!policyID)  {
      if (DEBUG) {console.log(`Import Policy Error: no Policy ID return from BIG-IP Policy Creation. Policy Already Created`); }

    } else {

        return new Promise (function(resolve, reject) {

            var ImportPolicyOptions = {
                url: "https://" + hostname + "/mgmt/tm/asm/tasks/import-policy",
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
                    if (DEBUG) {console.log("Something went wrong with Import Policy: " + err); }
                    reject(err);
                } else if (response.statusCode !== 201) {
                    if (DEBUG) {console.log(`Import Policy File Error: Received Status code: ${response.statusCode} from BIGIP device \n` + JSON.stringify(body)); }
                    reject(JSON.stringify(body))
                } else {
                    if (DEBUG) {console.log(`Import Policy File: Received Status code: ${response.statusCode} from BIGIP device with Import Id: ${JSON.stringify(body.id)}`); }
                    resolve(JSON.stringify(body.id));
                }
            });
        })
      }
  })
  .then(function(validateIDResponse) {

      if (DEBUG) {console.log(`Starting to Validate Policy Import on BIG-IP`); }

      const importID = validateIDResponse.replace(/^"+|"+$/g, '');
      const ValidatePolicyURL = "https://" + hostname + "/mgmt/tm/asm/tasks/import-policy/" + importID;


      return new Promise (function(resolve,reject) {

      var ValidatePolicyOptions = {
          url: ValidatePolicyURL,
          method: "GET",
          auth: {'user': username, 'pass': password}
        };

        setTimeout(function() {

        request(ValidatePolicyOptions, function (err, response, body) {
        var bodyResponse = JSON.parse(body);

            if (err) {
                if (DEBUG) {console.log("Something went wrong with Policy Creation: " + err); }
                reject(err)
                return;
            } else if (response.statusCode !== 200) {
                if (DEBUG) {console.log(`Validate Policy Creation Error: Received Status code: ${response.statusCode} from BIGIP device \n ${JSON.stringify(bodyResponse)}`); }
                reject(JSON.stringify(bodyResponse));
            } else if  (!body.search("COMPLETED")) {
                if (DEBUG) {console.log(`Validate Policy Creation Error: Received Status code: ${response.statusCode} from BIGIP device ${bodyResponse.status}`); }
                reject(JSON.stringify(bodyResponse));
            } else {
                if (DEBUG) {console.log(`Validate Policy Creation Completed: Received Status code: ${response.statusCode} from BIGIP device ${bodyResponse.status}\n`); }
                resolve(bodyResponse.result.message);
            }
        });
      }, timeOut);
    })
  })
  .then(function(Msg) {
    console.log("Finshed To Validate Import" + Msg)
  })
  .catch(function(err) {
    console.log("Catch: " + err)
  }
)
}

CreatePolicy();
