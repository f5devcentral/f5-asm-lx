This ASM iControl LX extension repository is intended to improve automation process by using declarative API operations.
The LX extension intended to provide IMPORT/EXPORT/DELETE ASM policy from VCS (version control system) such as GITHUB in simple API call.

===========================

CREATE ASM POLICY:

===========================

What the extension is doing:
1. Extension download the ASM XML policy from version control system (VCS) based on the parameter "policyvcsname" passed in the request
2. Extension transfer the VCS downloaded policy to ASM folder
3. Extension create new ASM policy and name it based on the parameter "policyname" passed in the request
4. Extension import the downloaded policy into the new created policy
5. Extension validate the import policy process and report back the results

How to Deploy the Extension:
1. Copy latest RPM package from https://github.com/f5devcentral/f5-asm-lx/blob/master/RPM/InstallPolicy-0.1.3-0003.noarch.rpm to your ASM folder "/var/config/rest/downloads/InstallPolicy-0.1.3-0003.noarch.rpm"
2. Install RPM package on ASM via the ASM CLI command:
curl -u user:pass -X POST http://localhost:8100/mgmt/shared/iapp/package-management-tasks -d '{ "operation":"INSTALL","packageFilePath": "/var/config/rest/downloads/InstallPolicy-0.1.3-0003.noarch.rpm"}'

- Replace "user:pass" with your ASM credentials
For More Information, Follow iControl extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx   

3. Add At least one DNS Resolving Server List on ASM: "tmsh modify sys dns name-servers add { 8.8.8.8 }"


How to Use The Extension:
1. Edit extension default  variables to your environment:

"username" - ASM user name
"password" - ASM user password
"ver" - ASM software Version
"DEBUG" - Enable or disable ASM logs - "true"  or "false"

2. Create POST call to the extension URL "ASM_IP_Address"/mgmt/shared/workers/install_policy"
3. Include HTTP Headers: "Content-Type: application/json" and "Authorization: Basic XXXXXXX"
4. Include parameter "policyvcsname" point the VCS policy URL and parameter "policyname" that the policy name will be.

See example below:

curl --insecure -d '{ "policyvcsname": "https://github.com/f5devcentral/f5-asm-policy-template-v13/raw/master/F5-ASM-GIT-Policy.xml", "policyname": "Declarative_API_Policy" }' -H "Content-Type: application/json" -H "Authorization: Basic XXXXXXXXX" -X POST https://ASM_IP_ADDRESS/mgmt/shared/workers/install_policy

- Replace "ASM_IP_ADDRESS" with ASM mgmt IP and "XXXXXXX" with user basic authorization string
For more information and example about the request call, visit "ASM LX.postman_collection_v2.json"

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
e.g: "/var/config/rest/downloads/InstallPolicy-0.1.4-0004.noarch.rpm"
2. Install RPM package on ASM via the ASM CLI command:
e.g: curl -u user:pass -X POST http://localhost:8100/mgmt/shared/iapp/package-management-tasks -d '{ "operation":"INSTALL","packageFilePath": "/var/config/rest/downloads/InstallPolicy-0.1.4-0004.noarch.rpm"}'

- Replace "user:pass" with your ASM credentials
For More Information, Follow iControl extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx   

3. Add At least one DNS Resolving Server List on ASM: "tmsh modify sys dns name-servers add { 8.8.8.8 }"

How to Use The Extension:
1. Edit extension default  variables to your environment:

"username" - ASM user name
"password" - ASM user password
"ver" - ASM software Version
"DEBUG" - Enable or disable ASM logs - "true"  or "false"
vcsusername - VCS user name that the policy will be uploaded
vcspassword - VCS user password that the policy will be uploaded
vcsrepo - VCS repository that the policy will be uploaded
vcspath - VCS repository folder that the policy will be uploaded

2. Create GET call to the extension URL "ASM_IP_Address"/mgmt/shared/workers/install_policy"
4. Include URL parameter name"policy" and value equal the policy name that will be uploaded to the VCS.

see example below:

curl --insecure -H "Authorization: Basic YWRtaW46YWRtaW4=" https://ASM_IP_ADDRESS/mgmt/shared/workers/install_policy?policy=ASM_POLICY_NAME

- Replace "ASM_IP_ADDRESS" with ASM mgmt IP and "XXXXXXX" with user basic authorization string
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
1. Copy latest RPM package from https://github.com/f5devcentral/f5-asm-lx/blob/master/RPM/InstallPolicy-0.1.3-0003.noarch.rpm to ASM /var/config/rest/downloads/" folder
2. Install RPM package to ASM: curl -u user:pass -X POST http://localhost:8100/mgmt/shared/iapp/package-management-tasks -d '{ "operation":"INSTALL","packageFilePath": "/var/config/rest/downloads/InstallPolicy-0.1.3-0003.noarch.rpm"}'

- Replace "user:pass" with your ASM credentials
For More Information, Follow iControl extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx

How to Use The Extension:
1. Edit extension default const variables to your environment: "username", "password", "ver", "DEBUG"
2. Create DELETE call to the extension URL "your_ASM_Address"/mgmt/shared/workers//install_policy"
3. Include HTTP Headers: "Content-Type: application/json" and "Authorization: Basic xxxxxxx"
4. Include parameter "policyname" and the policy name value.

see DELETE request example below:
curl --insecure -d '{ "policyname": "Declarative_API_Policy" }' -H "Content-Type: application/json" -H "Authorization: Basic xxxxxxx" -X DELETE https://ASM_IP_ADDRESS/mgmt/shared/workers/install_policy

- Replace "ASM_IP_ADDRESS" with ASM mgmt IP and "XXXXXXX" with user basic authorization string
For more information and example about the request call, visit "ASM LX.postman_collection_v2.json"

=========================================================================================================================================================
