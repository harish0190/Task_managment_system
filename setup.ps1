# VoiceTask Setup Helper

# Check Java
Write-Host "🔍 Checking Java Version..." -ForegroundColor Cyan
try {
    $javaVer = java -version 2>&1 | Out-String
    Write-Host "✅ Java is installed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Java not found! Please install Java 17+ from https://adoptium.net/" -ForegroundColor Red
    return
}

# Check Maven
Write-Host "🔍 Checking Maven..." -ForegroundColor Cyan
try {
    $mvnVer = mvn -version 2>&1 | Out-String
    Write-Host "✅ Maven is installed!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Maven not found!" -ForegroundColor Yellow
    Write-Host "To run without an IDE, you should install Maven (https://maven.apache.org/download.cgi)" -ForegroundColor Gray
    Write-Host "Or you can try to run the backend via your IDE if you prefer." -ForegroundColor Gray
}

Write-Host "`n--- How to Run (Command Line) ---" -ForegroundColor Blue
Write-Host "1. Open a terminal in the 'Backend' folder."
Write-Host "2. Run: 'mvn spring-boot:run'"
Write-Host "3. Once it says 'Started BackendApplication', open 'Frontend/index.html' in your browser."
Write-Host "-------------------------------`n"
