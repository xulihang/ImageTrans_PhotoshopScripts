#include json2.js
app.preferences.rulerUnits=Units.PIXELS
app.displayDialogs=DialogModes.NO
var layerIsFound=false;
var inputFolder = "";

if (inputFolder == "") {
  inputFolder = Folder.selectDialog("Select a folder to process");    
}

var psdList=[];
var resultDict={};
resultDict["dir"]=inputFolder.toString();
var outputPSDList=[];
var res;
getPSDList(inputFolder.toString())
for(var i=0; i<psdList.length; i++) {
	var PSDName=psdList[i].toString();
	var PSDDict={};
	PSDDict["filename"]=getRelativePath(PSDName, inputFolder.toString())
	readPSD(PSDName);
	outputPSDList.push(PSDDict)
}
resultDict["psds"]=outputPSDList
var result=unescape(JSON.stringify(resultDict, null, 4))
var a = new File(inputFolder + "/" + "export.txt");
a.open('w');
a.write(result)
a.close();

//alert(psdList.length+" files are read")
// 新增函数：获取相对路径
function getRelativePath(absolutePath, basePath) {
    // 确保basePath以文件分隔符结尾
    if (!basePath.match(/[\/\\]$/)) {
        basePath += "/";
    }
    
    // 如果绝对路径以basePath开头，则提取相对路径部分
    if (absolutePath.indexOf(basePath) === 0) {
        return absolutePath.substring(basePath.length);
    }
    
    // 如果不匹配，返回文件名部分作为后备方案
    var pathParts = absolutePath.split(/[\/\\]/);
    return pathParts[pathParts.length - 1];
}
function getPSDList(dirPath){
	var dir = new Folder(dirPath)
	var files = dir.getFiles(); 
	for(var i=0; i<files.length; i++) {
        var filePath = files[i];
		if (filePath instanceof File && endsWith(filePath.toString(),"psd")){
			psdList.push(filePath)
		}else{
			getPSDList(filePath.toString())
		}
    }
}

function endsWith(s1,s2){
	return s1.split(".").pop().match(s2)
}


function changeExtenstion(filename,target){
    var strs = filename.split(".")
	strs.pop()
	strs.push(target)
	return strs.join(".")
}

function readPSD(docPath){
	var f = new File(docPath)
	var docRef = open(f)
	res=docRef.resolution
	handleArtLayers(docRef.artLayers)
	handleLayerSets(docRef.layerSets)
	docRef.close(SaveOptions.DONOTSAVECHANGES)
}

function handleLayerSets(layerSets){
	for(var i=0; i<layerSets.length; i++) {
		var layerSet=layerSets[i];
		handleArtLayers(layerSet.artLayers);
		handleLayerSets(layerSet.layerSets);
	}
}

function handleArtLayers(artLayers){
	for(var i=0; i<artLayers.length; i++) {
		var artLayer = artLayers[i];
        if (artLayer.kind==LayerKind.TEXT){
			addLayerData(artLayer)
		}
	}
}

function addLayerData(artLayer){
	//alert(artLayer.textItem.contents)
	var layers=[];
	if (PSDDict.hasOwnProperty("layers")==true){
		layers=PSDDict["layers"]
	}
	var content=artLayer.textItem.contents
	if (content==""){
		return
	}
	var scale=res/72
	var bounds=artLayer.bounds
	artLayer.textItem.kind=TextType.POINTTEXT
	artLayer.textItem.kind=TextType.PARAGRAPHTEXT
	var width=artLayer.textItem.width*scale*scale
	var height=artLayer.textItem.height*scale*scale
	var dataDict={};
	dataDict["layername"]=encodeURI(artLayer.name.toString())
	dataDict["text"]=encodeURI(content.toString())
	dataDict["X"]=bounds[0].value.toString()
	dataDict["Y"]=bounds[1].value.toString()
	dataDict["width"]=width.value.toString()
	dataDict["height"]=height.value.toString()
	layers.push(dataDict)
	PSDDict["layers"]=layers
}

