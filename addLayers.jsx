#include BBCodeParser.js
var precisionMode=true;
var richText=true;
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
    filepath=changeToPSDPathIfExist(filepath)
    //alert(filepath);
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
        SaveAsPSDandClose(docRef,previousPath)
      }
      previousFilename=filename
      //alert(filepath);
      var f = new File(filepath);
      docRef = open(f);
      index=0
      if (addMask==true && precisionMode==true){
        addPreciseMask(filepath,docRef);  
      }
    }
    index=index+1
    addMaskLayer(docRef,X,Y,width,height,bgcolor,index)
    addTextLayer(docRef,layername,X,Y,width,height,text,pfontsize,lineheight,fontname,fontcolor,textDirection,alignment,wrap,bold,italic,capital,rotationDegree,shadowRadius,shadowColor)
  }
  b.close();
  SaveAsPSDandClose(docRef,filepath)
}

function addPreciseMask(filepath,docRef){
  var maskPath = filepath+"-text-removed.jpg"
  var f = new File(maskPath);
  if (f.exists==false){
    maskPath = filepath+"-text-removed.png"
    f = new File(maskPath);
    if (f.exists==false){
      maskPath = inputFolder + "/intermediateResults/" + filename + "-text-removed.jpg"
      f = new File(maskPath);
      if (f.exists==false){
        maskPath = inputFolder + "/intermediateResults/" + filename + "-text-removed.png"
        f = new File(maskPath);
        if (f.exists==false){
          return;
        }
      }
    }
  }


  var maskDoc = open(f);
  var backLayer = maskDoc.artLayers[0];
  backLayer.copy();
  var bounds = backLayer.bounds;
  maskDoc.close(SaveOptions.DONOTSAVECHANGES);
  var targetLayer = docRef.paste();
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
  
  var runs;
  if (richText==true) {
    runs = parseBBCode(text);
    text = "";
    for (var index = 0; index <= runs.length - 1; index++) {
      text = text + runs[index].text;
    }
  }
  
  textLayer.textItem.position=Array(X,Y)
  textLayer.textItem.contents = text
  textLayer.textItem.direction = getDirection(textDirection)

  textLayer.textItem.size = new UnitValue(pfontsize/res*72,"px")
  textLayer.textItem.font = fontname
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
    var strokeColor = getRGBColor(shadowColor);
    addStroke(shadowRadius, strokeColor, 100, 'outside');
  }
  
  if (richText==true) {
    setInlineStyles(runs,textLayer);
  }
  
  textLayer.textItem.justification=getJustification(alignment)
}

