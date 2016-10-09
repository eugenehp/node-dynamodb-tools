var AWS = require("aws-sdk");
var async = require('async');
var status = require('node-status');
var importTable = require("./import_table");

const PAGE_SIZE = 100;

module.exports = function(configFile){
  AWS.config.loadFromPath(configFile);
  var dynamodb = new AWS.DynamoDB();

  var tables = ['accesstokens'];
  var pattern = "  Importing tables: {uptime}  |  {spinner.cyan}";
  for( i in tables)
    pattern += "  | "+tables[i]+"  {"+tables[i]+".green.bar}";

  status.start({
    // invert: true,
    interval: 200,
    pattern: pattern
  });

  importTable(dynamodb, 'accesstokens', status, function(err, data){
    // console.log('importTable', err, data);
    setTimeout(function(){
        status.stop();
        console.log('\n');
    }, 500);
  });
}