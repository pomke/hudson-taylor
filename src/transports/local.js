
"use strict";

let fn;

function LocalTransportServer(_fn) {
    fn = _fn;
}

LocalTransportServer.prototype.listen = function(done) {
    done();
};

LocalTransportServer.prototype.stop = function(done) {
    done();
};

function LocalTransportClient() {

}

LocalTransportClient.prototype.connect = function(done) {
    done(); //noop
};

LocalTransportClient.prototype.disconnect = function(done) {
    done(); //noop
};

LocalTransportClient.prototype.call = function(method, data, callback) {
    // force data to be passed through as valid json
    // both the input, and the response from the service
    forceJSON(data, function(err, data) {
        if(err) {
            return callback(err);
        }
        fn(method, data, function(err, response) {
            if(err) {
                return forceJSON(err, function(err2, data) {
                    if(err2) {
                        return callback(err2);
                    }
                    return callback(data)
                });
            }
            forceJSON(response, callback);
        });
    });
};

function LocalTransport() {
    this.Server = LocalTransportServer;
    this.Client = LocalTransportClient;
}

export default LocalTransport;

function forceJSON(input, callback) {
    // JSON.stringify can throw on circular structures
    try {
        input = JSON.parse(JSON.stringify(input));
    } catch(e) {
        return callback(e);
    }
    return callback(null, input);
}