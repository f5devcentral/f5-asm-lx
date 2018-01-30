/**
* A simple iControl LX extension that handles only HTTP GET
*/
function HelloWorld() {}

HelloWorld.prototype.WORKER_URI_PATH = "ilxe_lab/hello_world";
HelloWorld.prototype.isPublic = true;

/**
* handle onGet HTTP request
*/
HelloWorld.prototype.onGet = function(restOperation) {
  restOperation.setBody(JSON.stringify( { value: "Hello World!" } ));
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
