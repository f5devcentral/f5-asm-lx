logger = require('f5-logger').getInstance();
var WorkerName = "Import Policy";
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
    var newData = restOperation.getBody().SomeData;
    this.logger.info("SomeData is:"+newData);
};

/**
 * handle /example HTTP request
 */
ImportPolicy.prototype.getExampleState = function () {
    return {
        "value": "your_string"
    };
};

module.exports = ImportPolicy;

