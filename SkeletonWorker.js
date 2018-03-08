/*
 * Copyright (c) 2017, F5 Networks, Inc. All rights reserved.
 * No part of this software may be reproduced or transmitted in any
 * form or by any means, electronic or mechanical, for any purpose,
 * without express written permission of F5 Networks, Inc.
 */

/**
 * @class SkeletonWorker
 * @mixes RestWorker
 *
 * @description A simple worker that outlines functions that
 * can be defined and when and how they are called
 *
 * Called when the worker is loaded from disk and first
 * instantiated by the @LoaderWorker
 * @constructor
 */
function SkeletonWorker() {
    this.state = {};
}

/**
 * @required
 * @description The uri key registered to handle incoming requests
 * The url can be accessed on localhost at http://localhost:8105/WORKER_URI_PATH
 * or at http://host/mgmt/WORKER_URI_PATH if the worker is public
 * @type {string}
 */
SkeletonWorker.prototype.WORKER_URI_PATH = "shared/skeleton";

/**
 * @optional
 * @description specified if the worker is available off box.
 * adds a dependency to /forwarder worker
 * @default false
 * @type {boolean}
 */
SkeletonWorker.prototype.isPublic = true;

/**
 * @optional
 * @description specifies the F5 API LifeCycle state for the extension. The default is NO_STATUS.
 * @type {string}
 */
SkeletonWorker.prototype.apiStatus = "GA";


/******************
 * startup events *
 ******************/

/**
 * @optional
 *
 * @description onStart is called after the worker has been loaded and mixed
 * in with RestWorker. You would typically implement this function if you needed
 * to verify 3rd party dependencies exist before continuing to load your worker.
 *
 * @param {Function} success callback in case of success
 * @param {Function} error callback in case of error
 */
SkeletonWorker.prototype.onStart = function(success, error) {

    //if the logic in your onStart implementation encounters and error
    //then call the error callback function, otherwise call the success callback
    var err = false;
    if (err) {
        this.logger.severe("SkeletonWorker onStart error: something went wrong");
        error();
    } else {
        this.logger.info("SkeletonWorker onStart success");
        success();
    }
};

/**
 * @optional
 *
 * @description onStartCompleted is called after the dependencies are available
 * and state has been loaded from storage if worker is persisted with
 * isStateRequiredOnStart set to true. Framework will mark this worker available
 * to handle requests after success callback is called.
 *
 * @param {Function} success callback in case of success
 * @param {Function} error callback in case of error
 * @param {Object} state object loaded from storage
 * @param {Object|null} errMsg error from loading state from storage
 */
SkeletonWorker.prototype.onStartCompleted = function (success, error, state, errMsg) {
    if (errMsg) {
        this.logger.severe("SkeletonWorker onStartCompleted error: something went wrong " + errMsg);
        error();
    }

    this.logger.info("SkeletonWorker state loaded: " + JSON.stringify(state));
    success();
};

/*****************
 * http handlers *
 *****************/

/**
 * @optional
 * @description handle onGet HTTP request
 * @param {Object} restOperation
 */
SkeletonWorker.prototype.onGet = function(restOperation) {
    restOperation.setBody(this.state);
    this.completeRestOperation(restOperation);
    return;
};

/**
 * @optional
 * @description handle onPost HTTP request
 * @param {Object} restOperation
 */
SkeletonWorker.prototype.onPost = function(restOperation) {
    this.state = restOperation.getBody();
    this.completeRestOperation(restOperation);
};

/**
 * @optional
 * @description handle onPut HTTP request
 * @param {Object} restOperation
 */
SkeletonWorker.prototype.onPut = function(restOperation) {
    this.state = restOperation.getBody();
    this.completeRestOperation(restOperation);
};


/**
 * @optional
 * @description handle onPatch HTTP request
 * @param {Object} restOperation
 */
SkeletonWorker.prototype.onPatch = function(restOperation) {
    this.state = restOperation.getBody();
    this.completeRestOperation(restOperation);
};


/**
 * @optional
 * @description handle onDelete HTTP request
 * @param {Object} restOperation
 */
SkeletonWorker.prototype.onDelete = function(restOperation) {
    this.state = {};
    this.completeRestOperation(restOperation.setBody(this.state));
};

/********************
 * Helper Functions *
 ********************/

/**
 * @optional
 * @description Get example model for this REST resource
 * @returns {Object} object model example
 */
SkeletonWorker.prototype.getExampleState = function () {
    return {
        content: "sample data",
        integerContent: 1,
        stage: stageEnumValues[0]
    };
};


module.exports = SkeletonWorker;
