var fs = require("fs");
var path = require("path");

const PAGE_SIZE = 10;
const DIRNAME = 'export';

module.exports = function(dynamodb, tableName, status, cb){

  var tableDescription = {};

  var dir = __dirname + '/' + DIRNAME + '/';
  var fileName = dir + tableName + '.json';
  var fileNameDescription = dir + tableName + '.description.json';

  tableDescription = fs.readFileSync(fileNameDescription, 'UTF8');
  // console.log('tableDescription',tableDescription);
  tableDescription = JSON.parse(tableDescription);
  
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

      params.GlobalSecondaryIndexes[i] = GlobalSecondaryIndexes;
      
    }

  // console.log( JSON.stringify(params, null, '\t') );

  dynamodb.createTable(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });

}