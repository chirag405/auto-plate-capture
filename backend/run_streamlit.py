
import subprocess
import sys
import os

def run_streamlit_app():
    """Run the Streamlit application"""
    try:
        # Change to the backend directory
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        # Run Streamlit
        cmd = [sys.executable, "-m", "streamlit", "run", "streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
        
        print("Starting Streamlit License Plate Detection App...")
        print("Open your browser and go to: http://localhost:8501")
        print("Press Ctrl+C to stop the application")
        
        subprocess.run(cmd)
        
    except KeyboardInterrupt:
        print("\nStopping Streamlit app...")
    except Exception as e:
        print(f"Error running Streamlit app: {str(e)}")

if __name__ == "__main__":
    run_streamlit_app()
