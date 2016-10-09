var fs = require("fs");
 
var StreamArray = require("stream-json/utils/StreamArray");
var stream = StreamArray.make();
 
stream.output.on("data", function(object){
  console.log(object.index, object.value);
});
stream.output.on("end", function(){
  console.log("done");
});
 
fs.createReadStream("export/accesstokens.json").pipe(stream.input);