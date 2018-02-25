/**
* A simple iControlLX extension that handles only HTTP GET
*/
function HelloWorld() {}

HelloWorld.prototype.WORKER_URI_PATH = "ilxe_lab/hello_world";
HelloWorld.prototype.isPublic = true;

/**
* Perform worker start functions
*/

HelloWorld.prototype.onStart = function(success, error) {

  logger.info("HelloWorld onStart()");

  var options = {
    "method": "GET",
    "hostname": "raw.githubusercontent.com",
    "port": null,
    "path": "",
    "headers": {
      "cache-control": "no-cache"
    }
  };

  var req = http.request(options, function (res) {

    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      this.state = JSON.parse(body);
    });
  });

  req.end();

  success();
};

/**
* handle onGet HTTP request
*/
HelloWorld.prototype.onGet = function(restOperation) {
  restOperation.setBody(this.state);
  this.completeRestOperation(restOperation);
};

/**
* handle /example HTTP request
*/
HelloWorld.prototype.getExampleState = function () {
  return {
    "value": "your_string"
  };
};

module.exports = HelloWorld;
