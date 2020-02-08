var precisionMode=true;
var psdExist=false;
var textKind=TextType.PARAGRAPHTEXT;
var layerIsFound=false;
var inputFolder = Folder.selectDialog("Select a folder to process");
var txtPath = inputFolder + "/" + "out.txt"
var txtFile = new File(txtPath)
if (txtFile.exists==false){
    alert("out.txt does not exist!")
}
else{
	app.preferences.rulerUnits=Units.PIXELS
    app.preferences.typeUnits=TypeUnits.POINTS
    app.displayDialogs=DialogModes.NO
	readParams(inputFolder.toString())
    var matchedLayer;
	var b = new File(txtPath);
    b.open('r');
    var previousFilename = "";
	var previousPath = "";
	var filepath = "";
	var docRef;
    while(!b.eof){
        var line = b.readln();
		//alert(line);
		var params = line.split("	");
		var X=params[0];
		var Y=params[1];
		var width=params[2];
        var height=params[3];
		var filename = params[4];
		filepath = inputFolder + "/" + filename ;
		var maskPath = filepath+"-text-removed.jpg"
		filepath=changeToPSDPathIfExist(filepath)
        previousPath = inputFolder + "/" + previousFilename ;
        previousPath=changeToPSDPathIfExist(previousPath)
		var bgcolor=params[5];
		var layername=params[6];
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
			if (precisionMode==true){
			    addPreciseMask(maskPath,docRef);	
			}
		}
		addTextLayer(docRef,layername,X,Y,width,height,text,pfontsize,lineheight,fontname,fontcolor,textDirection,alignment)
    }
	b.close();
	SaveAsPSDandClose(docRef,filepath)
}

function addPreciseMask(maskPath,docRef){
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

function addTextLayer(docRef,layername,X,Y,width,height,text,pfontsize,lineheight,fontname,fontcolor,textDirection,alignment){
    var res=docRef.resolution;
	if (layername=="NotALayer"){
		var textLayer = docRef.artLayers.add();
	}
	else {
		layerIsFound=false;
		var textLayer = getMatchedTextLayer(docRef,layername);
		if (layerIsFound==false){
			var textLayer = docRef.artLayers.add();
		}
	}
	
	textLayer.kind=LayerKind.TEXT
	textLayer.textItem.kind= textKind
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

function getMatchedTextLayer(docRef,layername){
    handleArtLayers(docRef.artLayers,layername)
	handleLayerSets(docRef.layerSets,layername)
	return matchedLayer
}

function handleLayerSets(layerSets,layername){
	for(var i=0; i<layerSets.length; i++) {
		var layerSet=layerSets[i];
		if (layerIsFound==true){
			break;
		}
		handleArtLayers(layerSet.artLayers,layername);
		handleLayerSets(layerSet.layerSets,layername);
	}
}

function handleArtLayers(artLayers,layername){
	for(var i=0; i<artLayers.length; i++) {
		var artLayer = artLayers[i];
		if (artLayer.name==layername){
			matchedLayer=artLayer;
			layerIsFound=true
			//alert("match")
			break;
		}
		if (layerIsFound==true){
			break;
		}
	}
}




function SaveAsPSDandClose(docRef,docPath){
    var psdPath=changeExtenstion(docPath,"psd")
    var output = new File(psdPath)
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

function changeToPSDPathIfExist(filePath){
    var psdPath = changeExtenstion(filePath,"psd");
    var f = new File (psdPath)
	if (f.exists){
		return psdPath
	}
	else{
		return filepath
	}
}

function readParams(dirPath){
	var paramFile = new File(dirPath + "/" + "params.txt")
	paramFile.open('r');
	var content = paramFile.readln();

	paramFile.close();
	var arr = content.split(",");
	var exeName=arr[0];
	var addMaskNum=arr[1];
	var precisionNum=arr[2];
	var flipNum=arr[3];
	var textKindNum=arr[4];
	if (exeName.match("PSD")){
		psdExist=true
	}
	
	if (parseInt(precisionNum)==0){
		precisionMode=false;
	}
	if (parseInt(textKindNum)==1){
		textKind=TextType.POINTTEXT
	}
}

