var layerIsFound=false;
var inputFolder = Folder.selectDialog("Select a folder to process");
var psdList=[];
getPSDList(inputFolder.toString())
for(var i=0; i<psdList.length; i++) {
	SaveAsJPGandClose(psdList[i].toString())
}

alert(psdList.length+" files are converted")

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

function SaveAsJPGandClose(docPath){
	//alert(docPath)
	var f = new File(docPath)
	var docRef = open(f);
    var jpgPath= changeExtenstion(docPath,"jpg")
    var output = new File(jpgPath)
	var options = new JPEGSaveOptions()
	options.embedColorProfile = true
	options.quality = 12
    docRef.saveAs(output,options)
	docRef.close(SaveOptions.DONOTSAVECHANGES)
}



