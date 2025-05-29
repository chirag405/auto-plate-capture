@echo off
echo Starting Real-time License Plate Detection App...
echo.
echo Make sure your camera is connected and the virtual environment is activated!
echo.

cd /d "%~dp0"

if exist "license_plate_env\Scripts\activate.bat" (
    echo Activating virtual environment...
    call license_plate_env\Scripts\activate.bat
) else (
    echo Virtual environment not found. Please ensure it's set up correctly.
    pause
    exit /b 1
)

echo Installing/updating required packages...
python -m pip install --upgrade pip
python -m pip install streamlit pandas

echo.
echo Starting Streamlit app...
echo Open your browser and go to: http://localhost:8501
echo Press Ctrl+C in this window to stop the application
echo.

python -m streamlit run streamlit_app.py --server.port=8501 --server.address=0.0.0.0

pause
