'use strict';
// Declare app level module which depends on filters, and services
var app = angular.module('myApp', []);

/* Services */

// In this case it is a simple value service.
app.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});


function AppCtrl($scope, socket) {

  $scope.messages = [];
  // Socket listeners
  // ================
  socket.on('init', function (data) {
  });

  socket.on('query', function (item) {
      $scope.messages.push(item);
  });
}