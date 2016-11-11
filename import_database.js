var fs = require('fs');
var AWS = require("aws-sdk");
var async = require('async');
var status = require('node-status');
var importTable = require("./import_table");

const PAGE_SIZE = 100;
const DIRNAME = 'export';

module.exports = function(configFile){
  AWS.config.loadFromPath(configFile);
  var dynamodb = new AWS.DynamoDB();
  var tablesCounter = 0;

  getAllTables(__dirname + '/' + DIRNAME, function(err, tables){
    // console.log('getAllTables', err, tables)
    if(err){
      cb(err);
    }else{

      var pattern = "  Importing tables: {uptime}  |  {spinner.cyan}";
      for( i in tables)
        pattern += "  | "+tables[i]+"  {"+tables[i]+".green.bar}";

      status.start({
        // invert: true,
        interval: 200,
        pattern: pattern
      });

      var console = status.console();

      for(i in tables){
        (function(i){

          setTimeout(function(){
            var tableName = tables[i];
            importTable(dynamodb, tableName, status, function(err, data){
              if(err)
                console.log('Error during importing', tableName, err/*, data*/);
              tablesCounter++;

              if( tablesCounter == tables.length)
                setTimeout(function(){
                    status.stop();
                    console.log('\n\n');
                }, 500);
            })
          }, i * 1000);

        })(i);
      }

    }

  });
}

function getAllTables(dirname, cb){
  var files = fs.readdirSync(dirname);
  var results = [];
  for(var i in files){
    var file = files[i];
    if( file != '.DS_Store' && file.indexOf('.description.json') == -1 )
      results.push(file.split('.')[0])
  }
  cb(null, results);
}