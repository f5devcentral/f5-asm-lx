This ASM iControl LX extension repository is intended to improve automation process by using declarative API extensions.
The LX extension will be divided in to four CRUD operations:


====================

Install  ASM policy: The LX extension will pull ASM policy from any version control URL, create new policy and import the policy into it.

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
2. Follow the instruction to deploy iControl extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx
3. Add "request" module to support the extension:

   a. Login to the BIGIP cli
   b. Change directory to: '/var/config/rest/iapps/"your_project_name"/'
   c. Install "request" module by clicking: "npm install request"  

Second Option:
1. Copy lastest RPM package from https://github.com/nashkenazi/LX-ASM/tree/master/RPM
2. Follow the instruction to deploy RPM iControl extension: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx

How to Use Extension:
1. Edit extension default const variables to your environment: "username", "password", "ver", "DEBUG"
2. Create POST call to the extension URL "your_BIGIP_Address"/mgmt/asm/install_policy"
3. Include HTTP Headers: "Content-Type: application/json" and "Authorization: Basic xxxxxxx"
4. Include JSON body type name "policyvcsname" and value, point to the version control URL. see example below:
{ "policyvcsname": "https://raw.githubusercontent.com/nashkenazi/ASM-Templates/master/Sharepoint_2016_Template_6.0_v13.1.0.1.xml" }

==============================================================================================================================================
