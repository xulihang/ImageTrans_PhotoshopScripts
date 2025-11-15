var docRef=app.activeDocument
var outputPath = "";
var textLayer;
for(var i=0; i<docRef.artLayers.length; i++) {
    artLayer=docRef.artLayers[i]
    if (artLayer.kind==LayerKind.TEXT){
        textLayer = artLayer;
        if (outputPath == "") {
           alert(textLayer.textItem.font)
        }
        break
    }
}

if (outputPath != "") {
  var outFile = new File(outputPath);
  outFile.encoding = "UTF-8";
  outFile.open("w");
  outFile.write(textLayer.textItem.font);
  outFile.close();
}

if (textLayer) {
  textLayer.textItem.font;
}

