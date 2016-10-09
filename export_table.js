var fs = require("fs");
var path = require("path");

const PAGE_SIZE = 10;
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
                  read(dynamodb, params, firstTime, counter, tableCount, tableStatus, fileName, cb);
                }
              }); // end startWritingToTableFile
              
            }
        }); // end writeTableDescriptionToFileCallback
      }
  }); // end describeTable

}


function read(dynamodb, params, firstTime, counter, tableCount, tableStatus, fileName, cb){
  dynamodb.scan(params, function(err, data) {
    if(err) { cb(err) }
    else {
      var delta = data.Items.length;
      counter += delta;
      // console.log(delta);
      tableStatus.inc( delta );

      if( counter == tableCount ) {
        fs.appendFile(fileName, '\n]', function(err){
          if(err) { cb(err) }
          else{
            if(typeof cb == 'function') cb(null);
          }
        });
      } else if (data.LastEvaluatedKey) {

        var json = JSON.stringify( data.Items, null, '\t' );
        json = json.slice(2, json.length - 2 )

        if( delta < PAGE_SIZE )
          json += ',\n';
        
        fs.appendFile(fileName, json, function(err){
          if(err) { cb(err) }
        });

        params.ExclusiveStartKey = data.LastEvaluatedKey;
        firstTime = false;

        read(dynamodb, params, firstTime, counter, tableCount, tableStatus, fileName, cb);
      }
    }
  });
}