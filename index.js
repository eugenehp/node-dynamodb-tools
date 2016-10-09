var AWS = require("aws-sdk");
var exportDatabase = require("./export_database");

AWS.config.loadFromPath('./config.export.json');

var dynamodb = new AWS.DynamoDB();

exportDatabase(dynamodb);

/*
var tableName = 'accesstokens';
exportTable(dynamodb, tableName, status, __dirname, function(err, data){
  setTimeout(function(){
    status.stop();
    console.log('\n');
  }, 500);
});
*/

