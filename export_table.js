var fs = require("fs");
var path = require("path");

const PAGE_SIZE = 100;
const DIRNAME = 'export';

module.exports = function(dynamodb, tableName, status, directory, cb){
  var tableDescription = {}
  var tableCount = -1;
  var counter = 0;
  var tableStatus = null;

  var dir = directory + '/' + DIRNAME + '/';
  var fileName = dir + tableName + '.json';
  var fileNameDescription = dir + tableName + '.description.json';

  dynamodb.describeTable(
    {TableName: tableName}, 
    function describeTableCallback(err, _tableDescription){
      if(err) { cb(err) }
      else {
        tableDescription = _tableDescription;
        tableCount = tableDescription.Table.ItemCount;

        var tableDescriptionString = JSON.stringify( tableDescription, null, '\t');

        fs.writeFile(fileNameDescription, tableDescriptionString, function writeTableDescriptionToFileCallback(err) {
          // console.log('writeTableDescriptionToFileCallback',err);
            if(err) { cb(err) }
            else{
              tableStatus = status.addItem(tableName, { max: parseInt(tableCount) });
        
              var params = {
                TableName: tableName,
                Select: 'ALL_ATTRIBUTES',
                Limit: PAGE_SIZE,
              };

              fs.writeFile(fileName, '[\n', function startWritingToTableFile(err){
                if(err) { cb(err) }
                else{
                  var firstTime = true;
                  read(dynamodb, params, firstTime, counter, tableCount, tableStatus, fileName, tableName, cb);
                }
              }); // end startWritingToTableFile
              
            }
        }); // end writeTableDescriptionToFileCallback
      }
  }); // end describeTable

}


function read(dynamodb, params, firstTime, counter, tableCount, tableStatus, fileName, tableName, cb){
  dynamodb.scan(params, function DynamoDBScanCallback(err, data) {
    // console.log('DynamoDBScanCallback', JSON.stringify(data, null, '\t') );
    if(err) { cb(err) }
    else {
      var delta = data.Items.length;
      counter += delta;
      // console.log(delta);
      // console.log('counter', counter, tableCount);
      tableStatus.inc( delta );


      if( counter >= tableCount || delta == 0 ) {
        var json = JSON.stringify( data.Items, null, '\t' );
        json = json.slice(2, json.length - 2 );
        json += '\n]';

        fs.appendFile(fileName, json, function(err){
          if(err) { cb(err) }
          else{
            // TODO: add JSONLint here
            // if(typeof cb == 'function') cb(null);
            if(typeof cb == 'function') cb( null, [tableName, counter, tableCount].join(' ') );
          }
        });
      } else if (data.LastEvaluatedKey) {

        var json = JSON.stringify( data.Items, null, '\t' );
        json = json.slice(2, json.length - 2 )

        // if( tableCount - counter >= PAGE_SIZE )
        json += ',\n';
        
        fs.appendFile(fileName, json, function(err){
          if(err) { cb(err) }
        });

        params.ExclusiveStartKey = data.LastEvaluatedKey;
        firstTime = false;

        read(dynamodb, params, firstTime, counter, tableCount, tableStatus, fileName, tableName, cb);
      }
    }
  });
}