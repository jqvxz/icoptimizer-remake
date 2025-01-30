Set objShell = CreateObject("Shell.Application")
Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objWShell = CreateObject("WScript.Shell")

MsgBox "Launch icoptimizer debug", vbInformation, "icoptimizer debug"

objWShell.Run "taskkill /f /im icoptimizer.exe", 0, True
WScript.Sleep 1000

Function TryLaunch(path)
    On Error Resume Next
    objShell.ShellExecute "cmd.exe", "/k start """" """ & path & """", "", "runas", 1
    If Err.Number = 0 Then
        TryLaunch = True
    Else
        TryLaunch = False
    End If
    On Error Goto 0
End Function

' Possible paths
paths = Array( _
    "C:\Program Files\icoptimizer\icoptimizer.exe", _
    "C:\Users\%username%\AppData\Local\Programs\icoptimizer", _
    "C:\Program Files\icoptimizer-0.2.6\icoptimizer.exe", _
    "C:\Program Files\icoptimizer-0.2.6\icoptimizer-0.2.6.exe", _
    "C:\Program Files\icoptimizer-0.2.5\icoptimizer-0.2.5.exe", _
    "C:\Program Files\icoptimizer-0.2.4\icoptimizer-0.2.4.exe", _
    "C:\Program Files\icoptimizer-0.2.4\icoptimizer-0.2.6.exe", _
    "C:\Program Files\icoptimizer-0.2.5\icoptimizer-0.2.6.exe" _
)

For Each path In paths
    If objFSO.FileExists(path) Then
        If TryLaunch(path) Then
            WScript.Quit
        End If
    End If
Next

WScript.Echo "No valid path found"