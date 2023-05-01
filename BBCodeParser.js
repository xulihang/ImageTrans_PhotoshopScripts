var supportedBBCodes = ["b","color","i","fi","fb","fontname","fontsize"];
/*
* Parse BBCode. Example: [b][i]Bold Italic[/i][/b] example. -> [{text:"Bold Italic",bold:true,italic:false}, {text: "example."}]
*/
function parseBBCode(text){
    var run = {};
	run.text = text;
    var valid = validBBCode(text);
    if (valid) {
        return parseRun(run);
    }else{
        return [run];
    }
}

function parseRun(run){
    var runs = [];
	if (run.text === "") {
        return runs;
    }
	var str = run.text;
    var	plainText = "";
    for (var index = 0; index <= str.length - 1; index++) {
        if (currentChar(str,index) === "[") {
            var tagContent = textUntil("]",str,index);
            var codeName = getBBCodeName(tagContent);
            if (codeName != "" && tagContent.indexOf("/") === -1){
                var text = plainText;
				if (text != "") {
                    runs.push(createRun(text,run,"",""))
                }
                plainText = "";
                var endTag = "[/"+codeName+"]"
				var runText = textUntil(endTag,str,index)
				if (runText != "") {
                    index = index + runText.length - 1
					runText = codePairStripped(runText,tagContent,endTag)
					var richRun = createRun(runText,run,codeName,tagContent)
					var innerRuns = [];
					parseInnerRuns(richRun,innerRuns)
					runs = runs.concat(innerRuns);
                }
            }
        }else {
            plainText = plainText + (currentChar(str,index));
        }
        
        
    }
	if (plainText != "") {
        runs.push(createRun(plainText,run,"",""))
    }
	return runs;
}

function parseInnerRuns(run,runs) {
    var parsedRuns = parseRun(run);
    if (parsedRuns.length === 1) {// no tags
        runs.push(parsedRuns[0]);
    }else{
        for (var index = 0; index < parsedRuns.length; index++) {
            var innerRun = parsedRuns[index];
            parseInnerRuns(innerRun,runs)
        }
    }
}

/*
* text:[color=#ff00ff]Red[/color],codeName:color,tagContent:[color=#ff00ff]
*/
function createRun(text,parentRun,codeName,tagContent){
    var run = {};
    run.text = text
    if (parentRun) {
        run.bold = parentRun.bold;
        run.italic = parentRun.italic;
        run.color = parentRun.color;
        run.fontname = parentRun.fontname;
        run.fontsize = parentRun.fontsize;
        run.fauxBold = parentRun.fauxBold;
        run.fauxItalic = parentRun.fauxItalic;
    }

    codeName = codeName.toLowerCase();
       
    if (codeName === "b") {
        run.bold = true;
    }else if (codeName === "i") {
        run.italic = true;
    }else if (codeName === "fb") {
        run.fauxBold = true;
    }else if (codeName === "fi"){
        run.fauxItalic = true;
    }else if (codeName === "fontname"){
        run.fontname = parseFontName(tagContent);
    }else if (codeName === "fontsize"){
        run.fontsize = parseFontSize(tagContent);
    }else if (codeName === "color") {
        run.color = parseColor(tagContent)
    }
    return run;
}

/*
* parse [fontname=Tahoma] and return Tahoma
*/
function parseFontName(tagContent) {
    try {
        var name = tagContent.substring(tagContent.indexOf("=")+1,tagContent.length-1);
        return name;
    } catch (error) {
        console.log(error);
    }
    return "";
}

/*
* parse [fontsize=11.0] and return 11.0
*/
function parseFontSize(tagContent){
	try {
        var size = parseFloat(tagContent.substring(tagContent.indexOf("=")+1,tagContent.length-1));
		return size;
    } catch (error) {
        console.log(error);
    }
	return undefined;
}


/*
* parse [color=#ff0000] and return the rgb value {r:255.g:0,b:0)
*/
function parseColor(tagContent) {
    try {
        var hex = tagContent.substring(tagContent.indexOf("=")+1,tagContent.length-1).toLowerCase();
        var r = eval("0x"+hex.substring(1,3)).toString(10);
        var g = eval("0x"+hex.substring(3,5)).toString(10);
        var b = eval("0x"+hex.substring(5,7)).toString(10);
        return {r:r,g:g,b:b};
    } catch (error) {
        console.log(error);
    }
    return {r:0,g:0,b:0};
}

/*
* [b]Hello [i]world[/i][/b] -> Hello [i]world[/i]
*/
function codePairStripped(runText,tagContent,endTag) {
    runText = runText.replace(tagContent,"")
    runText = runText.replace(endTag,"")
    return runText;
}

function escaped(text) {
  text = text.replace("\[","\\[");
  text = text.replace("\]","\\]");
  return text;
}

/*
* textUntil("]","[tag]content[/tag]",0) => "[tag]"
*/
function textUntil(endStr,str,index){
    var text = "";
    var textLeft=str.substring(index,str.length);
    if (textLeft.indexOf(endStr)!=-1) {
        for (var i = index; i <= str.length - endStr.length; i++) {
            if (str.substring(i,i + endStr.length) === endStr) {
                text = text + endStr;
                break;
            }else{
                var s = str.charAt(i);
                text = text + s;
            }
        }
    }
    return text;
}
    
function currentChar(str,index) {
    return str.charAt(index);
}

/*
* [color=#ff0000] => color
*/
function getBBCodeName(str) {
    var regex = new RegExp("\\[/?(.*?)]");
    var matchObject = regex.exec(str);
    if (matchObject) {
        var match = matchObject[1];
        if (match.indexOf("=")!= -1) {
            match = match.substring(0,match.indexOf("="));
        }
        if (isSupportedBBCode(match)) {
            return match;
        }
    }
    return "";
}

function validBBCode(str) {
    var count = 0;
    var regex = new RegExp("\\[/?(.*?)]","g");
    var matchObject = regex.exec(str);
    while (matchObject) {
        var match = matchObject[1];
		if (match.indexOf("=") != -1) {
            match = match.substring(0,match.indexOf("="));
        }
		if (match.indexOf("[") != -1 || match.indexOf("]") != -1) {
            return false;
        } 
		if (isSupportedBBCode(match)) {
            count = count + 1;
        }
        matchObject = regex.exec(str);
    }
	if (count > 0) {
        if (count % 2 === 0) {
            return true;
        }
    }
	return false;
}

function isSupportedBBCode(code) {
    code = code.toLowerCase();
    for (var index = 0; index < supportedBBCodes.length; index++) {
        var bbcode = supportedBBCodes[index];
        if (code === bbcode) {
            return true;
        }
    }
    return false;
}
