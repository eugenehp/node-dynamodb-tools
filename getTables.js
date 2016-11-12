module.exports = function(dynamodb, tables, params, pageSize, cb){
  params.Limit = pageSize;

  dynamodb.listTables(params, function(err, data) {
    if (err) {
      cb(err)
    } else if (data.LastEvaluatedTableName){
      params.ExclusiveStartTableName = data.LastEvaluatedTableName;

      tables = tables.concat( data.TableNames );
      getTables(dynamodb, tables, params, pageSize, cb);
    }else {
      tables = tables.concat( data.TableNames );
      cb( null, tables );
    }
  });
}