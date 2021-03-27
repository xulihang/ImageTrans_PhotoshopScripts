#include <FileConstants.au3>
#include <File.au3>

$app = ObjCreate("Photoshop.Application")
if @error Then Exit
$doc=$app.activeDocument
$Layers=$doc.ArtLayers
handleLayers($Layers)


Func handleLayers($pLayers)
   For $i=1 to $pLayers.Count
	  $Layer=$pLayers.Item($i)
	  if $Layer.Kind = 2 Then
		 ConsoleWrite($Layer.textItem.Font)
		 Local $hFileOpen = FileOpen( @WorkingDir & "\font.txt", $FO_OVERWRITE)
		 If $hFileOpen = -1 Then
			MsgBox($MB_SYSTEMMODAL, "", "An error occurred when reading the file.")
			Return False
		 EndIf
		 FileWrite($hFileOpen, $Layer.textItem.Font)
		 FileClose($hFileOpen)
		 Exit
	  Endif
   Next
EndFunc
