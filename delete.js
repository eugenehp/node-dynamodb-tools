var AWS = require("aws-sdk");
var async = require('async');
var status = require('node-status');
var yesno = require('yesno');
var exportTable = require("./export_table");
var configFile = './config.import.json';
var getTables = require('./getTables');

const PAGE_SIZE = 100;
const DELAY = 1000;

AWS.config.loadFromPath(configFile);
var dynamodb = new AWS.DynamoDB();


yesno.onInvalidHandler(function (question, default_value, callback, yes_values, no_values) {
    process.stdout.write("\nNOTHING WAS DELETED.\r\n");
    process.exit(1);
});

getTables(dynamodb, [], {}, PAGE_SIZE, function(err, tables){

  yesno.ask("Are you sure you want to remove all tables?", null, handleResponse);

  function handleResponse(ok){

    if(tables.length)
    async.mapSeries(tables, deleteTableWrapper, function(err, results){
      console.log('RESULTS', err, results);
      process.exit(1);
    });

  }

});


function deleteTableWrapper(tableName, cb){
  console.log('deleting',tableName);
  setTimeout(function(){
    dynamodb.deleteTable({ TableName: tableName }, cb);
  },DELAY);
}

