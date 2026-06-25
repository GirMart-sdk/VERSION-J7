' =================================================================================
'  LANZADOR SILENCIOSO PARA WINNER BRIDGE
'  ---------------------------------------------------------------------------------
'  Este script ejecuta 'sync-bridge.bat' en segundo plano, solicitando
'  permisos de administrador si es necesario, pero sin mostrar ninguna
'  ventana de terminal (CMD).
' =================================================================================

Set fso = CreateObject("Scripting.FileSystemObject")
scriptPath = WScript.ScriptFullName
scriptDir = fso.GetParentFolderName(scriptPath)
batPath = fso.BuildPath(scriptDir, "sync-bridge.bat")

' --- Ejecutar el script .bat en segundo plano y con privilegios de admin ---
Set objShell = CreateObject("Shell.Application")
' El "0" al final indica que la ventana debe estar oculta. El directorio de trabajo se establece en scriptDir.
objShell.ShellExecute "cmd.exe", "/c """ & batPath & """", scriptDir, "runas", 0

' --- Esperar a que el script .bat termine y luego abrir el navegador ---
Set wshShell = CreateObject("WScript.Shell")
semaphoreFile = fso.BuildPath(scriptDir, "sync_complete.tmp")

' Espera hasta 60 segundos a que aparezca el archivo semáforo
For i = 1 To 60
    If fso.FileExists(semaphoreFile) Then
        wshShell.Run "explorer ""http://localhost:3000/admin-panel.html""", 1, false
        fso.DeleteFile(semaphoreFile)
        WScript.Quit
    End If
    WScript.Sleep 1000 ' Espera 1 segundo
Next