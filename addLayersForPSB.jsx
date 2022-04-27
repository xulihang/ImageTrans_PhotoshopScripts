var precisionMode=true;
var psdExist=false;
var addMask=false;
var isPoint=false;
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
	var index=0;
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
		var pfontsize=12.0;
		pfontsize=params[7];
		var lineheight=params[8];
		var fontname=params[9];
		var fontcolor=params[10];
        var textDirection=params[11];
		var alignment=params[12];
		var wrap=true;
		if (params[13]=="false"){
			wrap=false;
		}
		var bold=false;
		if (params[14]=="true"){
			bold=true;
		}
		var italic=false;
		if (params[15]=="true"){
			italic=true;
		}
		var capital=false;
		if (params[16]=="true"){
			capital=true;
		}
		var rotationDegree=0;
		if (params[17]!="null"){
			rotationDegree=params[17];
		}
		var shadowRadius=1;
		if (params[18]!="null"){
			shadowRadius=params[18];
		}
		var shadowColor="null";
		if (params[19]!="null"){
			shadowColor=params[19];
		}			
		var text=params[params.length-1];	
		//alert(filepath);
		if (previousFilename!=filename){
		    if (previousFilename!=""){
			    SaveAndClose(docRef,previousPath)
			}
			previousFilename=filename
			var f = new File(filepath);
		    docRef = open(f);
			index=0
			if (precisionMode==true){
			    addPreciseMask(maskPath,docRef);	
			}
		}
		index=index+1
		addMaskLayer(docRef,X,Y,width,height,bgcolor,index)
		addTextLayer(docRef,layername,X,Y,width,height,text,pfontsize,lineheight,fontname,fontcolor,textDirection,alignment,wrap,bold,italic,capital,rotationDegree,shadowRadius,shadowColor)
    }
	b.close();
	SaveAndClose(docRef,filepath)
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

function addTextLayer(docRef,layername,X,Y,width,height,text,pfontsize,lineheight,fontname,fontcolor,textDirection,alignment,wrap,bold,italic,capital,rotationDegree,shadowRadius,shadowColor){
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
	text=unescape(text)
	textLayer.kind=LayerKind.TEXT
	

	if (wrap==true){
		textLayer.textItem.kind=TextType.PARAGRAPHTEXT
		width=width/res*72
		height=height/res*72
		textLayer.textItem.width=width
		textLayer.textItem.height=height
	}else{
		textLayer.textItem.kind=TextType.POINTTEXT
	}


    if (bold==true){
	    textLayer.textItem.fauxBold=true;
	}
	if (italic==true){
	    textLayer.textItem.fauxItalic=true;
	}
	if (capital==true){
		textLayer.textItem.capitalization=TextCase.ALLCAPS
	}
	if (rotationDegree!=0){
		textLayer.rotate(rotationDegree,AnchorPosition.MIDDLECENTER)
	}
	textLayer.textItem.position=Array(X,Y)
	textLayer.textItem.contents = text
	textLayer.textItem.direction = getDirection(textDirection)
	textLayer.textItem.size = pfontsize
    textLayer.textItem.font = fontname
    textLayer.textItem.justification=getJustification(alignment)
    textLayer.textItem.hyphenation = true
    textLayer.textItem.useAutoLeading = false
    textLayer.textItem.leading=textLayer.textItem.size*lineheight
	textLayer.textItem.color=getSolidColor(fontcolor)
	
	if (isPoint==true){
		textLayer.textItem.kind=TextType.POINTTEXT
		var currentText=textLayer.textItem.contents;
		if (currentText.length<text.length){
			textLayer.textItem.contents = text
		}
	}
	
	if (shadowColor!="null"){
		docRef.selection.selectAll();
		try {
		    docRef.selection.stroke(getSolidColor(shadowColor),shadowRadius);		
        } catch (error) {

        }
        docRef.selection.deselect();
	}
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

function addMaskLayer(docRef,X,Y,width,height,bgcolor,index){
	if (addMask==true && bgcolor!="transparent"){
		if (precisionMode==false){
			//alert(Array(X,Y,width,height).join("."))
			X=parseInt(X)
			Y=parseInt(Y)
			width=parseInt(width)
			height=parseInt(height)
			maskArtLayer = docRef.artLayers.add()
		    maskArtLayer.bounds=Array(X,Y)
		    maskArtLayer.name="mask "+index
		    color = getSolidColor(bgcolor)
		    var arr1=Array(X,Y)
		    var arr2=Array(X,Y+height)
			var arr3=Array(X+width,Y+height)
			var arr4=Array(X+width,Y)
		    var region=Array(arr1,arr2,arr3,arr4)
			//alert(region.toString())
		    docRef.selection.select(region)
		    docRef.selection.fill(color)
		}
	}
}




function SaveAndClose(docRef,docPath){
	docRef.close(SaveOptions.SAVECHANGES)
}

function unescape(text){
	return text.split("\\n").join('\r')
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

function changeToPSDPathIfExist(pfilePath){
    var psdPath = changeExtenstion(pfilePath,"psb");
    var f = new File (psdPath)
	if (f.exists){
		return psdPath
	}
	else{
		return pfilePath
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
	if (parseInt(addMaskNum)==1){
		addMask=true;
	}
	if (parseInt(precisionNum)==0){
		precisionMode=false;
	}
	if (parseInt(textKindNum)==1){
		isPoint=true;
	}
}

