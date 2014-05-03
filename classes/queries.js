'use strict';
var util = require("util"),
    events = require("events"),
    nativedns = require('native-dns'),
    fs = require('fs'),
    path = require('path');

var Queries = function(server){
    this.server = server;
    this.list = {};
    this.timerList = {};
    this.tree = {};
    events.EventEmitter.call(this);
    this.readCache();
    setInterval(this.writeCache.bind(this),5000);
}
util.inherits(Queries, events.EventEmitter);

Queries.prototype.writeCache = function(){
    var me = this;
    fs.writeFile(path.join(__dirname,'..','config','cache.json'),JSON.stringify(me.tree,null,4), function (err){
        
    });
    
}

Queries.prototype.readCache = function(){
    var me = this;
    
    try{
        this.tree = require(path.join(__dirname,'..','config','cache.json'));
    }catch(e){
        
        console.log(e);
    }
    if (
        (typeof this.tree === 'undefined') ||
        (this.tree === null)
    ){
        this.tree = {};
    }
//    console.log(me.tree);
}

Queries.prototype.resolve = function(question,callback){
    var me = this,
        item,
        i,
        force = false;
         
    if (typeof question.name === 'string'){
        item = me.find(question);
        if (item === null){
            force = true;
        }else{
            if ( (item.length>0) && ( (item[0].$timestamp + item[0].ttl*1000) < (new Date()).getTime() ) ){
                force = true;
            }
            if (item.length === 0){
                force = true;
            }



            if (
                (item.length>0) &&
                (item[0].address === '') &&
                (item[0].class === 1) &&
                (item[0].type === 1)

            ){
                force = true;
            }
        }
        if ( force===true ){ // ok the domain is not cached, we have to request them
             
         
            me.$request(question,function(answers){
                me.$appendItems(answers);
                callback(null,answers);
                item = me.add(question,answers);
            });
        }else{
            
            me.$appendItems(item);
            callback(null,item);
        }
    }else{
        callback(new Error('no name given'),null);
    }
}

Queries.prototype.add = function(question,answers,item){
    var me = this,
        parts= question.name.split('.').reverse(),
        key;
    
    if (typeof item === 'undefined'){
        item = me;
    }
    if (item === null){
        console.log('Error, while adding the item');
        return null;
    }
    
    key = parts[0];
    if (typeof item.tree[key] === 'undefined'){
        item.tree[key] = {
            classes:[],
            tree: {
            }
        };
    }
    parts = parts.slice(1);
    if (parts.length === 0){
        if (typeof item.tree[key].classes[question.class] === 'undefined'){
            item.tree[key].classes[question.class] = {
                types: []
            };
        }
        item.tree[key].classes[question.class].types[question.type] = answers;
        return item.tree[key].classes[question.class].types[question.type];
    }else{
        question.name = parts.reverse().join('.');
        return me.add(question,answers,item.tree[key]);
    }
}

Queries.prototype.$request = function(question,callback){
    var me = this,
        dnsQuestion,
        dnsRequest,
        answers = [];
    
    dnsQuestion = nativedns.Question(question);
    dnsRequest = nativedns.Request({
        question: dnsQuestion,
        server: { 
                address: me.server.configuration["external dns"].address, 
                port: me.server.configuration["external dns"].port, 
                type: me.server.configuration["external dns"].type
        },
        timeout: 1000
    });
    console.log({ 
                address: me.server.configuration["external dns"].address, 
                port: me.server.configuration["external dns"].port, 
                type: me.server.configuration["external dns"].type
        });
    dnsRequest.on('timeout', function () {
        //console.log('Timeout in making request');
    });

    dnsRequest.on('message', function (err, msg) {
        msg.answer.forEach(function (a) {
            a.$timestamp = (new Date()).getTime();
            answers.push(a);
        });
    });

    dnsRequest.on('end', function () {
        
        me.append({
            questions: [question],
            answers: answers
        });
        
        callback(answers);
    });


    dnsRequest.send();
}

