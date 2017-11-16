var config = require('../config/')
var dnode = require('dnode');
var rpc;
var connected = false;
var remoteServer;
var trying = false;
var tryCount = 1;
var cache = [];



function retry () {
    trying = true;
    tryCount++;
    rpc = dnode.connect(5556, config.host);
    rpc.on('remote', function (remote) {
        remoteServer = remote;
        connected = true;
        trying = false;
        tryCount = 1;
        cache.forEach( function (item) {
            item();
        });
        cache = [];
    });

    rpc.on('fail', function (error) {
        console.log(error);
        rpc.end();
    });
    rpc.on('error', function (error) {
        console.log(error);
    });
    rpc.on('end', function (error) {
        connected = false;
        trying = false;
        console.log(error);

        tryCount < 10 && setTimeout( function () {
            retry();
        }, 5000);
    });
}

retry();

module.exports = {
    isLoggedIn: function (token, cb) {
        if (connected) {
            remoteServer.isLoggedIn(token, cb)
        } else  {
            cache.push(remoteServer.isLoggedIn.bind(remoteServer, token, cb));
            //!trying && retry();
        }
    },
    logout: function (token) {
        if (connected) {
            remoteServer.logout(token);
        } else {
            cache.push(remoteServer.logout.bind(remoteServer, token));
            //!trying && retry();
        }
    },
    checkUser: function (username, cb) {
        if (connected) {
            remoteServer.checkUser({username: username}, cb);
        } else {
            cache.push(remoteServer.checkUser.bind(remoteServer, {username: username}, cb));
        }
        
    },
    queryUsers: function (data, cb) {
        if (connected) {
            remoteServer.queryUsers(data, cb);
        } else {
            cache.push(remoteServer.queryUsers.bind(remoteServer, data, cb));
        }
    },
    getUsersByNames: function (names, cb) {
        if (connected) {
            remoteServer.getUsersByNames(names, cb);
        } else {
            cache.push(remoteServer.queryUsers.bind(remoteServer, names, cb));
        }
    }
};
