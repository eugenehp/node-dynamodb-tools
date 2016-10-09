var AWS = require("aws-sdk");
var async = require('async');
var status = require('node-status');
var importTable = require("./import_table");

const PAGE_SIZE = 100;

module.exports = function(configFile){
  AWS.config.loadFromPath(configFile);
  var dynamodb = new AWS.DynamoDB();

  importTable(dynamodb, 'accounts', status, function(err, data){
    console.log('importTable', err, data);
  });
}