'use strict';

Ext.Loader.setPath('DNSProxy', '.');
Ext.onReady(function() {
    Ext.create('DNSProxy.app.Application',{
        //renderTo: Ext.getBody()
        //autoCreateViewport: 'DNSProxy.app.view.Main'
    });
    
    
    /*
    Ext.create('Tualo.data.proxy.SocketIO',{
        storeId: 'sample',
        url: window.location.origin,
        model: 'Model1'
    })
    */
});