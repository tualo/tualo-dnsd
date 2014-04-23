"use strict";
var path = require('path'),
    fs = require('fs'),
    http = require('http'),
    express = require('express'),
    DNSD = require('../classes/dnsd').DNSD,
    Logger = require('../classes/logger').Logger,
    configOrder = [
        path.join(path.sep,'etc','tualo-dnsd','config.json'),   
        path.join(__dirname,'..','config','config.json'),   
        path.join(__dirname,'..','config','sample-config.json')    
    ];


/**
* @class Server
* The Server class creates an single instance of the server.
*
* If no config file is given it searches for that in the following.
* directories:
*     - /etc/tualo-dnsd/config.json
*     - [application-location]/config/config.json
*     - [application-location]/config/sample-config.json
* 
* The configuration properties in the configuration file overrides 
* the default settings for the server. So if you don't modify a default,
* it will be used.
*/
var Server = function(configFile){
    var tmpConfigs = configOrder,
        i;
    configOrder = [];
    if (typeof configFile === 'string'){
        configOrder.push(Path.resolve(configFile));
    }
    for(i=0;i<tmpConfigs.length;i++){
        configOrder.push( tmpConfigs[i] );
    }
    
    // Creates a server instance with the default configuration.
    /** 
    * @property {Object} [configuration=undefined] Keeps the configuration. 
    * @property {String} [configuration.host=127.0.0.1] The IP address server is bind to.
    * @property {Number} [configuration.port=8080] The port the server should listen to.
    * @property {Boolean} [configuration.useTLS=false] Should the connection be encrypted?.
    * @property {String} [configuration.sessionSecret=i am not very secret] The secret phrase for encrypting the sessions.
    * @property {String} [configuration.cookieSecret=i am the cookie secret, change me!] The secret phrase for encrpting the cookies.
    * @property {String} [configuration.basePath=] The base path all request will uses.
    */
    this.configuration = {
        dnsd:{
            port: 9999 
        },
        frontend:{
            address: '127.0.0.1', 
            port: 8010,
            basePath: ''
        },
        storage: 'memory',
        basePath: '',
        log:{
            console: true,
            errors: true,
            warnings: true,
            informations: true,
            debugs: true
        }
    }
}

Server.prototype.start = function(){
    // At the startup the server searches for an configuration file.
    this.findConfiguration();
}

Server.prototype.applyIf = function(obj,config){
    var i;
    for(i in config){
        if (typeof obj[i] === 'undefined'){
            obj[i] = config[i];
        }
    }
    return obj;
}

Server.prototype.findConfiguration =  function(index){
    var config,
        doInitializing = false,
        me = this;
    if (typeof index === 'undefined'){
        index=0;
    }
    if (index === configOrder.length){
        console.warn('error','There is no configuration file. ',configOrder.length);
        me.initialize();
        return;
    }
    //console.log('debug','Testing ...',configOrder[index]);
    fs.exists(configOrder[index],function(exists){
        if (exists){
            try{
                config = require(configOrder[index]);
                me.configuration = me.applyIf(config,me.configuration);
                doInitializing = true;
            }catch(e){
                console.error('error','The configuration is invalid. '+e);
            }
            if (doInitializing){
                me.initialize();
            }
        }else{
            me.findConfiguration(index+1);
        }
    });
}

Server.prototype.initialize =  function(){
    var me = this,
        config = me.configuration,
        service = new DNSD(me);
    me.logger = new Logger(me.configuration.log);
    me.app = express();
    service.logger = me.logger;
    

    me.httpServer = http.createServer(me.app);
    me.httpServer.listen(config.frontend.port,config.frontend.address, function(){
        me.logger.info("the frontend service is listening on "+config.frontend.address+":" + config.frontend.port);
    });
    service.initialize();
}

exports.Server = Server;