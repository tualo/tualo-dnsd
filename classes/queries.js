'use strict';

var Queries = function(dnsd){
    this.dnsd = dnsd;
    this.list = [];
}

Queries.prototype.append = function(item){
    this.dnsd.io.sockets.emit('query',item);
    this.list.push(item);
}


exports.Queries = Queries;
