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
  console.log('tableDescription',tableDescription);
  tableDescription = JSON.parse(tableDescription);
  
}