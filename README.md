This ASM iControl LX extension repository is intended to improve automation process by using declarative API operations.
The LX extension intended to provide IMPORT/EXPORT/DELETE ASM policy from VCS (version control system) such as GITHUB in simple API call.

===========================

IMPORT ASM POLICY:

===========================

What the extension is doing:
1. Extension download the ASM XML policy from version control system (VCS) based on the parameter "policyvcsname" passed in the request
2. Extension transfer the VCS downloaded policy to ASM folder
3. Extension import the downloaded policy and name it as describe in the "policyname" parameter passed in the request
4. Extension validate the import policy process and report back the results

How to Deploy the Extension:
1. Copy latest RPM package from https://github.com/f5devcentral/f5-asm-lx/blob/master/RPM/ to your ASM folder.
e.g: "/var/config/rest/downloads/OptPolicy-0.1-001.noarch.rpm"
2. Install RPM package on ASM via the ASM CLI command:
e.g: curl -u user:pass -X POST http://localhost:8100/mgmt/shared/iapp/package-management-tasks -d '{ "operation":"INSTALL","packageFilePath": "/var/config/rest/downloads/OptPolicy-0.1-001.noarch.rpm"}'

- Replace "user:pass" with your ASM credentials
For More Information, Follow iControl extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx   

3. Add At least one DNS Resolving Server List on ASM: "tmsh modify sys dns name-servers add { 8.8.8.8 }"


How to Use The Extension:
1. Edit extension default  variables to your environment:

"bigipusername" - ASM user name
"bippassword" - ASM user password
"bipipver" - ASM software Version
"DEBUG" - [true/false] Enable or disable ASM logs - logs are accessible via /var/log/restnoded/restnoded.log

2. Create POST call to the extension URL "https://ASM_IP_Address"/mgmt/shared/workers/opt-policy"
3. Include HTTP Headers: "Content-Type: application/json" and "Authorization: Basic XXXXXXX"
4. Include parameter "policyvcsname" point the VCS policy URL and parameter "policyname" that the policy name will be.
5. For Child policy type - add additional parameter "policyparentname" that refer to the parent policy name

See import example below:

1. Security Policy With No Child:
curl --insecure -d '{ "policyvcsname": "<https://URL to policy XML>", "policyname": "<policy name>" }' -H "Content-Type: application/json" -H "Authorization: Basic <auth_hash>=" -X POST https://<bigipaddress>/mgmt/shared/workers/opt-policy

2. Parent Policy:
curl --insecure -d '{ "policyvcsname": "<https://URL to policy XML>", "policyname": "<policy name>" }' -H "Content-Type: application/json" -H "Authorization: Basic <auth_hash>=" -X POST https://<bigipaddress>/mgmt/shared/workers/opt-policy

3. Security Policy Child With Parent:
curl --insecure -d '{ "policyvcsname": "<https://URL to policy XML>", "policyname": "<policy name>", "policyparentname": "< parent policy name>-" }' -H "Content-Type: application/json" -H "Authorization: Basic <auth_hash>=" -X POST https://<bigipaddress>/mgmt/shared/workers/opt-policy

=======================================================================================================================================================

============================

EXPORT ASM POLICY:

============================

What the extension is doing:
1. Extension export the ASM XML policy from ASM to local folder
2. Extension validate that the export ASM policy done successfully
3. Extension download the policy to ASM local folder
3. Extension upload the exported policy to VCS repository and provide back the result to the caller  


How to Deploy the Extension:
1. Copy latest RPM package from https://github.com/f5devcentral/f5-asm-lx/blob/master/RPM/ to your ASM folder.
e.g: "/var/config/rest/downloads/OptPolicy-0.1-001.noarch.rpm"
2. Install RPM package on ASM via the ASM CLI command:
e.g: curl -u user:pass -X POST http://localhost:8100/mgmt/shared/iapp/package-management-tasks -d '{ "operation":"INSTALL","packageFilePath": "/var/config/rest/downloads/OptPolicy-0.1-001.noarch.rpm"}'

- Replace "user:pass" with your ASM credentials
For More Information, Follow iControl extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx   

3. Add At least one DNS Resolving Server List on ASM: "tmsh modify sys dns name-servers add { 8.8.8.8 }"

How to Use The Extension:
1. Edit extension default  variables to your environment:

"bigipusername" - ASM user name
"bigippassword" - ASM user password
"bigipver" - ASM software Version
"DEBUG" - [true/false] Enable or disable ASM logs - logs are accessible via /var/log/restnoded/restnoded.log
vcsusername - VCS user name that the policy will be uploaded
vcspassword - VCS user password that the policy will be uploaded
vcsrepo - VCS repository that the policy will be uploaded
vcspath - VCS repository folder that the policy will be uploaded

2. Create GET call to the extension URL "ASM_IP_Address"/mgmt/shared/workers/git-policy"
4. Include URL parameter name"policy" and value equal the policy name that will be uploaded to the VCS.

see example below:

curl --insecure -H "Authorization: Basic <xxxxxxxxx> =" https://ASM_IP_ADDRESS/mgmt/shared/workers/opt-policy?policy=ASM_POLICY_NAME

- Replace "ASM_IP_ADDRESS" with ASM mgmt IP and "xxxxxxxx" with user basic authorization string
- Replace "ASM_POLICY_NAME" with the policy name that would be exported to the VCS

=========================================================================================================================================================

============================

DELETE ASM POLICY:

============================

What the extension is doing:
1. Extension extract the policy Id from the ASM based on the policy name provided in the request call
2. Extension validate if the policy Id is exist in ASM
3. Extension delete the policy from the ASM based on the policy Id and report back the results

How to Deploy The Extension:
1. Copy latest RPM package from https://github.com/f5devcentral/f5-asm-lx/blob/master/RPM/ to your ASM folder.
e.g: "/var/config/rest/downloads/OptPolicy-0.1-001.noarch.rpm"
2. Install RPM package on ASM via the ASM CLI command:
e.g: curl -u user:pass -X POST http://localhost:8100/mgmt/shared/iapp/package-management-tasks -d '{ "operation":"INSTALL","packageFilePath": "/var/config/rest/downloads/OptPolicy-0.1-001.noarch.rpm"}'


- Replace "user:pass" with your ASM credentials
For More Information, Follow iControl extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx

How to Use The Extension:
1. Edit extension default variables to your environment:
"bigipusername" - ASM user name
"bigippassword" - ASM user password
"bigver" - ASM software Version
"DEBUG" - Enable or disable ASM logs - "true"  or "false"

2. Create DELETE call to the extension URL "https:<bigip_address>"/mgmt/shared/workers//opt-policy"
3. Include HTTP Headers: "Content-Type: application/json" and "Authorization: Basic xxxxxxx"
4. Include body parameter name "policyname" and the policy name as value.

see example below:
curl --insecure -d '{ "policyname": "Declarative_API_Policy" }' -H "Content-Type: application/json" -H "Authorization: Basic xxxxxxx" -X DELETE https://ASM_IP_ADDRESS/mgmt/shared/workers/opt-policy

- Replace "ASM_IP_ADDRESS" with ASM mgmt IP and "XXXXXXX" with user basic authorization string
For more information and example about the request call, visit "ASM LX.postman_collection_v2.json"

=========================================================================================================================================================
