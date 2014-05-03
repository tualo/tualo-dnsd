Ext.define('DNSProxy.app.Application', {
    
    extend: 'Ext.container.Viewport',
    layout: 'border',
    initComponent: function() {
        var me = this;
        
        
        var myFormPanel = new Ext.form.Panel({
            // configs for FormPanel
            title: 'Basic Information',
            padding: 10,

            // configs apply to child items
            defaults: {anchor: '100%'},
            defaultType: 'textfield',
            items: [{
                fieldLabel: 'Name',
                name: 'name'
            },{
                fieldLabel: 'Email',
                name: 'email'
            },{
                fieldLabel: 'Company',
                name: 'company'
            }],

            // configs for BasicForm
            api: {
                // The server-side method to call for load() requests
                load: function(){
                    console.log('load',arguments)
                },
                // The server-side must mark the submit handler as a 'formHandler'
                submit: function(completedCB,evt){
                    console.log('submit',arguments)
                    completedCB.apply(this,{
                        success: true
                    },'')
                }
            },
            // specify the order for the passed params
            paramOrder: ['uid', 'foo'],

            buttons: [{
                text: 'Reset',
                handler: function() {
                    this.up('form').getForm().reset();
                }
            }, {
                text: 'Load',
                handler: function() {
                    this.up('form').getForm().load({
                        success: function(form, action) {
                            console.log('submit Success',arguments)
                            Ext.Msg.alert('Load Success', action.result.msg);
                        },
                        failure: function(form, action) {
                            Ext.Msg.alert('Load Failed', action.result.msg);
                        }
                    });
                }
            }, {
                text: 'Submit',
                formBind: true, //only enabled once the form is valid
                disabled: true,
                handler: function() {
                    var form = this.up('form').getForm();
                    if (form.isValid()) {
                        form.submit({
                            success: function(form, action) {
                                Ext.Msg.alert('Success', action.result.msg);
                            },
                            failure: function(form, action) {
                                Ext.Msg.alert('Failed', action.result.msg);
                            }
                        });
                    }
                }
            }]
        });
        
        
        Ext.define('Model1', {
            extend: 'Ext.data.Model',
            idProperty: 'id',
            fields: [
                {name: 'id',   type: 'string'},
                {name: 'name',   type: 'string'},
                {name: 'tld',   type: 'string'},
                {name: 'address', type: 'string'},
                {name: 'ttl', type: 'number'},
                {name: 'class', type: 'number'},
                {name: 'type', type: 'number'},
                {name: 'queryAt', type: 'date'}
            ]
        });

        var myStore = Ext.create('Ext.data.Store', {
            model: 'Model1',
            storeId: 'Sample',
            groupField: 'tld',
            proxy: {
                storeId: 'Sample',
                url: window.location.origin+'/-/table',
                type: 'socketio',
                reader: {
                    type: 'json',
                    root: 'data'
                }
            },
            autoLoad: true
        });
        
        me.grid = Ext.create('Ext.grid.Panel', {
            title: 'DNS Request',
            store: Ext.data.StoreManager.lookup('Sample'),
            features: [{
                ftype:'grouping',
                groupHeaderTpl: '{columnName}: {name} ({rows.length} Item{[values.rows.length > 1 ? "s" : ""]})'
            }],
            columns: [
                { text: 'Top-Level-Domain',  dataIndex: 'tld', flex: 1 },
                { text: 'Domain',  dataIndex: 'name', flex: 1 },
                { text: 'Address', dataIndex: 'address', flex: 1 },
                { text: 'last Query', dataIndex: 'queryAt', flex: 1 } ,
                { text: 'TTL', dataIndex: 'ttl', flex: 1 }            ,
                { text: 'Type', dataIndex: 'type', flex: 1 ,
                 renderer: function(value){
                     switch(value){
                         case 1:
                             value = '<span style="color: green;">A</span>';
                             break;
                         case 28:
                             value = '<span style="color: blue;">AAAA</span>';
                             break;
                         case 15:
                             value = '<span style="color: yellow;">MX</span>';
                             break;
                         default:
                             value = '<span style="color: gray;">'+value+'</span>';
                             break;
                     }
                     return value;
                 }
                }            ,
                { text: 'Class', dataIndex: 'class', flex: 1 }            
            ]
        });
        
        
        
        //####################################
        
        
        Ext.define('Model2', {
            extend: 'Ext.data.TreeModel',
            fields: [
                {name: 'name',   type: 'string'}
            ]
        });
        

        me.treestore = Ext.create('Ext.data.TreeStore', {
            model: 'Model2',
            storeId: 'Sample2',
            proxy: {
                storeId: 'Sample2',
                url: window.location.origin+'/t.json',
                type: 'ajax',
                reader: {
                    type: 'json'
                }
                
                
            },
            autoLoad: true,
            folderSort: true
        });
        
        
        
        me.tree = Ext.create('Ext.tree.Panel', {
            title: 'Domaintree',
            store: me.treestore,
            rootVisible: true,
            columns: [
                {
                    xtype: 'treecolumn', //this is so we know which column will show the tree
                    text: 'Task',
                    width: 200,
                    sortable: true,
                    dataIndex: 'task',
                    locked: true
                }
            ]
        });
        
        me.items = [
            {
                region: 'north',
                xtype: 'component',
                padding: 10,
                height: 40,
                html: '<img style="float: left;margin-right:12px;" src="images/brand.png"><div style="height:40px;vertical-align:middle;float: left  ;"> DNS Proxy</div>'
            },/*{
                xtype: 'panel',
                title: 'Navigation',
                region: 'west',
                html: '<ul><li>This area ...</li></ul>',
                width: 250,
                split: true,
                tbar: [{
                    text: 'Button',
                    handler: 'onClickButton'
                }]
            },*/{
                region: 'center',
                xtype: 'tabpanel',
                items:[
                    me.tree,
                    me.grid
                    //myFormPanel
                ]
            }
        ];
        this.callParent();    
    }
    
});

