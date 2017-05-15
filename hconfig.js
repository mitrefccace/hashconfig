/*
                                 NOTICE
This (software/technical data) was produced for the U. S. Government under
Contract Number HHSM-500-2012-00008I, and is subject to Federal Acquisition
Regulation Clause 52.227-14, Rights in Data-General. No other use other than
that granted to the U. S. Government, or to those acting on behalf of the U. S.
Government under that Clause is authorized without the express written
permission of The MITRE Corporation. For further information, please contact
The MITRE Corporation, Contracts Management Office, 7515 Colshire Drive, 
McLean, VA 22102-7539, (703) 983-6000.
                        ©2016 The MITRE Corporation. 
*/

/* This program takes a JSON template config file, and asks for user input on 
each field. The user chooses between default and custom values. The program 
then outputs the desired config.json file.
*/

"use strict";

// Import required packages
var fs = require("fs");
var prompt = require("prompt");
var commandLineArgs = require("command-line-args");
var traverse = require("traverse");

try{
  // Define command line options
  var optionDefinitions = [
    { name: "force", alias: "f", type: Boolean },
    { name: "filename", alias: "n", type: String, defaultOption: true, defaultValue: "config.json_TEMPLATE"},
    { name: "decode-input", alias: "i", type: Boolean },
    { name: "decode-output", alias: "o", type: Boolean },
	{ name: "replace", alias: "r", type: String, multiple: true, defaultOption: false },
    { name: "help", alias: "h", type: Boolean }
  ];
  var options = commandLineArgs(optionDefinitions);

  // Help display in the command terminal
  if (options["help"] === true){
    console.log("Generates a JSON configuration file with user-provided custom values \n\
Usage: node hconfig.js [options] \n\
  options: \n\
    -f, --force          Generates a new configuration file with the default \n\
                         values, no user input\n\
	-n, --filename       Accepts the specified template file for input \n\
    -h, --help           Displays help text\n\
    -i, --decode-input   Decodes the input template file, to be used when the \n\
						 template is encoded\n\
    -o, --decode-output  Generates an output file without encoding \n\
    -r, --replace <field1> <value1> <field2> <value2> ... \n\
                         Overwrites the existing value for given field with new value")
    process.exit()
  }

  // Parse the JSON file
  var jsonfile = JSON.parse(fs.readFileSync(options["filename"],"utf8"));

  /*
  Go through config template file and find each field that needs user input.
  We extract the property name and push it to fields, as well as the default
  assigned value and push it to defaults.
  */
  var fields = [];
  var defaults = [];

  traverse(jsonfile).forEach(function () {
    if (this.isLeaf === true){ //finds terminal node with no children
      fields.push(this.path);
      defaults.push(this.node);
    }
  });

  /*
  Create schema, an object with the proper formatting to specify the defaults 
  corresponding to each user input field.
  */
  var schema = {properties: {}};
  for (var i=0; i<fields.length; i++){
    if (options["decode-input"] === true){
      defaults[i] = JSON.parse(JSON.stringify(decode(JSON.stringify(defaults[i]))));
    }
    schema.properties[fields[i]] = JSON.parse('{"default": ' + JSON.stringify(defaults[i]) + '}');
  }

  /*
  Input and output process. Request user input for each field, then write the 
  user input to the appropriate field in the JSON file. If the user doesn't 
  input anything, it uses the default value. Finally, encode the user input and 
  save the new JSON file as config_new.json.
  */
  if (options["force"] === true){
    console.log("Generating configuration file with default values...");
    for (var i=0; i<fields.length; i++){
      if (typeof defaults[i] !== "string"){
        defaults[i] = JSON.stringify(defaults[i]);
      }
      var buf = Buffer.from(defaults[i], "utf-8");
      var val = buf.toString("base64");
      if (options["decode-output"] === true){
        defaults[i] = decode(val);
      }
      else {
        defaults[i] = val;
      }
    }
    var j = 0;
    traverse(jsonfile).forEach(function () {
      if (this.isLeaf === true){
        this.update(defaults[j]);
        j = j + 1;
      }
    });
    fs.writeFileSync("config_new.json",JSON.stringify(jsonfile, null, 4)); //write new config file
  }
  
    else if (options.hasOwnProperty("replace")){
	  var fieldfound = false;
	  if (options["replace"].length % 2 === 0){
	    var numfields = options["replace"].length / 2;
		for (var k = 0; k<numfields; k++){
		  fieldfound = false;
		  for (var i = 0; i<fields.length; i++){
			var fieldstring = (fields[i].toString()).replace(/ /g, '');
			if (options["replace"][0] == fieldstring){
			  fieldfound = true;
			  console.log('Replacing ' + (options["replace"][0]).toString() + '\'s default value with ' + (options["replace"][1]).toString() + '...');
		      defaults[i] = options["replace"][1];
			}
			var buf = Buffer.from(defaults[i].toString(), "utf-8");
			var val = buf.toString("base64");
			if (options["decode-output"] === true){
			  defaults[i] = decode(val);
			}
			else{
			  defaults[i] = val;
			}
			var j = 0;
			traverse(jsonfile).forEach(function () {
			  if (this.isLeaf === true){
				this.update(defaults[j]);
				j = j + 1;
			  }
			});
		  }
		  if (fieldfound == false){
			console.log('Warning: ' + options["replace"][0] + ' is not a valid field name.');
		  }
		  options["replace"].shift();
		  options["replace"].shift();
		}
		fs.writeFileSync("config_new.json",JSON.stringify(jsonfile, null, 4)); //write new config file
	  }
	  else {
		console.log('Syntax error in the replace option. The command should be of the form \n\
node hconfig.js --replace <field1> <value1> <field2> <value2> ... \n\
For fields with multiple levels, use commas to separate the levels, and do not use spaces.');
	  }
	}

  else{
    prompt.start();

    prompt.get(schema, function (err, result) {
      for (var i = 0; i<fields.length; i++){
        var buf = Buffer.from(result[fields[i]], "utf-8");
        var val = buf.toString("base64");
        if (options["decode-output"] === true){
          defaults[i] = decode(val);
        }
        else{
          defaults[i] = val;
        }
	  }
      var j = 0;
      traverse(jsonfile).forEach(function () {
        if (this.isLeaf === true){
          this.update(defaults[j]);
          j = j + 1;
        }
      });
    fs.writeFileSync("config_new.json",JSON.stringify(jsonfile, null, 4)); //write new config file
    });
  }

  function decode(encodedStr){
    var decodedStr = Buffer.from(encodedStr, "base64");
    return decodedStr.toString();
  }
}

catch(err){ //displays help text if syntax is incorrect
  console.log("Error: invalid syntax. Please consult the help documentation by running the command 'node hconfig.js -h'."
)
  process.exit()
}
