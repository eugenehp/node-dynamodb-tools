var AWS = require("aws-sdk");
var async = require('async');
var status = require('node-status');
var exportTable = require("./export_table");

const PAGE_SIZE = 100;

module.exports = function(configFile){

  AWS.config.loadFromPath(configFile);
  var dynamodb = new AWS.DynamoDB();

  console.log('Getting tables');
  getTables(dynamodb, [], {}, function(err, tables){

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


function getTables(dynamodb, tables, params, cb){
  params.Limit = PAGE_SIZE;

  dynamodb.listTables(params, function(err, data) {
    if (err) {
      cb(err)
    } else if (data.LastEvaluatedTableName){
      params.ExclusiveStartTableName = data.LastEvaluatedTableName;

      tables = tables.concat( data.TableNames );
      getTables(dynamodb, tables, params, cb);
    }else {
      tables = tables.concat( data.TableNames );
      cb( null, tables );
    }
  });
}