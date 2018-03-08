function ImportPolicy() {}

ImportPolicy.prototype.WORKER_URI_PATH = "asm/import_policy";
ImportPolicy.prototype.isPublic = true;

ImportPolicy.prototype.onStart = function(success, error) {

    var err = false;
    if (err) {
        this.logger.severe("ImportPolicy onStart error: something went wrong");
        error();
    } else {
        this.logger.info("ImportPolicy onStart success");
        success();
    }
};

ImportPolicy.prototype.onPost = function(restOperation) {
    this.logger.info("Request to Create new Policy Started");

    var PolicyName = restOperation.getBody().name;
    this.logger.info("New Policy Name is: " + PolicyName);

    var options = {
        "method": "POST",
        "hostname": "10.241.188.23",
        "port": null,
        "path": "/mgmt/tm/asm/policies",
        "headers": {
            "authorization": "Basic YWRtaW46YWRtaW4=",
            "content-type": "application/json",
            "cache-control": "no-cache",
            "postman-token": "517ccc08-4f46-9c2f-86bb-cd84f96ae749"
        }
    };

    var req = http.request(options, function (res) {


        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = JSON.parse(Buffer.concat(chunks));
            logger.info("New Policy ID is: " + body.id);
        });
    });

    req.write(JSON.stringify({ name: PolicyName }));
    req.end();

    this.completeRestOperation(restOperation);
};

module.exports = ImportPolicy;
