module.exports = function(dynamodb, tableName, status, path, cb){

  const PAGE_SIZE = 100;

  var tableDescription = {}
  var tableCount = -1;
  var counter = 0;
  var tableStatus = null;

  var fileName = path+'/'+tableName+'.json';
  var fileNameDescription = path+'/'+tableName+'.description.json';

  dynamodb.describeTable(
    {TableName: tableName}, 
    function describeTableCallback(err, _tableDescription){
      if(err) {cb(err);}
      else {
        tableDescription = _tableDescription;
        tableCount = tableDescription.Table.ItemCount;

        tableStatus = status.addItem(tableName, { max: parseInt(tableCount) });
        
        var params = {
          TableName: 'accesstokens',
          Select: 'ALL_ATTRIBUTES',
          Limit: PAGE_SIZE,
        };

        read(dynamodb, params, counter, tableCount, tableStatus, fileName, cb);
      }
  }); // end describeTable

}


function read(dynamodb, params, counter, tableCount, tableStatus, fileName, cb){
  dynamodb.scan(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    // else     console.log( JSON.stringify( data.Items.length, null, '\t' ) );           // successful response
    counter += data.Items.length;
    // console.log(counter + '/' + tableCount);
    tableStatus.inc(params.Limit);

    if( counter == tableCount ) {
      if(typeof cb == 'function') cb(null);
    } else if (data.LastEvaluatedKey) {
      params.ExclusiveStartKey = data.LastEvaluatedKey;
      read(dynamodb, params, counter, tableCount, tableStatus, fileName, cb);
    }
  });
}