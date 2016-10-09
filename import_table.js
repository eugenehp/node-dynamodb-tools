var fs = require("fs");
var path = require("path");

const PAGE_SIZE = 10;
const DIRNAME = 'export';

module.exports = function(dynamodb, tableName, status, cb){

  /*var console = status.console()
  console.log('import_table', tableName);*/

  var tableDescription = {};
  var tableStatus = null;

  var dir = __dirname + '/' + DIRNAME + '/';
  var fileName = dir + tableName + '.json';
  var fileNameDescription = dir + tableName + '.description.json';
  var tableCount = -1;

  tableDescription = fs.readFileSync(fileNameDescription, 'UTF8');
  // console.log('tableDescription',tableDescription);
  tableDescription = JSON.parse(tableDescription);
  tableCount = parseInt( tableDescription.Table.ItemCount );
  
  var fileParams = tableDescription.Table;

  var params = {};
  var keys = [
    'AttributeDefinitions',
    'KeySchema', 
    'ProvisionedThroughput',
    'TableName',
    'GlobalSecondaryIndexes', 
    'LocalSecondaryIndexes', 
    'StreamSpecification'
  ];

  for( var i in keys ){
    var key = keys[i];

    if( fileParams.hasOwnProperty(key) )
      params[key] = fileParams[key];
  }

  if( params.hasOwnProperty('ProvisionedThroughput') )
    if( params.ProvisionedThroughput.hasOwnProperty('NumberOfDecreasesToday') )
      delete params.ProvisionedThroughput['NumberOfDecreasesToday'];

  if( params.hasOwnProperty('GlobalSecondaryIndexes') )
    for( var i in params.GlobalSecondaryIndexes){
      var removeKeys = [
        'IndexStatus',
        'NumberOfDecreasesToday',
        'IndexSizeBytes',
        'ItemCount',
        'IndexArn'
      ];

      var GlobalSecondaryIndexes = params.GlobalSecondaryIndexes[i];

      for( var j in removeKeys){
        var removeKey = removeKeys[j];
        if( GlobalSecondaryIndexes.hasOwnProperty(removeKey) )
          delete GlobalSecondaryIndexes[removeKey];
      }

      if( GlobalSecondaryIndexes.ProvisionedThroughput.hasOwnProperty('NumberOfDecreasesToday') )
        delete GlobalSecondaryIndexes.ProvisionedThroughput.NumberOfDecreasesToday;

      if( GlobalSecondaryIndexes.ProvisionedThroughput.hasOwnProperty('LastDecreaseDateTime') )
        delete GlobalSecondaryIndexes.ProvisionedThroughput.LastDecreaseDateTime;

      params.GlobalSecondaryIndexes[i] = GlobalSecondaryIndexes;
      
    }

  // console.log( JSON.stringify(params, null, '\t') );

  dynamodb.createTable(params, function(err, data) {
    /*console.log('=====================');
    console.log('=====createTable=====');
    console.log('=====================');
    console.log(err);
    console.log(data);
    console.log('=====================');
    console.log('=====================');
    console.log('=====================');*/
    // if (err) console.log(err, err.stack); // an error occurred
    // else     console.log(data);           // successful response
    // if(err) {
      // cb(err)
    // }else{
      var waitForParams = {
        TableName: tableName
      };
      dynamodb.waitFor('tableExists', waitForParams, function(err, data) {
        if(err){
          cb(err)
        }else{
          tableStatus = status.addItem(tableName, { max: parseInt(tableCount) });

          var stats = fs.statSync(fileName)
          var fileSizeInBytes = parseInt(stats["size"]);
          
          // console.log(tableName, fileName, fileSizeInBytes)
          if( fileSizeInBytes < 100){
            tableStatus.inc();
            cb(null, fileName);
          }else{
            importData(dynamodb, fileName, tableName, tableCount, tableStatus, cb);
          }

        }
      });
    // }
  });

}

function importData(dynamodb, fileName, tableName, tableCount, tableStatus, cb){
  var counter = 0;
  var functionCounter = 0;
  var StreamArray = require("stream-json/utils/StreamArray");
  var stream = StreamArray.make();

  stream.output.on("data", function(object){
    // console.log(object.index, object.value);
    var params = {};
    params.Item = object.value;
    params.TableName = tableName;

    functionCounter++;

    setTimeout(function(){
      // console.log(params.Item.id.S);
      // TODO: manage Capacity Throughput here
      // Otherwise it will give an error
      // <ProvisionedThroughputExceededException: The level of configured provisioned throughput for the table was exceeded. Consider increasing your provisioning level with the UpdateTable API.>
      dynamodb.putItem(params, function(err, data) {
        if(err){
          cb(err);
        }else{
          counter++;
          // console.log('putItem',counter,tableCount);
          tableStatus.inc();
          if(counter == tableCount)
            cb(null,fileName);
        }
      });
    }, functionCounter * 100);

  });

  /*stream.output.on("error", function(err){
    cb(err);
  });*/

  // stream.output.on("end", function(){
  //   console.log("done");
  // });

  fs.createReadStream(fileName).pipe(stream.input);
}