# PowerShell script to prepare a portable distribution folder for Next.js app with backend API
# Usage: Run from project root in PowerShell

$distFolder = "dist-app"
$nodejsZipUrl = "https://nodejs.org/dist/v18.20.2/node-v18.20.2-win-x64.zip"
$nodejsZip = "nodejs.zip"
$nodejsFolder = "nodejs"

# Remove old dist folder if exists
if (Test-Path $distFolder) { Remove-Item $distFolder -Recurse -Force }

# Create dist folder
New-Item -ItemType Directory -Path $distFolder | Out-Null

# Copy package.json and server.js
Copy-Item package.json $distFolder
Copy-Item server.js $distFolder

# Install only production dependencies in dist folder
Push-Location $distFolder
npm install --only=production  --legacy-peer-deps
Pop-Location

# Copy .next and public folders
Copy-Item .next "$distFolder\.next" -Recurse
Copy-Item public "$distFolder\public" -Recurse
Copy-Item public "$distFolder\components" -Recurse
Copy-Item public "$distFolder\hooks" -Recurse
Copy-Item public "$distFolder\lib" -Recurse

# Download and extract portable Node.js directly into dist-app
curl.exe -L $nodejsZipUrl -o $nodejsZip
Expand-Archive -Path $nodejsZip -DestinationPath $distFolder
Rename-Item -Path "$distFolder\node-v18.20.2-win-x64" -NewName "nodejs"
Remove-Item $nodejsZip

# Create run.bat
$runBat = "@echo off`r`nsetlocal`r`nset NODE_ENV=production`r`nnodejs\node.exe server.js`r`npause"
Set-Content -Path "$distFolder\run.bat" -Value $runBat

Write-Host "Distribution folder '$distFolder' is ready. Double-click run.bat inside it to start your app."
