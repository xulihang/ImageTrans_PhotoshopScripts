#include <File.au3>
Global $filename

if $cmdLine[0]<>1 Then
   $filename="test.psd"
   ;Exit(1)
Else
   $filename=$cmdLine[1]
EndIf

Export()

Func Export()
   $app = ObjCreate("Photoshop.Application")
   $doc=$app.open(@WorkingDir& "\" &$filename)
   $purefileName=StringReplace($filename,".psd","",-1, $STR_NOCASESENSE)
   SaveAs($doc,@WorkingDir& "\" &$purefileName&".jpg")
   $doc.close(2)
EndFunc

Func SaveAs($doc,$path)
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