@echo off
cd server
echo Checking Java...
java -version
if %errorlevel% neq 0 (
    echo Java not found. Please install Java 17+ or configure your path.
    pause
    exit /b
)

echo.
echo Trying to start the Backend with Maven...
mvn spring-boot:run
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Maven not found or failed to start.
    echo ------------------------------------------------------------
    echo To fix this:
    echo 1. Download Maven from: https://maven.apache.org/download.cgi
    echo 2. Extract it and add the 'bin' folder to your PATH.
    echo 3. Or use your IDE's 'Run' button (IntelliJ/VS Code).
    echo ------------------------------------------------------------
    pause
)
pause
