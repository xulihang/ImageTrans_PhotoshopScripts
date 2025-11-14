// ps_run.js
// 用法：cscript //Nologo ps_run.js "C:\path\to\script.jsx"

if (WScript.Arguments.length < 1) {
    WScript.Echo("Usage: cscript //Nologo ps_run.js path_to_jsx [output_path]");
    WScript.Quit(1);
}

var jsxPath = WScript.Arguments(0);
var outputPath = "";
if (WScript.Arguments.length == 2) {
    outputPath = WScript.Arguments(1); 
}


// 将反斜杠转义
jsxPath = jsxPath.replace(/\\/g, "\\\\");
outputPath = outputPath.replace(/\\/g, "\\\\");

// 读取文件内容
// 使用 ADODB.Stream 读取 UTF-8 文件
var stream = new ActiveXObject("ADODB.Stream");
stream.Type = 2; // 2 = text
stream.Charset = "UTF-8";
stream.Open();
stream.LoadFromFile(jsxPath);
var code = stream.ReadText();
stream.Close();

// 替换 outputPath = "" 为实际路径
if (outputPath != "") {
  code = code.replace(/outputPath\s*=\s*""/g, 'outputPath = "' + outputPath + '"'); 
}


// WScript.Echo(code);
// 执行 Photoshop 脚本
var app = new ActiveXObject("Photoshop.Application");

// doJavaScript 返回值
var result = app.doJavaScript(code);
//WScript.Echo(result);
// 输出到 StdOut 供 Java 读取
WScript.StdOut.Write(result);
