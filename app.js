process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
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

async.waterfall([
    requestFromGit,
    transferPolicy,
    createPolicy,
    importPolicy,
    validatePolicyImport,
], function (err, result) {
    console.log("Finished to install Policy, with the follwing result:\n" + result);
});

function requestFromGit (gitpolicy) {
    console.log("Starting to Pull Policy from GIT");
    //const url = "https://raw.githubusercontent.com/nashkenazi/LX-ASM/master/Policy_Example.xml";
    request (url, function(err, response, body) {
        if (err) {
            console.log("Something went wrong with GIT Pull: " + err)
        } else if (response.statusCode !== 200) {
            console.log(`Error Pull Policy: Received Status: ${response.statusCode} from GIT: \n` + JSON.stringify(body));
        } else {
                console.log(`Pull Policy from GIT Completed: Received Response Code: ${response.statusCode} from GIT`);
                dataPolicy = Buffer.from(body).toString("base64");
                contentLength = dataPolicy.length;
                gitpolicy(null,dataPolicy,contentLength);
        }
    })
};

function transferPolicy(dataPolicy, contentLength, callback) {
  console.log("Starting to Transfer Policy to the BIG-IP");
  //const PolicyUploadName = "Policy_Example";
  //const hostname = "10.241.188.23";
  //const TransferPolicyURL = "https://" + hostname + "/mgmt/tm/asm/file-transfer/uploads/" + PolicyUploadName;
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
          console.log("Something went wrong with Transfer Policy: " + err);
      } else if (response.statusCode !== 200) {
          console.log(`Transfer Policy Error: Recieved status code: ${response.statusCode}: \n` + JSON.stringify(body));
      } else {
              console.log(`Transfer Policy File: Received Status code: ${response.statusCode} from BIG-IP`);
              callback(null, response.statusMessage);
      }
  })
};

function createPolicy (policyname, policyID) {
  console.log("Starting to Create a New Policy");
  //const Pname = "DeclartiveAPIPolicy";
  //const createDeviceURL = "https://" + hostname + "/mgmt/tm/asm/policies";
  //const createData = {name: Pname};

  const CreatePolicyOptions = {
      url: createDeviceURL,
      method: "POST",
      headers: {
          "Content-type": "application/json",
          "authorization": authorization,
         },
      json: createData
  };

  request (CreatePolicyOptions, function(err, response, body) {

      if (err) {
          console.log("Something went wrong with Policy Creation Pull: " + err)
      } else if (response.statusCode !== 201) {
          console.log(`Create Policy Error: Received Status code: ${response.statusCode} from BIG-IP: \n` + body.message);
          policyID(null,body.id);
      } else {
              console.log(`Create Policy: Received Status code: ${response.statusCode} from BIG-IP`);
              policyID(null, body.id);
      }
  })

};

function importPolicy (policyID,importIDResponse) {
  console.log(`Starting to Import Policy to the BIG-IP`);

  if (!policyID)  {
    importResponse(null,'Policy already created');
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
                  "filename": PolicyUploadName,
                  "policyReference": { "link": "https://localhost/mgmt/tm/asm/policies/" + policyID }
              }
          };

          request(ImportPolicyOptions, function (err, response, body) {
              if (err) {
                  console.log("Something went wrong with Import Policy: " + err)
              } else if (response.statusCode !== 201) {
                  console.log(`Import Policy File Error: Received Status code: ${response.statusCode} from BIGIP device \n` + JSON.stringify(body));
              } else {

                  console.log(`Import Policy File: Received Status code: ${response.statusCode} from BIGIP device`);
                  importIDResponse(null, JSON.stringify(body.id));
              }
          })
  }
};

function validatePolicyImport (importIDResponse,validateImport) {
  console.log(`Starting to Validate Policy Import on BIG-IP`);
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
    var bodyResponse = JSON.parse(body)

        if (err) {
            console.log("Something went wrong with Policy Creation: " + err)
        } else if (response.statusCode !== 200) {
            console.log(`Validate Policy Creation Error: Received Status code: ${response.statusCode} from BIGIP device \n ${bodyResponse}`);

        } else if  (!body.search("COMPLETED")) {
            console.log(`Validate Policy Creation Error: Received Status code: ${response.statusCode} from BIGIP device ${bodyResponse.status}`);
        } else {
            console.log(`Validate Policy Creation Completed: Received Status code: ${response.statusCode} from BIGIP device ${bodyResponse.status}\n`);
            validateImport(null, bodyResponse.result.message)
        }
    })
  }, timeOut);

};
