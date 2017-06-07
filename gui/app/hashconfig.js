//separate the fields and values, format the JSON file, and make the values editable
function output(inp) {
  document.body.appendChild(document.createElement('pre')).innerHTML = inp;
}

function syntaxHighlight(json) {
  var defaults = [];
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
	var cls = 'value';
	if (/^"/.test(match)) {
	  if (/:$/.test(match)) {
		cls = 'field';
	  }
	}
	if (cls === 'value') {
	  defaults.push(match);
	}
	return '<span class="' + cls + '">' + match + '</span>';
  });
}

function showJSON(){
  var fs = require('fs');
  var file = JSON.parse(fs.readFileSync('config.json_TEMPLATE')); 
  var jsonStr = JSON.stringify(file, null, 4); 
  output(syntaxHighlight(jsonStr));
  var vals = document.getElementsByClassName('value');
  for (var i=0; i<vals.length; i++){
	vals[i].contentEditable = "true";
  }
}

//encode the values in the JSON file
function encodeJSON(){
  var editVals = document.getElementsByClassName('value');  
  for (var i=0; i<editVals.length; i++){
	var valStr = editVals[i].textContent;
	if (valStr.charAt(0) == "\"" || valStr.charAt(0) == "\'"){
	  valStr = valStr.substring(1,valStr.length - 1);
	}
	var encodedVal = encode(valStr);
	document.getElementsByClassName('value')[i].innerHTML = "\"" + encodedVal + "\"";
  }
  document.getElementById("update").innerHTML= "File encoded!";


  function encode(decodedStr){
    var encodedStr = Buffer.from(decodedStr, "utf-8");
	return encodedStr.toString("base64");
  }
}

//decode the values in the JSON file
function decodeJSON(){
  var editVals = document.getElementsByClassName('value');
  for (var i=0; i<editVals.length; i++){
	  var valStr = editVals[i].textContent;
	  if (valStr.charAt(0) == "\"" || valStr.charAt(0) == "\'"){
		valStr = valStr.substring(1,valStr.length - 1);
	  }
	  var decodedVal = decode(valStr);
	  document.getElementsByClassName('value')[i].innerHTML = "\"" + decodedVal + "\"";
  }
  
  function decode(encodedStr){
	var decodedStr = Buffer.from(encodedStr, "base64");
	return decodedStr.toString();
  }
  document.getElementById("update").innerHTML= "File decoded!";
}

//save the new JSON file
function saveJSON(){
  var fs = require('fs');
  var element = document.getElementsByTagName('pre')[0];
  var text = element.innerText;
  fs.writeFileSync("config_new.json",JSON.stringify(JSON.parse(text), null, 4)); //write new config file
  document.getElementById("update").innerHTML= "File saved!";
}
