"use strict";

/**
* @class Logger
*
* The Logger class is normaly accessible throug the Office.logger property. 
* You don't need to instanciate in manually.
*
* This class can be used to display:
* - Errors
* - Warnings
* - Informations
* - Debug-Informations
*
*/
var Logger = function(config){
    this.config = config;
    this.levels = [
        { type:'error', color: '31' },
        { type:'warn', color: '33' },
        { type:'info', color: '36' },
        { type:'debug', color: '90' }
    ];
}

/**
* @method argToArray
*
* This method returns tranforms  the given arguments into an array, without
* the this property.
* 
* @param {Array} args The arguments array.
* @return {Array} The transformed array.
*/

Logger.prototype.argToArray = function(args) {
    var res = [],
        i;
    for( i in args){
        res.push(args[i]);
    }
    return res;
}

/**
* @method pad
*
* Adds white spaces at the end of str if the length is 
* shorter than max.
* 
* @param {String} str The string.
* @param {Number} max The resulting length.
* @return {String}
*/
Logger.prototype.pad = function(str,max) {
    if (typeof max === 'undefined'){
    max=6;
    }
  if (str.length < max)
    return str + new Array(max - str.length + 1).join(' ');
  return str;
}

/**
* @method logToConsole
*
* This method is used internaly for printing the messages to the console,
* if the console logging is enabled in the configuration.
* 
* @param {Number} index The index of the log type, for choosing color and log tag.
* @param {Array} args The arguments-array.
*
*/
Logger.prototype.logToConsole =  function(index,args){
    
    var msgArgs = [this.pad(this.levels[index].type)].concat(args);
    switch(index){
        case 0:
            console.log.apply(this,msgArgs);
            break;
        case 1:
            console.log.apply(this,msgArgs);
            break;
        case 2:
            console.log.apply(this,msgArgs);
            break;
        case 3:
            console.log.apply(this,msgArgs);
            break;
    }
}

/**
* @method error
*
* This method logs an error message,
* if the error message logging is enabled in the configuration.
* 
*/
Logger.prototype.error = function(){
    if (this.config.errors === true){
        this.logToConsole(0,this.argToArray(arguments));
    }
}

/**
* @method warn
*
* This method logs an warn message,
* if the warn message logging is enabled in the configuration.
* 
*/
Logger.prototype.warn = function(){
    if (this.config.warnings === true){
        this.logToConsole(1,this.argToArray(arguments));
    }
}

/**
* @method info
*
* This method logs an info message,
* if the info message logging is enabled in the configuration.
* 
*/
Logger.prototype.info = function(){
    if (this.config.informations === true){
        this.logToConsole(2,this.argToArray(arguments));
    }
}

/**
* @method debug
*
* This method logs an debug message,
* if the debug message logging is enabled in the configuration.
* 
*/
Logger.prototype.debug = function(){
    if (this.config.debugs === true){
        this.logToConsole(3,this.argToArray(arguments));
    }
}

exports.Logger = Logger;