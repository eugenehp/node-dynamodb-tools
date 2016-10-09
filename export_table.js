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

        fs.writeFile(fileNameDescription, tableDescriptionString, function writeFileCallback(err) {
            if(err) { cb(err) }
            else{
              tableStatus = status.addItem(tableName, { max: parseInt(tableCount) });
        
              var params = {
                TableName: 'accesstokens',
                Select: 'ALL_ATTRIBUTES',
                Limit: PAGE_SIZE,
              };

              read(dynamodb, params, counter, tableCount, tableStatus, fileName, cb);
            }
        }); // end writeFileCallback
      }
  }); // end describeTable

}


function read(dynamodb, params, counter, tableCount, tableStatus, fileName, cb){
  dynamodb.scan(params, function(err, data) {
    if(err) { cb(err) }
    else {
      counter += data.Items.length;
      tableStatus.inc(params.Limit);

      if( counter == tableCount ) {
        if(typeof cb == 'function') cb(null);
      } else if (data.LastEvaluatedKey) {
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        read(dynamodb, params, counter, tableCount, tableStatus, fileName, cb);
      }
    }
  });
}