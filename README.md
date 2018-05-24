This ASM iControl LX extension repository is intended to improve automation process by using declarative API operations.
The LX extension will be divided into CRUD (Create/Read/Update/Delete) operations for ASM policy.



===========================

CREATE ASM Policy operation:

===========================

What the extension is doing:
1. Extension download the ASM XML policy from version control system (VCS) based on the URL provided in the request call
2. Extension transfer downloaded policy to ASM
3. Extension create new ASM policy and name it as the downloaded policy filename
4. Extension import the downloaded policy into the new created policy
5. Extension validate the import policy process and report back the results

How to Deploy the Extension:
1. Copy latest RPM package from https://github.com/f5devcentral/f5-asm-lx/blob/master/RPM/InstallPolicy-0.1.2-0002.noarch.rpm to ASM /var/config/rest/downloads/" folder
2. Install RPM package to ASM: 
curl -u user:pass -X POST http://localhost:8100/mgmt/shared/iapp/package-management-tasks -d '{ "operation":"INSTALL","packageFilePath": "/var/config/rest/downloads/InstallPolicy-0.1.2-0002.noarch.rpm"}'
- Replace "user:pass" with your ASM credentials

For More Information, Follow iControl extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx

3. Add At least one DNS Resolving Server List on ASM: "tmsh modify sys dns name-servers add { 8.8.8.8 }"

How to Use The Extension:
1. Edit extension default const variables to your environment: "username", "password", "ver", "DEBUG"
2. Create POST call to the extension URL "your_ASM_Address"/mgmt/shared/workers/install_policy"
3. Include HTTP Headers: "Content-Type: application/json" and "Authorization: Basic xxxxxxx"
4. Include JSON body type name "policyvcsname" and value, point to the version control URL. see example below:
{ "policyvcsname": "https://github.com/f5devcentral/f5-asm-policy-template-v13/raw/master/F5-ASM-GIT-Policy.xml" }

See more information and example in "ASM LX.postman_collection.json"
=======================================================================================================================================================


============================

DELETE ASM Policy operation:

============================

What the extension is doing:
1. Extension extract the policy ID from the ASM based on the policy name provided in the request call
2. Extension validate the policy Id provided is exist in ASM
3. Extension delete the policy from the ASM based on the policy Id and report back the results

How to Deploy The Extension:
1. Copy latest RPM package from https://github.com/f5devcentral/f5-asm-lx/blob/master/RPM/InstallPolicy-0.1.2-0002.noarch.rpm to ASM /var/config/rest/downloads/" folder
2. Install RPM package to ASM: curl -u user:pass -X POST http://localhost:8100/mgmt/shared/iapp/package-management-tasks -d '{ "operation":"INSTALL","packageFilePath": "/var/config/rest/downloads/InstallPolicy-0.1.2-0002.noarch.rpm"}'

Replace "user:pass" with your ASM credentials
For More Information, Follow iControl extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx

How to Use The Extension:
1. Edit extension default const variables to your environment: "username", "password", "ver", "DEBUG"
2. Create DELETE call to the extension URL "your_ASM_Address"/mgmt/shared/workers//install_policy"
3. Include HTTP Headers: "Content-Type: application/json" and "Authorization: Basic xxxxxxx"
4. Include JSON body type name "policyname" and value, point to the version control URL. see example below:
{ "policyname": "F5-ASM-GIT-Policy" }

See more information and example in "ASM LX.postman_collection.json"
=========================================================================================================================================================
