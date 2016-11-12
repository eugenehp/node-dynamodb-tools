var AWS = require("aws-sdk");
var async = require('async');
var status = require('node-status');
var exportTable = require("./export_table");
var getTables = require('./getTables');

const PAGE_SIZE = 100;

module.exports = function(configFile){

  AWS.config.loadFromPath(configFile);
  var dynamodb = new AWS.DynamoDB();

  console.log('Getting tables');
  getTables(dynamodb, [], {}, PAGE_SIZE, function(err, tables){

    console.log(tables);

    var pattern = "  Exporting tables: {uptime}  |  {spinner.cyan}";
    for( i in tables)
      pattern += "  | "+tables[i]+"  {"+tables[i]+".green.bar}";

    /*status.start({
      // invert: true,
      interval: 200,
      pattern: pattern
    });*/

    async.mapSeries(tables, exportTableWrapper, function(err, results){
      console.log('RESULTS', err, results);

      setTimeout(function(){
          status.stop();
          console.log('\n');
      }, 500);

    });
  });

  function exportTableWrapper(tableName, cb){
    // console.log('exportTableWrapper',tableName);
    exportTable(dynamodb, tableName, status, __dirname, cb);
  }
}