/**
* @method find
*
* Searching the given domain by name in the tree and 
* return the item, or null if there is no one.
* @param {Object/Array/String} item the domain name as string or the domain parts as an array or the question item
* @param [{Object}] tree the tree where to be searched, if not given the root will be used
*/
Queries.prototype.find = function(question,parts,item){
    var me = this,
        useTree = (typeof item === 'undefined')?me.tree:item.tree,
        currentPart = '';
    
    if (typeof item === 'undefined'){
        item = me;
    }
    if (typeof parts === 'undefined'){
        parts = question.name.split('.').reverse();
    }
    currentPart = parts[0];
    parts = parts.slice(1);
    if (typeof useTree[currentPart] === 'object'){
        if (parts.length === 0){ // no domain parts left, so find classes and types
            if (
                (typeof useTree[currentPart].classes[question.class] !== 'undefined') &&
                (typeof useTree[currentPart].classes[question.class].types[question.type] !== 'undefined')
            ){
                return useTree[currentPart].classes[question.class].types[question.type];
            }else{
                return null;
            }
        }else{
            if (typeof useTree[currentPart].tree === 'undefined'){
                return null;
            }
            return me.find(question,parts,useTree[currentPart]);
        }
    }else{
        return null;
    }
}

Queries.prototype.clone = function(source){
    var prop,
        clonedObj = {};
    
    for(prop in source){
        if (
            (typeof prop === 'string') &&
            (prop.substring(0,1) == '$') 
        ){
            continue;
        }else{
            switch (typeof source[prop]){
                case 'object':
                    clonedObj[prop] = this.clone(source[prop]);
                    break;
                default:
                    clonedObj[prop] = source[prop];
                    break;
            }
        }
    }
    return clonedObj;
}

Queries.prototype.getTLD = function(name){
    var parts = name.split('.');
    return parts[parts.length-1];
}

Queries.prototype.$appendItems = function(items){
    var key,
        me = this,
        now = new Date();
    
    items.forEach(function(a){
        //console.log('answer',a);
        key = a.name+'|'+a.type+'|'+a.class+'|'+a.address;
        a.id = key;
        a.tld = me.getTLD(a.name);
        a.queryAt = now;
        if (typeof me.list[key] === 'undefined'){
            me.emit('create',a);
        }else{
            if (typeof me.timerList[key] === 'object'){
                clearTimeout(me.timerList[key]);
            }
            me.emit('update',a);
        }
        me.list[key] = a;

        me.timerList[key] = setTimeout(function(){
            if (typeof me.list[key] === 'object'){
                me.emit('destroy',me.list[key]);
                delete me.list[key];
            }
        }, (a.ttl===0)? 3000 : (a.ttl *1000) );

    })
}

Queries.prototype.append = function(item){
    var key,
        data = item.answers,
        now = new Date(),
        me = this;
    
    if (item.answers.length === 0){
        data.push({
            name: item.questions[0].name,
            type: item.questions[0].type,
            'class': item.questions[0].class,
            'address': '',
            'ttl': 0
        });
    }
    
    me.$appendItems(data);
    /*
    data.forEach(function(a){
        //console.log('answer',a);
        key = a.name+'|'+a.type+'|'+a.class+'|'+a.address;
        a.id = key;
        a.tld = me.getTLD(item.questions[0].name);
        a.queryAt = now;
        if (typeof me.list[key] === 'undefined'){
            me.emit('create',a);
        }else{
            if (typeof me.timerList[key] === 'object'){
                clearTimeout(me.timerList[key]);
            }
            
            me.emit('update',a);
        }
        me.list[key] = a;
        
        me.timerList[key] = setTimeout(function(){
            if (typeof me.list[key] === 'object'){
                me.emit('destroy',me.list[key]);
                delete me.list[key];
            }
        }, (a.ttl===0)? 3000 : (a.ttl *1000) );
        
    })
    */
}


exports.Queries = Queries;
