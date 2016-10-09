var AWS = require("aws-sdk");
var status = require('node-status');
var exportTable = require("./export_table");

AWS.config.loadFromPath('./config.export.json');

var dynamodb = new AWS.DynamoDB();

/*var params = {
  Limit: 1
};

dynamodb.listTables(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});*/

var tableName = 'accesstokens';
exportTable(dynamodb, tableName, status, __dirname, function(err, data){
  setTimeout(function(){
    status.stop();
    console.log('\n');
  }, 500);
  
});

status.start({
  // invert: true,
  interval: 200,
  pattern: "  Doing work: {uptime}  |  {spinner.cyan}  | "+tableName+"  {"+tableName+".green.bar}"
});
