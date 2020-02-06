var inputFolder = Folder.selectDialog("Select a folder to process");
var fileList = inputFolder.getFiles("*.txt"); //Use whatever extension you want or no extension to select all files

app.preferences.rulerUnits=Units.PIXELS
app.preferences.typeUnits=TypeUnits.POINTS
app.displayDialogs=DialogModes.NO

for(var i=0; i<fileList.length; i++) {
    var txtpath="";
	txtpath=fileList[i];
	var b = new File(txtpath);
    b.open('r');
    var previousFilename = "";
	var previousPath = "";
	var docRef;
    while(!b.eof){
        var line = b.readln();
		alert(line);
		var params = line.split("	");
		var X=params[0];
		var Y=params[1];
		var width=params[2];
        var height=params[3];
		var filename = params[4];
		var filepath = inputFolder + "/" + filename ;
        previousPath = inputFolder + "/" + previousFilename ;
		var bgcolor=params[5];
		var pfontsize=params[7];
		var lineheight=params[8];
		var fontname=params[9];
		var fontcolor=params[10];
        var textDirection=params[11];
		var alignment=params[12];
		var text=params[13];	
		//alert(filepath);
		if (previousFilename!=filename){
		    if (previousFilename!=""){
			    SaveAsPSDandClose(docRef,previousPath)
			}
			previousFilename=filename
			var f = new File(filepath);
		    docRef = open(f);
			addPreciseMask(filepath,docRef);
		}
		addTextLayer(docRef,X,Y,width,height,text,pfontsize,lineheight,fontname,fontcolor,textDirection,alignment)
    }
	b.close();
	SaveAsPSDandClose(docRef,filepath)
}

function addPreciseMask(docPath,docRef){
   var maskPath=docPath+"-text-removed.jpg"
   var f = new File(maskPath);
   var maskDoc = open(f);
   var backLayer=maskDoc.artLayers[0];
   backLayer.copy();
   var bounds=backLayer.bounds;
   maskDoc.close(SaveOptions.DONOTSAVECHANGES);
   var targetLayer=docRef.paste();
   //var targetBounds=targetLayer.Bounds
   //targetLayer.ApplyOffset(bounds[0]-targetBounds[0],bounds[1]-targetBounds[1],3)
}

function addTextLayer(docRef,X,Y,width,height,text,pfontsize,lineheight,fontname,fontcolor,textDirection,alignment){
    var res=docRef.resolution;
	var textLayer = docRef.artLayers.add();
	textLayer.kind=LayerKind.TEXT
	textLayer.textItem.kind= TextType.PARAGRAPHTEXT
    textLayer.textItem.contents = text

    textLayer.textItem.size   = pfontsize
    textLayer.textItem.position=Array(X,Y)
	
    width=width/res*72
    height=height/res*72
	
    textLayer.textItem.width=width
    textLayer.textItem.height=height
    textLayer.textItem.font= fontname
    textLayer.textItem.justification=getJustification(alignment)
	textLayer.textItem.direction = getDirection(textDirection)
    textLayer.textItem.hyphenation = true
    textLayer.textItem.useAutoLeading = false
    textLayer.textItem.leading=textLayer.textItem.Size*lineheight
	textLayer.textItem.color=getSolidColor(fontcolor)
}

function SaveAsPSDandClose(docRef,docPath){
    var psdPath=changeExtenstion(docPath,"psd")
    var output = new File(psdPath)
	alert(psdPath)
	var options = new PhotoshopSaveOptions()
	options.layers=true
    docRef.saveAs(output,options)
	docRef.close(SaveOptions.DONOTSAVECHANGES)
}

function changeExtenstion(filename,target){
    var strs = filename.split(".")
	strs.pop()
	strs.push(target)
	return strs.join(".")
}


function getSolidColor(color){
    var c = new SolidColor()
    c.rgb.red=color.split(",")[0]
	c.rgb.green=color.split(",")[1]
	c.rgb.blue=color.split(",")[2]
	return c
}


function getJustification(justification){
    justification=parseInt(justification)-1
    var c=Justification.CENTER;
	switch (justification) {
    case 0:
        c = Justification.LEFT;
        break;
    case 1:
        c = Justification.CENTER;
        break;
    case 2:
        c = Justification.RIGHT;
        break;
	}
	return c
}

function getDirection(textDirection){
    textDirection=parseInt(textDirection)-1
    var c=Direction.HORIZONTAL;
	switch (textDirection) {
    case 0:
        c = Direction.HORIZONTAL;
        break;
    case 1:
        c = Direction.VERTICAL;
        break;
	}
	return c
}
