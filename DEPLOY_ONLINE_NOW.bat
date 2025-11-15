@echo off
echo ========================================
echo  DEPLOYING TUTORNEST ONLINE
echo ========================================
echo.
echo This will deploy your website to the internet!
echo.
echo Step 1: Opening Netlify Drop...
echo ----------------------------------------
echo.
start https://app.netlify.com/drop
echo.
echo INSTRUCTIONS:
echo 1. A browser window just opened to Netlify
echo 2. DRAG this entire TutorNest folder onto the page
echo 3. Your website will be LIVE in seconds!
echo 4. You'll get a URL like: https://amazing-site-123.netlify.app
echo.
echo ========================================
echo.
echo After uploading, you can:
echo - Share your live URL with anyone
echo - Access from any device
echo - It's FREE forever!
echo.
echo Press any key to open your TutorNest folder...
pause >nul
explorer %~dp0
echo.
echo ========================================
echo  DRAG THE TUTORNEST FOLDER TO NETLIFY
echo ========================================
echo.
pause
