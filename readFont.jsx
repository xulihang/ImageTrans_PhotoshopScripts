var docRef=app.activeDocument
for(var i=0; i<docRef.artLayers.length; i++) {
	artLayer=docRef.artLayers[i]
    if (artLayer.kind==LayerKind.TEXT){
		alert(artLayer.textItem.font)
		break
	}
}