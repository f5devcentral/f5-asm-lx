==================================

# Opt-Policy

==================================

This ASM iControl LX extension repository is intended to improve automation process by using declarative API operations.
The LX extension intended to provide policy operation such IMPORT/EXPORT/DELETE ASM policy from VCS (version control system) in simple API call.

==================================

## How to Deploy the Extension on ASM

==================================

1. Copy latest RPM package:

  - Copy extension package from _https://github.com/f5devcentral/f5-asm-lx/blob/master/RPM/_ folder to local ASM folder:
   _"/var/config/rest/downloads/"_

2. Install RPM package:

- Install the extension on ASM via ASM CLI command:
```sh
$ curl -u <user:pass> -X POST http://localhost:8100/mgmt/shared/iapp/package-management-tasks -d '{ "operation":"INSTALL","packageFilePath":
"/var/config/rest/downloads/<rpm_file>"}'
```
- Replace \<user:pass\> with the ASM credentials
- Replace \<rpm_file\> with the latest rpm file

For More Information, Follow iControl deployment extension guide: https://devcentral.f5.com/Wiki/iControlLX.HowToSamples_deploy_icontrol_extension.ashx

3. Set environment variables:

- Edit the following variables to your environment via ASM CLI command:

```sh
$ vi /var/config/rest/iapps/OptPolicy/nodejs/opt-policy.js

    bigipusername = "replace with bigip username"
    bigippassword = "replace with bigip password"
    vcsusername = "replace with vcs username"
    vcspassword = "replace with vcs password"
    vcsemail = "replace with vcs email"
    vcsrepo = "replace with vcs repo name"
    vcspath = "replace with vcs path name"
    bigipver = "replace with bigip version"
    DEBUG = false
  ```
- set all variables to the local envrioment
- for debug purpose, change the DEBUG variable from false to true and check logs at "/var/log/restnoded/restnoded.log"

4. Restart the ASM restnoded service to upload the new extension via ASM CLI command:

```sh
$ restcurl shared/nodejs/loader-path-config -d '{"workerPath": "/var/config/rest/iapps/OptPolicy"}'
```

5. Add at least one DNS resolving server list on ASM configuration via ASM CLI command:

```sh
$ "tmsh modify sys dns name-servers add { x.x.x.x }"
```

======================================

## IMPORT ASM POLICY:

======================================

### What the extension is doing:
1. Extension download the ASM XML policy from version control system (VCS) based on the parameter "policyvcsname" passed in the request
2. Extension transfer the VCS downloaded policy to ASM folder
3. Extension import the downloaded policy and name it as describe in the "policyname" parameter passed in the request
4. Extension validate the import policy process and report back the results


### How to Use The Extension:
1. Create POST call to the extension URL "https://\<bigipaddress\>/mgmt/shared/workers/opt-policy"
2. Include HTTP Headers: "Content-Type: application/json" and "Authorization: Basic xxxxxx"
3. Include parameter "policyvcsname" point to the VCS policy URL and parameter "policyname" that indicate what will be the policy name.
4. Include parameter "policyparentname" for child policy type only - add additional parameter "policyparentname" that refer to the parent policy name (Parent policy should be imported or exist before importing child policy). No need to add if the policy is not a child type policy

See import examples below for different policy types:

1. Security Policy With No Child:
```sh
$ curl --insecure -d '{ "policyvcsname": "https://URL/policy.xml", "policyname": "<policy_name>" }' -H "Content-Type: application/json" -H "Authorization: Basic <auth_hash>" -X POST https://<bigipaddress>/mgmt/shared/workers/opt-policy
```
2. Parent Policy:
```sh
$ curl --insecure -d '{ "policyvcsname": "https://URL/policy.xml", "policyname": "<policy_name>" }' -H "Content-Type: application/json" -H "Authorization: Basic <auth_hash>" -X POST https://<bigipaddress>/mgmt/shared/workers/opt-policy
```
3. Security Policy Child With Parent:
```sh
$ curl --insecure -d '{ "policyvcsname": "https://URL/policy.xml", "policyname": "<policy_name>", "policyparentname": "<parent_policy_name>" }' -H "Content-Type: application/json" -H "Authorization: Basic <auth_hash>" -X POST https://<bigipaddress>/mgmt/shared/workers/opt-policy
```

- Replace \<https://URL/policy.xml\> with URL that the ASM policy is located
- Replace \<bigipaddress\> with ASM mgmt IP and \<auth_hash\> with user basic authorization string
- Replace \<policy_name\> with the ASM policy name that will be exported to the VCS
- Replace \<parent_policy_name\> with the ASM policy name that will be exported to the VCS


======================================

## EXPORT ASM POLICY:

======================================

### What the extension is doing:
1. Extension export the ASM XML policy from ASM to local folder
2. Extension validate that the export ASM policy done successfully
3. Extension download the policy to ASM local folder
3. Extension upload the exported policy to VCS repository and provide back the result to the caller  

### How to Use The Extension:
1. Create GET call to the extension URL https://<bigipaddress>/mgmt/shared/workers/git-policy"
2. Include URL parameter name "policy" value equal the policy name that will be uploaded to the VCS.

see example below:

```sh
$ curl --insecure -H "Authorization: Basic <auth_hash>" https://<bigipaddress>/mgmt/shared/workers/opt-policy?policy=<policy_name>
```

- Replace \<bigipaddress\> with ASM mgmt IP and <auth_hash> with user basic authorization string
- Replace \<policy_name\> with the ASM policy name that will be exported to the VCS


====================================

## DELETE ASM POLICY:

====================================

### What the extension is doing:
1. Extension extract the policy Id from the ASM based on the policy name provided in the request call
2. Extension validate if the policy Id is exist in ASM
3. Extension delete the policy from the ASM based on the policy Id and report back the results

### How to Use The Extension:
1. Create DELETE call to the extension URL _https:<bigip_address>"/mgmt/shared/workers//opt-policy_
2. Include HTTP Headers: _"Content-Type: application/json" and "Authorization: Basic <auth_hash>"_
3. Include body parameter name _"policyname"_ and the policy name as value.

see example below:

```sh
$ curl --insecure -d '{ "policyname": "<policy_name>" }' -H "Content-Type: application/json" -H "Authorization: Basic <auth_hash>" -X DELETE https://<bigipaddress>/mgmt/shared/workers/opt-policy
```

- Replace \<bigipaddress\> with ASM mgmt IP and "\<auth_hash\>" with user basic authorization string
- Replace \<policy_name>\> with the ASM policy name that will be exported to the VCS
