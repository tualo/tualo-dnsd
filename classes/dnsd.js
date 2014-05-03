"use strict";

var express = require('express'),
    path = require('path'),
    Queries = require('../classes/queries').Queries,
    tualo_extjs = require('tualo-extjs'),
    tualo_extjs_socketio = new (require('tualo-extjs-socketio')).LibLoader (),
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

    
    me.queries = new Queries(me.server);
    
    me.initSocketIO();
    me.initDnsService();
    me.initExpress();

    me.queries.on('create', function(data){
        me.io.of('/-/table').emit('create',{data: [data]});
    });
    me.queries.on('update', function(data){
        me.io.of('/-/table').emit('update',{data: [data]});
    });
    me.queries.on('destroy', function(data){
        me.io.of('/-/table').emit('destroy',{data: [data]});
    });
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
    me.io.of('/-/table').on('connection', function(socket){
        socket.on('read', function(data){
            socket.emit('read',{
                data: [],
                length: 0
            });
            console.log('table',data);
        });
    });
    me.io.of('/-/tree').on('connection', function(socket){
        socket.on('read', function(data){
            console.log(socket);
            if (JSON.stringify(data) === "{}"){
                socket.emit('read',
                            {
                                "text": ".",
                                "task": "Test 000",
                                        "id": 'root',
                                "children":[
                                    {
                                        "task": "Test 123",
                                        id: 1,
                                        "children":[
                                            {
                                                "task": "Test 1",
                                                id: 2,
                                                leaf: true
                                            },
                                            {
                                                "task": "Test 2",
                                                id: 3,
                                                leaf: true
                                            },
                                            {
                                                "task": "Test 3",
                                                id: 4,
                                                leaf: true
                                            }
                                        ]
                                    }
                                ]
                            }
                
            );
            console.log(data);
            }
            //socket.emit('read',me.queries.tree);
        });
    });
    me.timerIndex = 0;

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
    me.server.app.use(tualo_extjs.middleware.bind(me));
    me.server.app.use(tualo_extjs_socketio.middleware );
    me.server.app.get(me.server.configuration.basePath+'/',me.loadui.bind(me));
    me.server.app.post(me.server.configuration.basePath+'/',me.loadui.bind(me));

    me.server.app.all(me.server.configuration.basePath+'/t.json',function(req,res,next){
        console.log(req);
        res.json('200',{
                                "text": ".",
                                "task": "Test 000",
                                        "id": 'root',
                                "children":[
                                    {
                                        "task": "Test 123",
                                        id: 1,
                                        "children":[
                                            {
                                                "task": "Test 1",
                                                id: 2,
                                                leaf: true
                                            },
                                            {
                                                "task": "Test 2",
                                                id: 3,
                                                leaf: true
                                            },
                                            {
                                                "task": "Test 3",
                                                id: 4,
                                                leaf: true
                                            }
                                        ]
                                    }
                                ]
                            });
    });
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
        //console.log(request);
        if (typeof request.question !== 'undefined'){
            me.loopQuestions(request.question,function(answers){
                response.answer = answers ;
                
                try{
                    response.send();
                }catch(e){
                    try{
                        response.answer =[];
                        response.send();
                    }catch(e2){
                        me.logger.error(e2,answers);
                    }
                }
                
                //me.logger.info('*Finished processing request: ' + ( (new Date()).getTime() - start ).toString() + 'ms');
            });
        }else{
            response.send();
            me.logger.info('Somthing went wrong! Finished processing request: ' + ( (new Date()).getTime() - start ).toString() + 'ms');
        }


    });

    me.dnsd.on('error', function (err, buff, req, res) {
        me.logger.error(err.stack);
    });
    
    me.dnsd.serve(me.server.configuration.dnsd.port);
    me.logger.info('server port',me.server.configuration.dnsd.port);
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
        
        me.queries.resolve(questions[0],function(err,items){
            items.forEach(function (a) {
                answers.push(a);
            });
            me.loopQuestions(questions.slice(1),callback,answers);
        });
        
    }
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
