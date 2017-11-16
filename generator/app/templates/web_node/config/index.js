// TODO: generate config json via process.env.NODE_ENV

var path = require('path');
var fs = require('fs');

// Initialize logger
var logDir = path.resolve(__dirname, '../logs');
if ( !fs.existsSync( logDir ) ) {
    fs.mkdirSync( logDir );
}

var pkg = fs.readFileSync('package.json','utf-8');
pkg = JSON.parse(pkg);

var assetsMap = {
    'development': 'http://assets.xxxx.cc/xxxx/' + pkg.name + '-assets/1.0.0/',
    'local': 'http://local.xxxx.cc/' + pkg.name + '-assets/build/'
}
var hostMap = {
    'development': 'www.xxxx.cc',
    'local': 'local.xxxx.cc'
}

module.exports = {
    projectName: pkg.name,
    maxAge: 7*24*3600 * 1000,
    host: hostMap[process.env.NODE_ENV] ||  hostMap['development'],
    assets: assetsMap[process.env.NODE_ENV] || '//127.0.0.1:8001/build',
    userCenterPath: '/user-center/',
	logSettings: {
        level: 'DEBUG',
        ioLevel: 'DEBUG',
        appenders: [
            {
                type: 'console'
            }, {
                type: 'file',
                filename: logDir + '/example.log',
                category: ['example', 'console']
            }, {
                type: 'file',
                filename: logDir + '/express.log',
                category: 'express'
            }, {
                type: 'file',
                filename: logDir + '/io.log',
                category: 'io'
            }
        ],
        replaceConsole: true
    },
    database: {
        
    }
};