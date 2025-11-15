
if (WScript.Arguments.length < 1) {
    WScript.Echo("Usage: cscript //Nologo ps_run.js path_to_jsx [output_path]");
    WScript.Quit(1);
}

var jsxPath = WScript.Arguments(0);
var outputPath = "";
if (WScript.Arguments.length == 2) {
    outputPath = WScript.Arguments(1); 
}

var fso = new ActiveXObject("Scripting.FileSystemObject");
var jsxFolder = fso.GetParentFolderName(jsxPath).replace(/\\/g, "\\\\");;

jsxPath = jsxPath.replace(/\\/g, "\\\\");
outputPath = outputPath.replace(/\\/g, "\\\\");

var stream = new ActiveXObject("ADODB.Stream");
stream.Type = 2; // 2 = text
stream.Charset = "UTF-8";
stream.Open();
stream.LoadFromFile(jsxPath);
var code = stream.ReadText();
stream.Close();

if (outputPath != "") {
  code = code.replace(/outputPath\s*=\s*""/g, 'outputPath = "' + outputPath + '"'); 
  code = code.replace(/inputFolder\s*=\s*""/g, 'inputFolder = "' + outputPath + '"'); 
}

code = code.replace(/#include\s+([^\s]+)/g, function(_, inc){
    return '#include "' + jsxFolder + '\\\\' + inc.replace(/"/g, '') + '"';
});



var pathCode = 'var jsRoot = new Folder("' + jsxFolder + '");\njsRoot.changePath();\n';
code = pathCode + code;

var app;
try {
  app  = new ActiveXObject("Photoshop.Application");
}catch(e) {
  WScript.StdOut.Write(e.message);
  WScript.Quit(2);
}


var result = app.doJavaScript(code);
WScript.StdOut.Write(result);
