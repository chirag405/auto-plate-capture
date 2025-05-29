# Real-time License Plate Detection with Streamlit

This application provides real-time license plate detection using your camera, powered by YOLO and OpenCV, with a user-friendly Streamlit interface.

## Features

- 🎥 **Real-time Camera Feed**: Live video stream from your webcam
- 🎯 **License Plate Detection**: Automatic detection using YOLO model
- 📝 **OCR Text Extraction**: Extract text from detected license plates
- 📊 **Live Statistics**: Real-time detection statistics and history
- 💾 **Data Logging**: Save detection history and captured frames
- ⚙️ **Configurable Settings**: Adjust confidence threshold, frame skipping, and display size
- 📸 **Frame Capture**: Save annotated frames with detections

## Files

- `streamlit_app.py`: Main Streamlit application interface
- `streamlit_app_functions.py`: Core detection and processing functions
- `run_streamlit.py`: Python script to run the application
- `start_realtime_detection.bat`: Windows batch file for easy startup

## Installation

1. **Ensure your virtual environment is activated**:

   ```bash
   # Windows
   license_plate_env\Scripts\activate

   # Linux/Mac
   source license_plate_env/bin/activate
   ```

2. **Install additional required packages**:

   ```bash
   pip install streamlit pandas
   ```

3. **Verify your YOLO model is present**:
   - Ensure `plate_detection_model.pt` is in the backend folder

## Usage

### Option 1: Using the Batch File (Windows)

1. Double-click `start_realtime_detection.bat`
2. The application will start automatically

### Option 2: Using Python

1. Run the Python script:
   ```bash
   python run_streamlit.py
   ```

### Option 3: Direct Streamlit Command

1. Run Streamlit directly:
   ```bash
   streamlit run streamlit_app.py
   ```

## Application Interface

### Main Interface

- **Left Panel**: Live camera feed with detection visualization
- **Right Panel**: Detection statistics and recent detections table
- **Sidebar**: Configuration options and controls

### Configuration Options

- **Model Path**: Path to your YOLO model file
- **Camera Index**: Select which camera to use (0, 1, 2)
- **Confidence Threshold**: Minimum confidence for detections (0.1-1.0)
- **Frame Skip**: Skip frames for better performance (1-10)
- **Display Size**: Choose camera feed resolution

### Controls

- **🎥 Start Camera**: Begin real-time detection
- **⏹️ Stop Camera**: Stop the camera feed
- **📸 Capture Frame**: Save current annotated frame
- **💾 Save Detection Log**: Export detection history to JSON
- **🗑️ Clear History**: Reset all detection data

## Detection Features

### Real-time Processing

- Processes camera frames in real-time
- Draws bounding boxes around detected license plates
- Displays confidence scores and extracted text
- Tracks unique plates and detection frequency

### Data Tracking

- **Detection History**: Stores last 100 detections
- **Unique Plates**: Tracks all unique license plates found
- **Statistics**: Shows detection counts and confidence levels
- **Timestamps**: Records when each plate was first/last seen

### Performance Optimization

- **Frame Skipping**: Process every Nth frame to improve performance
- **Configurable Resolution**: Adjust display size for your hardware
- **Efficient Processing**: Optimized for real-time operation

## Output Files

### Captured Frames

- Saved as: `captured_frame_YYYYMMDD_HHMMSS.jpg`
- Includes bounding boxes and detection labels

### Detection Log

- Saved as: `detections_log.json`
- Contains complete detection history and statistics
- JSON format for easy data analysis

### Log File Structure

```json
{
  "detections": [
    {
      "bbox": [x1, y1, x2, y2],
      "confidence": 0.95,
      "text": "ABC123",
      "timestamp": "2025-05-29T10:30:45"
    }
  ],
  "unique_plates": {
    "ABC123": {
      "first_seen": "2025-05-29T10:30:45",
      "last_seen": "2025-05-29T10:31:15",
      "count": 5,
      "max_confidence": 0.95
    }
  }
}
```

## Troubleshooting

### Camera Issues

- **Camera not found**: Try different camera indices (0, 1, 2)
- **Poor video quality**: Check camera drivers and connections
- **Permission denied**: Ensure camera permissions are granted

### Detection Issues

- **No detections**: Adjust confidence threshold lower
- **False positives**: Increase confidence threshold
- **Poor OCR results**: Ensure good lighting and plate visibility

### Performance Issues

- **Slow processing**: Increase frame skip value
- **High CPU usage**: Reduce display resolution
- **Memory issues**: Clear detection history regularly

### Model Issues

- **Model not found**: Verify `plate_detection_model.pt` exists
- **Loading errors**: Check model file integrity
- **Poor accuracy**: Consider retraining or updating the model

## System Requirements

- **Python**: 3.8 or higher
- **Camera**: USB webcam or built-in camera
- **RAM**: 4GB minimum, 8GB recommended
- **CPU**: Multi-core processor recommended
- **Operating System**: Windows, Linux, or macOS

## Dependencies

- OpenCV (cv2)
- Streamlit
- Ultralytics YOLO
- PyTesseract
- NumPy
- Pandas
- PIL/Pillow

## Tips for Best Results

1. **Lighting**: Ensure good lighting conditions
2. **Camera Position**: Position camera to capture license plates clearly
3. **Distance**: Maintain appropriate distance from vehicles
4. **Stability**: Keep camera stable to reduce motion blur
5. **Settings**: Adjust confidence threshold based on your environment

## Browser Access

Once running, access the application at:

- **Local**: http://localhost:8501
- **Network**: http://[your-ip]:8501

The application will automatically open in your default browser.
