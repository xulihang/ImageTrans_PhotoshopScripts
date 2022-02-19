 #include <FileConstants.au3>
 #include <File.au3>

Local $hFileOpen = FileOpen(@WorkingDir&"\out.txt", $FO_READ)
If $hFileOpen = -1 Then
   MsgBox($MB_SYSTEMMODAL, "", "An error occurred when reading the file(out.txt does not exist).")
   Return False
EndIf

$line=FileReadLine($hFileOpen)
ConsoleWrite($line&@CRLF)
$lineSplit=StringSplit($line, @TAB)


$text=StringRight($line, StringLen($line) - StringInStr($line,@TAB,0,20))
ConsoleWrite($text)