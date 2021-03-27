 #include <FileConstants.au3>
 #include <File.au3>

Global $FontSize = 6
Global $addMask
Global $precisionMode = 0 ;1 yes, 0 no
Global $flip = 0 ;1 yes, 0 no
Global $textKind = 2 ;1 point, 2 paragraph
ConsoleWrite( $cmdLine[0] & @CRLF)

if $cmdLine[0]<>4 Then
   $addMask=1 ; 0 don't, 1 add.
   $textKind=1
Else
   $addMask=$cmdLine[1]
   $precisionMode = $cmdLine[2]
   $flip = $cmdLine[3]
   $textKind = $cmdLine[4]
EndIf

Global $TextItemWidth = 50
Global $TextItemHeight = 50
Global $Language = 1

if FileExists(@WorkingDir&"\config.ini")=0 Then
   IniWrite(@WorkingDir&"\config.ini", "General", "FontSize", $FontSize)
   IniWrite(@WorkingDir&"\config.ini", "General", "TextItemWidth", "50")
   IniWrite(@WorkingDir&"\config.ini", "General", "TextItemHeight", "50")
   IniWrite(@WorkingDir&"\config.ini", "General", "Language", $Language)
Else
   $FontSize = IniRead (@WorkingDir&"\config.ini", "General", "FontSize", 6 )
   $TextItemWidth = IniRead (@WorkingDir&"\config.ini", "General", "TextItemWidth", 50 )
   $TextItemHeight = IniRead (@WorkingDir&"\config.ini", "General", "TextItemHeight", 50 )
   $Language = IniRead (@WorkingDir&"\config.ini", "General", "Language", 1 )
Endif
ConsoleWrite($FontSize)

Local $fsFileOpen = FileOpen(@WorkingDir&"\font.txt", $FO_READ)
Local $font = ""
If $fsFileOpen <> -1 Then
   $font=FileRead($fsFileOpen)
EndIf

Local $hFileOpen = FileOpen(@WorkingDir&"\out.txt", $FO_READ)
If $hFileOpen = -1 Then
   MsgBox($MB_SYSTEMMODAL, "", "An error occurred when reading the file(out.txt does not exist).")
   Return False
EndIf

Global $app = ObjCreate("Photoshop.Application")
$app.Preferences.RulerUnits = 1
$app.Preferences.TypeUnits = 5

Global $doc

Global $previousFilename = ""
Global $filename = ""
Global $fileindex=0
Global $index = 1

