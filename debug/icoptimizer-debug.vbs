' Future versions will include debug launch natively
Set objShell = CreateObject("Shell.Application")
Set objFSO = CreateObject("Scripting.FileSystemObject")

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

' Replace with actual path of icoptimizer
paths = Array( _
    "C:\Program Files\icoptimizer-0.2.6\icoptimizer-0.2.6.exe", _
    "C:\Program Files\icoptimizer-0.2.4\icoptimizer-0.2.6.exe", _
    "C:\Program Files\icoptimizer-0.2.5\icoptimizer-0.2.6.exe", _
    "C:\Program Files\icoptimizer-0.2.4\icoptimizer-0.2.4.exe", _
    "C:\Program Files\icoptimizer-0.2.5\icoptimizer-0.2.5.exe" _
)

For Each path In paths
    If objFSO.FileExists(path) Then
        If TryLaunch(path) Then
            WScript.Quit
        End If
    End If
Next

WScript.Echo "No valid path found"
