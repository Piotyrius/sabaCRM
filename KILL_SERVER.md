# How to Stop the Dev Server

If you need to stop the server manually:

## Option 1: Task Manager
1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Find "Node.js JavaScript Runtime" processes
3. Right-click and select "End Task"
4. Do this for all Node.js processes

## Option 2: Command Prompt (as Administrator)
```cmd
taskkill /F /IM node.exe
```

## Option 3: PowerShell
```powershell
Get-Process node | Stop-Process -Force
```

## Option 4: Find and Kill Specific Port
If the server is running on port 3000:
```powershell
netstat -ano | findstr :3000
# Note the PID from the output, then:
taskkill /F /PID <PID>
```

## After Stopping
Restart with:
```bash
npm run dev
```