While True
   $line=FileReadLine($hFileOpen)
   if @error Then ExitLoop
   $lineSplit=StringSplit($line, @TAB)
   ConsoleWrite($lineSplit)
   $X=$lineSplit[1]
   $Y=$lineSplit[2]
   $width=$lineSplit[3]
   $height=$lineSplit[4]
   $filename=$lineSplit[5]
   $filenameWithoutExtention=StringLeft($filename, StringInStr($filename,".",0,-1)-1)
   $bgcolor=$lineSplit[6]
   $layername=$lineSplit[7]
   $pfontsize=$lineSplit[8]
   $lineheight=$lineSplit[9]
   $fontname=$lineSplit[10]
   $fontcolor=$lineSplit[11]
   $direction=$lineSplit[12]
   $alignment=$lineSplit[13]
   if $previousFilename<>$filenameWithoutExtention Then
	  if $previousFilename<>"" Then
		 if $flip=1 Then
			flip($doc)
		 EndIf
		 SaveAndClose($doc,@WorkingDir &"\"& $previousFilename & ".psd")
		 $index=1
	  EndIf
	  $fileindex=$fileindex+1
	  if FileExists(@WorkingDir &"\"& $fileName) Then
		 $doc = $app.open(@WorkingDir &"\"& $filenameWithoutExtention & ".psd")
		 $previousFilename=$filenameWithoutExtention
		 if $precisionMode = 1 and $addMask=1 Then
			$maskImgPath=@WorkingDir & "\" & $filename & "-text-removed.jpg"
			if FileExists($maskImgPath) Then
			   addPreciseMask($maskImgPath,$doc)
			EndIf
		 EndIf
	  Else
		 ContinueLoop
	  EndIf
   EndIf
   $text=StringRight($line, StringLen($line) - StringInStr($line,@TAB,0,19))
   $text=StringReplace($text, "\n", @CR)
   ConsoleWrite($X & @CRLF)
   ConsoleWrite($Y & @CRLF)
   ConsoleWrite($width & @CRLF)
   ConsoleWrite($height & @CRLF)
   ;ConsoleWrite($doc.Width & @CRLF)
   ;ConsoleWrite($doc.Height & @CRLF)
   ConsoleWrite($filename & @CRLF)
   ConsoleWrite($bgcolor & @CRLF)
   ConsoleWrite($text & @CRLF)
   if $layername="NotALayer" Then
	  addLayer($doc,$X,$Y,$width,$height,$text,$bgcolor,$pfontsize,$lineheight,$fontname,$fontcolor,$direction,$alignment)
   Else
	  import($doc,$text,$layername,$pfontsize,$lineheight,$fontname,$fontcolor,$direction,$alignment)
   EndIf
WEnd

ConsoleWrite("end" & $filename)
$filenameWithoutExtention=StringLeft($filename, StringInStr($filename,".",0,-1)-1)
if $flip=1 Then
   flip($doc)
EndIf
SaveAndClose($doc,@WorkingDir &"\"& $filenameWithoutExtention & ".psd")
MsgBox(64,"","Layers Added")

Func SaveAndClose($doc,$path)
   SaveAs($doc,$path)
   $doc.close(2); don't save
EndFunc

Func flip($doc)
   $doc.FlipCanvas(1)
   $LayerSets=$doc.LayerSets
   $ArtLayers=$doc.ArtLayers
   flipLayerSets($LayerSets)
   flipArtLayers($ArtLayers)
EndFunc

Func flipLayerSets($LayerSets)
   For $i=1 to $LayerSets.Count
	  $LayerSet=$LayerSets.Item($i)
	  flipArtLayers($LayerSet.ArtLayers)
	  flipLayerSets($LayerSet.LayerSets)
   Next
EndFunc

Func flipArtLayers($ArtLayers)
   For $i=1 to $ArtLayers.Count
	  $ArtLayer=$ArtLayers.Item($i)
	  if $ArtLayer.Kind=2  Then
		 ConsoleWrite("textLayer" & @CRLF)
		 $ArtLayer.Resize(-100,100,5)
	  EndIf
   Next
EndFunc

Func addPreciseMask($path,$doc)
   $maskDoc = $app.open($path)
   $backLayer=$maskDoc.ArtLayers.Item(1)
   $backLayer.copy()
   Dim $bounds[4]
   $bounds=$backLayer.Bounds
   $maskDoc.close(2)
   $targetLayer=$doc.paste()
   Dim $targetBounds[4]
   $targetBounds=$targetLayer.Bounds
   $targetLayer.ApplyOffset($bounds[0]-$targetBounds[0],$bounds[1]-$targetBounds[1],3)
EndFunc

Func addLayer($doc,$X,$Y,$width,$height,$text,$bgcolor,$pfontsize,$lineheight,$fontname,$fontcolor,$direction,$alignment)
   if $bgcolor<>"transparent" and $addMask=1 Then
	  if $precisionMode=0 Then
		 Dim $maskArtLayer = $doc.artLayers.add()
		 Dim $Position[2]
		 $Position[0]=$X
		 $Position[1]=$Y
		 $maskArtLayer.bounds=$Position
		 $maskArtLayer.name="mask "&$index
		 Dim $color = getSolidColor($bgcolor)
		 Dim $region[5]
		 Dim $arr1[2]
		 $arr1[0]=$X
		 $arr1[1]=$Y
		 Dim $arr2[2]
		 $arr2[0]=$X
		 $arr2[1]=$Y+$height
		 Dim $arr3[2]
		 $arr3[0]=$x+$width
		 $arr3[1]=$y+$height
		 Dim $arr4[2]
		 $arr4[0]=$x+$width
		 $arr4[1]=$Y
		 $region[0]=$arr1
		 $region[1]=$arr2
		 $region[2]=$arr3
		 $region[3]=$arr4
		 $region[4]=$arr4
		 $doc.Selection.Select($region)
		 $doc.Selection.Fill($color)
		 $index=$index+1
	  EndIf
   EndIf

   Dim $res = $doc.Resolution
   Dim $textLayer = $doc.artLayers.add()

   $textLayer.Kind=2
   $textLayer.textItem.Kind= int($textKind)
   $textLayer.textItem.Contents = $text
   ConsoleWrite("size:"&$FontSize)
   $textLayer.textItem.Size   = Int($pfontsize)
   Dim $Position[2]
   $Position[0]=int($X)
   $Position[1]=int($Y)
   $textLayer.textItem.Position=$Position
   ConsoleWrite(int($width) & @CRLF)
   ConsoleWrite($doc.Width)
   ;$textLayer.textItem.Width=int($TextItemWidth)
   ;$textLayer.textItem.Height=int($TextItemHeight)
   ;ConsoleWrite("width" & $width & @CRLF)
   ;ConsoleWrite("height" & $height & @CRLF)

   $width=$width/$res*72
   $height=$height/$res*72

   $textLayer.textItem.Font= $fontname
   $textLayer.textItem.Width=int($width)
   $textLayer.textItem.Height=int($height)
   $textLayer.textItem.Justification=int($alignment)
   $textLayer.textItem.Capitalization=2 ;capcase
   $textLayer.textItem.Language= int($Language)
   $textLayer.textItem.Hyphenation = True
   $textLayer.textItem.UseAutoLeading = False
   $textLayer.textItem.Leading=Ceiling($textLayer.textItem.Size)*$lineheight
   $textLayer.textItem.Direction = int($direction)
   Dim $fColor = getSolidColor($fontcolor)
   $textLayer.textItem.Color=$fColor
   ;ConsoleWrite("width" & $textLayer.textItem.Width & @CRLF)
   ;ConsoleWrite("height" & $textLayer.textItem.Height & @CRLF)

EndFunc

Func getSolidColor($colorString)
   Dim $colors[3]
   $colors = StringSplit($colorString,",")
   ConsoleWrite($colors[1] & @CRLF)
   ConsoleWrite($colors[2] & @CRLF)
   ConsoleWrite($colors[3] & @CRLF)
   Dim $r = $colors[1]
   Dim $g = $colors[2]
   Dim $b = $colors[3]
   Dim $color = ObjCreate("Photoshop.SolidColor")
   $color.RGB.Red=int($r)
   $color.RGB.Green=int($g)
   $color.RGB.Blue=int($b)
   return $color
EndFunc

Func SaveAsJPG($doc,$path)
   Dim $ObjSaveOptions=ObjCreate("Photoshop.JPEGSaveOptions")
   ;if @error Then Exit
   With $ObjSaveOptions
	.EmbedColorProfile = True
	.FormatOptions = 1
	.Matte = 1
	.Quality = 12
   EndWith
   ConsoleWrite($path&@CRLF)
   $doc.SaveAS($path,$ObjSaveOptions,True,2)
EndFunc

Func SaveAs($doc,$path)
   Dim $ObjSaveOptions=ObjCreate("Photoshop.PhotoshopSaveOptions")
   ;if @error Then Exit
   With $ObjSaveOptions
	.Layers = True
   EndWith
   ConsoleWrite($path&@CRLF)
   $doc.SaveAS($path,$ObjSaveOptions,True,2)
EndFunc

Func import($doc,$text,$layername,$pfontsize,$lineheight,$fontname,$fontcolor,$direction,$alignment)
   $LayerSets=$doc.LayerSets
   $ArtLayers=$doc.ArtLayers
   handleLayerSets($LayerSets,$text,$layername,$pfontsize,$lineheight,$fontname,$fontcolor,$direction,$alignment)
   handleArtLayers($ArtLayers,$text,$layername,$pfontsize,$lineheight,$fontname,$fontcolor,$direction,$alignment)
EndFunc

Func handleLayerSets($LayerSets,$text,$layername,$pfontsize,$lineheight,$fontname,$fontcolor,$direction,$alignment)
   For $i=1 to $LayerSets.Count
	  $LayerSet=$LayerSets.Item($i)
	  handleArtLayers($LayerSet.ArtLayers,$text,$layername,$pfontsize,$lineheight,$fontname,$fontcolor,$direction,$alignment)
	  handleLayerSets($LayerSet.LayerSets,$text,$layername,$pfontsize,$lineheight,$fontname,$fontcolor,$direction,$alignment)
   Next
EndFunc

Func handleArtLayers($ArtLayers,$text,$layername,$pfontsize,$lineheight,$fontname,$fontcolor,$direction,$alignment)
   For $i=1 to $ArtLayers.Count
	  $ArtLayer=$ArtLayers.Item($i)
	  Dim $bounds[4]
	  $bounds=$ArtLayer.Bounds
	  Dim $position[2] ; two values
	  $position[0]=$bounds[0]
	  $position[1]=$bounds[1]
	  if $layerName=$ArtLayer.name Then
		 if $ArtLayer.Kind=1  Then
			$ArtLayer.clear()
			$ArtLayer.Kind = 2
			$ArtLayer.textItem.Kind=int($textKind)
			$ArtLayer.textItem.Width=Ceiling($TextItemWidth)
			$ArtLayer.textItem.Height=Ceiling($TextItemHeight)
			$ArtLayer.textItem.Size=Ceiling($pfontsize)
			$ArtLayer.textItem.Position=$position
			$ArtLayer.name=$text
		 Else
			$ArtLayer.textItem.Kind=int($textKind)
		 EndIf
		 $ArtLayer.textItem.Contents = $text
		 $ArtLayer.textItem.Font= $fontname
		 $ArtLayer.textItem.Justification=int($alignment)
		 $ArtLayer.textItem.Capitalization=2 ;capcase
		 $ArtLayer.textItem.Language= int($Language)
		 $ArtLayer.textItem.Hyphenation = True
		 $ArtLayer.textItem.UseAutoLeading = False
		 $ArtLayer.textItem.Leading=Ceiling($ArtLayer.textItem.Size)*$lineheight
		 $ArtLayer.textItem.Direction = int($direction)
		 Dim $fColor = getSolidColor($fontcolor)
		 $ArtLayer.textItem.Color=$fColor
	  Endif
   Next
EndFunc