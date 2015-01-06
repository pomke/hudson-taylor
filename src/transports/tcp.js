"use strict";

const net = require("net");

const uid2 = require("uid2");

function TCPTransportServer(config) {

    let _TCPTransportServer = function(fn) {
        this.server = net.createServer(function(c) {
            c.on("data", function(_response) {

                let response           = JSON.parse(_response);
                let { id, name, data } = response;

                fn(name, data, function(error, d) {
                    let response = JSON.stringify({
                        data: d,
                        id,
                        error
                    });
                    c.write(response);
                });
            });
        });
    };

    _TCPTransportServer.prototype.listen = function(done) {
        let self = this;
        if(this.listening) {
            return done();
        }

        this.server.listen(config.port, config.host, function(err) {
            if(err) {
                return done(err);
            }
            self.listening = true;
            done();
        });
    };

    _TCPTransportServer.prototype.stop = function(done) {
        let self = this;
        if(!this.listening) {
            return done();
        }
        this.server.close(function(err) {
            if(err) {
                return done(err);
            }
            self.listening = false;
            done();
        });
    };

    return _TCPTransportServer;

}

function TCPTransportClient(config) {

    let _TCPTransportClient = function() {
        this.fns = {};
    };

    _TCPTransportClient.prototype.connect = function(done) {
        let self = this;
        // open a persistent connection to the server
        this.conn = net.createConnection(config.port, config.host);
        this.conn.setEncoding("utf8");
        this.conn.on("connect", function() {
            self.connected = true;
            done();
        });
        this.conn.on("data", function(d) {

            let response            = JSON.parse(d);
            let { id, error, data } = response;

            // find callback we stashed
            let fn = self.fns[id];
            if(!fn) {
                // unknown, drop
                return;
            }
            if(error) {
                return fn(error);
            } else {
                return fn(null, data);
            }
        });
    };

    _TCPTransportClient.prototype.disconnect = function(done) {
        if(!this.connected) {
            return done();
        }
        this.conn.end();
        this.connected = false;
        done();
    };

    _TCPTransportClient.prototype.call = function(method, data, callback) {
        if(!this.connected) {
            return callback({
                error: "disconnected"
            });
        }
        let id = uid2(10);
        let request = JSON.stringify({
            name: method,
            data,
            id
        });
        // stash callback for later
        this.fns[id] = callback;
        this.conn.write(request);
    };

    return _TCPTransportClient;

}

function TCPTransport(config) {
    this.Server = TCPTransportServer(config);
    this.Client = TCPTransportClient(config);
}

export default TCPTransport;
