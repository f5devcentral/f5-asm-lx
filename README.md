This ASM iControl LX extension repository is intended to improve automation process by using declarative API extensions.
The LX extension will be divided into CRUD operations:


====================

Install ASM policy:

====================

What the extension is doing:
1. Extension pull the ASM XML policy from version control system
2. Extension transfer the ASM XML policy as base64 to the BIGIP
3. Extension create new ASM policy and name it as the pulled policy filename
4. Extension import the pulled policy into the new created policy
5. Extension validate the import policy process and provide back the results

How to Deploy extension: Two options

First Option:
1. Copy "Install Policy" extension code file: "installpolicy.js" from the repository into your BIGIP
2. Follow the instruction to deploy LX Control extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx
3. Add "request" module to support the extension:

   a. Login to the BIGIP cli
   b. Change directory to: '/var/config/rest/iapps/"your_project_name"/'
   c. Install "request" module by clicking: "npm install request"  

Second Option:
1. Copy lastest RPM package from https://github.com/nashkenazi/LX-ASM/tree/master/RPM
2. Follow the instruction to deploy RPM iControl extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx

How to Use Extension:
1. Edit extension default const variables to your environment: "username", "password", "ver", "DEBUG"
2. Create POST call to the extension URL "your_BIGIP_Address"/mgmt/shared/workers/install_policy"
3. Include HTTP Headers: "Content-Type: application/json" and "Authorization: Basic xxxxxxx"
4. Include JSON body type name "policyvcsname" and value, point to the version control URL. see example below:
{ "policyvcsname": "https://raw.githubusercontent.com/nashkenazi/ASM-Templates/master/Sharepoint_2016_Template_6.0_v13.1.0.1.xml" }

==============================================================================================================================================

====================

Delete ASM policy:

====================

What the extension is doing:
1. Extension get the policy ID from the BIGIP based on the policy name
2. Extension validate policy Id provided is exist
3. Extension delete the policy from the BIGIP based on the policy Id and provide back the results

How to Deploy extension: Two options

First Option:
1. Copy "Install Policy" extension code file: "installpolicy.js" from the repository into your BIGIP
2. Follow the instruction to deploy LX Control extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx
3. Add "request" module to support the extension:

   a. Login to the BIGIP cli
   b. Change directory to: '/var/config/rest/iapps/"your_project_name"/'
   c. Install "request" module by clicking: "npm install request"  

Second Option:
1. Copy lastest RPM package from https://github.com/nashkenazi/LX-ASM/tree/master/RPM
2. Follow the instruction to deploy RPM iControl extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx

How to Use Extension:
1. Edit extension default const variables to your environment: "username", "password", "ver", "DEBUG"
2. Create DELETE call to the extension URL "your_BIGIP_Address"/mgmt/shared/workers//install_policy"
3. Include HTTP Headers: "Content-Type: application/json" and "Authorization: Basic xxxxxxx"
4. Include JSON body type name "policyname" and value, point to the version control URL. see example below:
{ "policyname": "Sharepoint_2016_Template_6.0_v13.1.0.1" }

==============================================================================================================================================