function setInlineStyles(runs,textLayer) {
  var idtextLayer = stringIDToTypeID("textLayer");
  var idordinal = stringIDToTypeID("ordinal");
  var idtargetEnum = stringIDToTypeID("targetEnum");
  var idnull = charIDToTypeID( "null" );
  var idfrom = charIDToTypeID("From");
  var idto = stringIDToTypeID("to");
  var idtextStyle = stringIDToTypeID("textStyle");
  var idtextStyleRange = stringIDToTypeID("textStyleRange");
  var idset = stringIDToTypeID("set");
  var idsize = stringIDToTypeID("size");
  var idpixelsUnit = stringIDToTypeID("pixelsUnit");
  var idcolor = stringIDToTypeID("color");
  var idRd = stringIDToTypeID("red");
  var idGrn = stringIDToTypeID("grain");
  var idBl = stringIDToTypeID("blue");
  var idRGBColor = stringIDToTypeID("RGBColor");
  var startIndex = 0;
  var endIndex = 0;
  for (var index = 0; index <= runs.length - 1; index++) {
    var run = runs[index];
    endIndex = startIndex + run.text.length;

    var formatting = new ActionDescriptor();
    var hasRichFormat = false;
    
    var fontSize = textLayer.textItem.size;
    if (run.fontsize) {
      hasRichFormat = true;
      fontSize = run.fontsize;
    }
    formatting.putUnitDouble(idsize, idpixelsUnit, fontSize);
    
    var fontName = textLayer.textItem.font;
    
    if (run.fontname) {
      hasRichFormat = true;
      fontName = run.fontname;
    }
    var idfontPostScriptName = stringIDToTypeID( "fontPostScriptName" );
    formatting.putString( idfontPostScriptName, fontName );
      
    if (run.bold || run.fauxBold) {
      hasRichFormat = true;
      var idsyntheticBold = stringIDToTypeID( "syntheticBold" );
      formatting.putBoolean(idsyntheticBold, true);
    }
    
    if (run.italic || run.fauxItalic) {
      hasRichFormat = true;
      var idsyntheticItalic = stringIDToTypeID( "syntheticItalic" );
      formatting.putBoolean(idsyntheticItalic, true);
    }
    
    if (run.color) {
      hasRichFormat = true;
      var colorAction = new ActionDescriptor();
      colorAction.putDouble(idRd, run.color.r);
      colorAction.putDouble(idGrn, run.color.g);
      colorAction.putDouble(idBl, run.color.b);
      formatting.putObject(idcolor, idRGBColor, colorAction);
    }
    
    if (hasRichFormat) {
      var reference = new ActionReference();
      reference.putEnumerated(idtextLayer, idordinal, idtargetEnum);
      var action = new ActionDescriptor();
      action.putReference(idnull, reference);
      var textAction = new ActionDescriptor();
      var actionList = new ActionList();
      
      var idstyleSheetHasParent = stringIDToTypeID( "styleSheetHasParent" );
      formatting.putBoolean( idstyleSheetHasParent, true );
      
      var textRange = new ActionDescriptor();
      textRange.putInteger(idfrom, startIndex);
      textRange.putInteger(idto, endIndex);
      textRange.putObject(idtextStyle, idtextStyle, formatting);
      actionList.putObject(idtextStyleRange, textRange);
      textAction.putList(idtextStyleRange, actionList);
      action.putObject(idto, idtextLayer, textAction);
      executeAction(idset, action, DialogModes.NO);
    }

    startIndex = endIndex;
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




function SaveAsPSDandClose(docRef,docPath){
  var psdPath=changeExtenstion(docPath,"psd");
  var psbPath=changeExtenstion(docPath,"psb");
  var psdFile = new File(psdPath);
  var psbFile = new File(psbPath);
  
  if (psbFile.exists){
    docRef.close(SaveOptions.SAVECHANGES);
  }else if (psdFile.exists) {
    docRef.close(SaveOptions.SAVECHANGES);
  }else{
    var output = new File(psdPath);
    var options = new PhotoshopSaveOptions();
    options.layers=true;
    docRef.saveAs(output,options);
    docRef.close(SaveOptions.DONOTSAVECHANGES);
  }
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

function getRGBColor(color){
  var c = new RGBColor()
  c.red=color.split(",")[0]
  c.green=color.split(",")[1]
  c.blue=color.split(",")[2]
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
  //alert(pfilePath);
  var psdPath = changeExtenstion(pfilePath,"psd");
  var f = new File(psdPath)
  if (f.exists){
    return psdPath;
  }
  else{
    var psbPath = changeExtenstion(pfilePath,"psb");
    var f = new File(psbPath)
    if (f.exists){
      return psbPath;
    }
  }
  return pfilePath
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
  var richTextNum=arr[5];
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
  if (richTextNum) {
    if (parseInt(richTextNum)==0){
      richText=false;
    }
  }else{
    richText=false;
  }
}

/* https://community.adobe.com/t5/photoshop-ecosystem-discussions/add-a-stroke-layer-style-effect-to-the-active-layer-extendscript/m-p/8630771#M281723

 * Add Stroke Effect

 * @param {Number} size : 1 - 250

 * @param {Object} color : RGBColor object

 * @param {Number} opacity : 0 - 100

 * @param {Number} position : center / outside / inside

 */

function addStroke(size, color, opacity, position) {

    var strokePosCharID;

    switch(position) {

        case 'center':

            strokePosCharID = 'CtrF';

            break;

        case 'outside':

            strokePosCharID = 'OutF';

            break;

        case 'inside':

            strokePosCharID = 'InsF';

            break;

        default: break; 

    }


    var desc = new ActionDescriptor();

    var ref190 = new ActionReference();

    ref190.putProperty( charIDToTypeID( "Prpr" ), charIDToTypeID( "Lefx" ) );

    ref190.putEnumerated( charIDToTypeID( "Lyr " ), charIDToTypeID( "Ordn" ), charIDToTypeID( "Trgt" ) );

    desc.putReference( charIDToTypeID( "null" ), ref190 );

    var fxDesc = new ActionDescriptor();

    var fxPropDesc = new ActionDescriptor();

    fxPropDesc.putBoolean( charIDToTypeID( "enab" ), true );

    fxPropDesc.putBoolean( stringIDToTypeID( "present" ), true );

    fxPropDesc.putBoolean( stringIDToTypeID( "showInDialog" ), true );

    fxPropDesc.putEnumerated( charIDToTypeID( "Styl" ), charIDToTypeID( "FStl" ), charIDToTypeID( strokePosCharID ) );

    fxPropDesc.putEnumerated(  charIDToTypeID( "PntT" ),  charIDToTypeID( "FrFl" ), charIDToTypeID( "SClr" ) );

    fxPropDesc.putEnumerated( charIDToTypeID( "Md  " ), charIDToTypeID( "BlnM" ), charIDToTypeID( "Nrml" ) );

    fxPropDesc.putUnitDouble( charIDToTypeID( "Opct" ), charIDToTypeID( "#Prc" ), opacity );

    fxPropDesc.putUnitDouble( charIDToTypeID( "Sz  " ), charIDToTypeID( "#Pxl") , size );

    var colorDesc = new ActionDescriptor();

    colorDesc.putDouble( charIDToTypeID( "Rd  " ), color.red);

    colorDesc.putDouble( charIDToTypeID( "Grn " ), color.green );

    colorDesc.putDouble( charIDToTypeID( "Bl  " ), color.blue );

    fxPropDesc.putObject( charIDToTypeID( "Clr " ), charIDToTypeID( "RGBC" ), colorDesc );

    fxPropDesc.putBoolean( stringIDToTypeID( "overprint" ), false );

    fxDesc.putObject( charIDToTypeID( "FrFX" ), charIDToTypeID( "FrFX" ), fxPropDesc );

    desc.putObject( charIDToTypeID( "T   " ), charIDToTypeID( "Lefx" ), fxDesc );

    executeAction( charIDToTypeID( "setd" ), desc, DialogModes.NO );

}
