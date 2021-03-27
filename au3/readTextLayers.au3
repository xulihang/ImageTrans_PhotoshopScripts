#include <FileConstants.au3>
#include <File.au3>

Dim $filename

if $cmdLine[0]<>1 Then
   $filename="test.psd"
   ;Exit(1)
Else
   $filename=$cmdLine[1]
EndIf

Local $hFileOpen = FileOpen(@WorkingDir & "\" & $filename&".txt", $FO_OVERWRITE)
If $hFileOpen = -1 Then
   MsgBox($MB_SYSTEMMODAL, "", "An error occurred when reading the file.")
   Return False
EndIf


;MsgBox(64,$filename,$layerName)

$app = ObjCreate("Photoshop.Application")
$app.Preferences.RulerUnits = 1
$app.Preferences.TypeUnits = 5
$doc = $app.open(@WorkingDir & "\" & $fileName)

$res=$doc.Resolution

$LayerSets=$doc.LayerSets
$ArtLayers=$doc.ArtLayers
handleLayerSets($LayerSets)
handleArtLayers($ArtLayers)
FileClose($hFileOpen)
$doc.close(2)

Func handleLayerSets($LayerSets)
   For $i=1 to $LayerSets.Count
	  $LayerSet=$LayerSets.Item($i)
	  handleArtLayers($LayerSet.ArtLayers)
	  handleLayerSets($LayerSet.LayerSets)
   Next
EndFunc

Func handleArtLayers($ArtLayers)
   ConsoleWrite("handling")
   For $i=1 to $ArtLayers.Count
	  $ArtLayer=$ArtLayers.Item($i)
	  if $ArtLayer.Kind=2 Then
		 Dim $bounds[4]
		 $bounds=$ArtLayer.Bounds
		 Dim $position[2] ; two values
		 $position[0]=$bounds[0]
		 $position[1]=$bounds[1]
		 $layername=$ArtLayer.Name
		 $content=$ArtLayer.textItem.Contents
		 if $content="" Then
			ContinueLoop
		 EndIf
		 $ArtLayer.textItem.Kind=1 ;point
		 ;$ArtLayer.textItem.Contents=$content & @CRLF
		 $ArtLayer.textItem.Kind=2 ;paragraph
		 ConsoleWrite(@CRLF)
		 ConsoleWrite($position[0] & @CRLF)
		 ConsoleWrite($position[1] & @CRLF)
		 ConsoleWrite($ArtLayer.textItem.Width & @CRLF)
		 ConsoleWrite($ArtLayer.textItem.Height & @CRLF)

         $content=StringReplace($content,@CRLF,"\n")
		 $content=StringReplace($content,@CR,"\n")
		 $content=StringReplace($content,@LF,"\n")
		 ;$content=StringRegExpReplace($content,"\r","")
		 $layername=$ArtLayer.Name
		 Dim $scale
		 $scale=$res/72

		 $text=$position[0] & @TAB & $position[1] & @TAB & $ArtLayer.textItem.Width*$scale*$scale & @TAB & $ArtLayer.textItem.Height*$scale*$scale & @TAB & $layername & @TAB &  $content
		 FileWriteLine($hFileOpen,$text)
	  EndIf
   Next
EndFunc

