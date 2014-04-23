"use strict";

var express = require('express'),
    path = require('path'),
    dns = require('dns'),
    nativedns = require('native-dns');

/**
* @class DNSD
* The main class `DNSD` represents the basic service.
* This class will be instanciate by the server it self. 
* You don't have to create the object by yourself.
*/
var DNSD = function(server){
    // With the `server` object you have direct access to the
    // server instance.
    this.server = server;
    /**
    * @property {Logger} logger an instance of Logger.
    */
    this.logger = {
        log: function(){},
        error: function(){},
        warn: function(){},
        info: function(){},
        debug: function(){}
    };
    // The `cookies` object is an instance of the `Cookies`-class
    //this.cookies = new Cookies(this.server);
}



/**
* @method initialize
* This method initializes the DNSD application, 
* by loading setting all middlewares, static routes and so on ...
* @return void
*/
DNSD.prototype.initialize = function(){
    var me = this;
    me.initSocketIO();
    me.initDnsService();
    me.initExpress();

}

/**
* @method initSocketIO
* This method binds the socket.io 
* @return void
*/
DNSD.prototype.initSocketIO = function(){
    var me = this;
    me.io = require('socket.io').listen(me.server.httpServer);
    me.io.set('log level',1);
    me.io.sockets.on('connection', me.onSocketConnection.bind(me));
}

/**
* @method initExpress
* This method sets the express server 
* @return void
*/
DNSD.prototype.initExpress = function(){
    var me = this;
    me.server.app.set('views', path.join(__dirname ,'..', 'views'));
    me.server.app.set('view engine', 'jade');
    me.server.app.use(express.static('public'));
    me.server.app.use(me.middleware.bind(me));
    me.server.app.get(me.server.configuration.basePath+'/',me.loadui.bind(me));
    me.server.app.post(me.server.configuration.basePath+'/',me.loadui.bind(me));

}

/**
* @method initDnsService
* This method starts the DNS Service 
* @return void
*/
DNSD.prototype.initDnsService = function(){
    var me = this;
    me.dnsd = nativedns.createServer();

    me.dnsd.on('request', function (request, response) {
        var start = (new Date()).getTime();
        if (typeof request.question !== 'undefined'){
            me.loopQuestions(request.question,function(answers){
                response.answer = answers ;
                response.send();
                me.logger.info('Finished processing request: ' + ( (new Date()).getTime() - start ).toString() + 'ms');
            });
        }else{
            response.send();
            me.logger.info('Finished processing request: ' + ( (new Date()).getTime() - start ).toString() + 'ms');
        }
        
        
    });

    me.dnsd.on('error', function (err, buff, req, res) {
        me.logger.error(err.stack);
    });

    me.dnsd.serve(me.server.configuration.dnsd.port);
}

/**
* @method loopQuestions
* This method loops throug the incomming DNS questions the DNS Service,
* If no question is unresponded the callback function will be invoked.
*
* The callback function will be called with the answers parameter.
*
* @param {Array} questions an array of questions
* @param {Function} callback the callback function
* @param [{Array}] answers an optional array of answers
* @return void
*/
DNSD.prototype.loopQuestions=function(questions,callback,answers){
    var me = this,
        dnsRequest,
        dnsQuestion;
    
    if (typeof answers === 'undefined'){
        answers = [];
    }
    
    if (questions.length === 0){
        callback(answers);
    }else{
        dnsQuestion = nativedns.Question(questions[0]);
        
        dnsRequest = nativedns.Request({
            question: dnsQuestion,
            server: { address: '8.8.8.8', port: 53, type: 'udp' },
            timeout: 1000
        });

        dnsRequest.on('timeout', function () {
            //console.log('Timeout in making request');
        });

        dnsRequest.on('message', function (err, msg) {
            msg.answer.forEach(function (a) {
                answers.push(a);
            });
        });

        dnsRequest.on('end', function () {
            me.loopQuestions(questions.slice(1),callback,answers);
        });
        dnsRequest.send();

    }
}

/**
* @method onSocketConnection
* On every new socket.io connection this method will be called.
*/
DNSD.prototype.onSocketConnection = function(socket){
    //var name = userNames.getGuestName();
    //this.logger.debug('socket','name',name);
    socket.emit('init', {
        
    });
}


/**
* @method loadui
* This method will be called on every http post or get request 
* on the server configurations base path.
* 
* @param {String} request the http-request given by the express framework
* @param {String} result the http-result given by the express framework
* @param {Function} next the next-function given by the express framework
* @return void
*/
DNSD.prototype.loadui = function(request,result,next){
    var me = this;
    // todo: decide whenever the session is is logget in, load the main view
    return result.render('index',{});
}

/**
* @method middleware
* This method will be called on every http post or get request.
* It adds the basic locals to the result object.
* 
* @param {String} request the http-request given by the express framework
* @param {String} result the http-result given by the express framework
* @param {Function} next the next-function given by the express framework
* @return void
*/
DNSD.prototype.middleware = function(request,result,next){
    var me = this;
    result.locals.basePath = this.server.configuration.basePath;
    next();
}

exports.DNSD = DNSD;
