var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var log4js = require('log4js');
var logger = log4js.getLogger('express');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var promisedHandlebars = require('promised-handlebars');
var Handlebars = promisedHandlebars(require('handlebars'));
var request = require('request-promise');
var fs = require('fs');
//var fsp = require('fs-promise');
var path = require('path');
var i18n = require('i18n');
var app = express();
i18n.configure({
    locales:['zh-cn', 'en'],
    directory: __dirname + '/i18n/locales',
    defaultLocale: 'zh-cn',
    cookie: 'lang'
});

// define the template engine
var templates = {};
app.engine('html', function (filePath, options, callback) {
    var tpl = templates[filePath];
    if (tpl && process.env.NODE_ENV === 'production') {
        tpl(options).then( function (data) {
            callback(null, data);
        });
        return;
    }
    fs.readFile(filePath, function (err, content) {
        if (err) {
            return callback(new Error(err));
        }
        content = content + '';
        templates[filePath] = Handlebars.compile(content);
        templates[filePath](options).then( function (data) {
            callback(null, data);
        }); 
    });
});
var templateNames = {};
var commonTemplates = {};
Handlebars.registerHelper('commonTemplate', function (name) {
    var opt = arguments[arguments.length - 1].data.root;
    opt.lang = opt.lang || 'zh-cn';
    templateNames[name] = 1;

    return (commonTemplates[name] ? Promise.resolve(commonTemplates[name]) : 
                requestTemplate(name)).then( function (res) {
                    
        var tmplete = res[0];
        var i18n = res[1];

        opt = Object.assign(opt, i18n[opt.lang] || {});

        return tmplete(opt);
    }).then( function (data) {
        return data;
    }).catch( function (error) {
        logger.error(error);
    });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(log4js.connectLogger(logger, {level: 'auto'}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(i18n.init);
app.use('/sso', require('./routes/sso'));
app.all('*', require('./routes/auth'));
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

function requestTemplate(name) {
    var  html = `http://assets.xxxx.cc/common-template/${name}/index.html`;
    var  i18n = `http://assets.xxxx.cc/common-template/${name}/i18n.json`;

    return Promise.all([request(html), request(i18n)]).then( function (res) {
        res[0] = Handlebars.compile(res[0]);
        res[1] = JSON.parse(res[1] || '{}');
        commonTemplates[name] = res;
        return res
    });
}
setInterval( function () {
    for (var i in templateNames) {
        requestTemplate(i).then( function (){});
    }
}, 5 * 60 * 1000);


module.exports = app;
