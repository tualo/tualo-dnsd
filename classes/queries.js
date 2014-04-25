'use strict';
var util = require("util"),
    events = require("events");

var Queries = function(dnsd){
    this.list = {};
    events.EventEmitter.call(this);
}


util.inherits(Queries, events.EventEmitter);

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
    
    data.forEach(function(a){
        key = a.name+'|'+a.type+'|'+a.class+'|'+a.address;
        a.id = key,
        a.queryAt = now;
        if (typeof me.list[key] === 'undefined'){
            me.emit('create',a);
        }else{
            me.emit('update',a);
        }
        me.list[key] = a;
        
        setTimeout(function(){
            if (typeof me.list[key] === 'object'){
                me.emit('destroy',me.list[key]);
                delete me.list[key];
            }
        }, (a.ttl===0)? 3000 : (a.ttl *1000) );
        
    })
}


exports.Queries = Queries;
