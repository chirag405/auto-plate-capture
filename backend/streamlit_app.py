
import streamlit as st
import cv2
import numpy as np
from streamlit_app_functions import (
    LicensePlateDetector, 
    initialize_camera, 
    release_camera,
    format_detection_for_display,
    create_detection_summary
)
import time
import pandas as pd
from PIL import Image
import threading
import queue
import datetime
import os

# Configure Streamlit page
st.set_page_config(
    page_title="Real-time License Plate Detection",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        text-align: center;
        color: #1f77b4;
        margin-bottom: 2rem;
    }
    .detection-stats {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 1rem 0;
    }
    .stButton button {
        width: 100%;
    }
    .camera-frame {
        border: 2px solid #1f77b4;
        border-radius: 10px;
        padding: 5px;
    }
</style>
""", unsafe_allow_html=True)

# Define a frame capture thread function
def capture_frames(camera, frame_queue, stop_event, frame_skip):
    """Thread function to continuously capture frames from camera"""
    frame_count = 0
    
    while not stop_event.is_set():
        ret, frame = camera.read()
        if ret:
            frame_count += 1
            
            # Skip frames for performance if specified
            if frame_count % frame_skip == 0:
                # Store only the most recent frame
                if not frame_queue.empty():
                    try:
                        frame_queue.get_nowait()  # Discard previous frame
                    except queue.Empty:
                        pass
                frame_queue.put((frame, frame_count))
            
            # Small sleep to reduce CPU usage
            time.sleep(0.01)
        else:
            # Camera error/disconnected
            break

def main():
    # Initialize session state
    if 'detector' not in st.session_state:
        st.session_state.detector = None
    if 'camera' not in st.session_state:
        st.session_state.camera = None
    if 'is_running' not in st.session_state:
        st.session_state.is_running = False
    if 'frame_queue' not in st.session_state:
        st.session_state.frame_queue = queue.Queue(maxsize=1)
    if 'stop_event' not in st.session_state:
        st.session_state.stop_event = threading.Event()
    if 'capture_thread' not in st.session_state:
        st.session_state.capture_thread = None
    if 'current_frame' not in st.session_state:
        st.session_state.current_frame = None
    if 'frame_count' not in st.session_state:
        st.session_state.frame_count = 0
    if 'last_captured_frame' not in st.session_state:
        st.session_state.last_captured_frame = None
    
    # Main header
    st.markdown('<h1 class="main-header">🚗 Real-time License Plate Detection</h1>', unsafe_allow_html=True)
    
    # Sidebar configuration
    st.sidebar.header("⚙️ Configuration")
    
    # Model selection
    model_path = st.sidebar.text_input("Model Path", value="plate_detection_model.pt")
    
    # Camera selection
    camera_index = st.sidebar.selectbox("Camera Index", options=[0, 1, 2], index=0)
    
    # Detection settings
    st.sidebar.subheader("Detection Settings")
    confidence_threshold = st.sidebar.slider("Confidence Threshold", 0.1, 1.0, 0.5, 0.1)
    
    # Performance settings
    st.sidebar.subheader("Performance Settings")
    frame_skip = st.sidebar.slider("Frame Skip (for performance)", 1, 10, 3)
    display_size = st.sidebar.selectbox("Display Size", ["Small (320x240)", "Medium (640x480)", "Large (800x600)"], index=1)
    
    # Initialize detector
    if st.sidebar.button("🔧 Initialize System"):
        try:
            with st.spinner("Initializing license plate detector..."):
                st.session_state.detector = LicensePlateDetector(model_path)
                st.session_state.detector.confidence_threshold = confidence_threshold
            st.sidebar.success("✅ Detector initialized successfully!")
        except Exception as e:
            st.sidebar.error(f"❌ Error initializing detector: {str(e)}")
    
    # Main content area
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("📹 Live Camera Feed")
        
        # Camera controls
        col_start, col_stop, col_capture = st.columns(3)
        
        with col_start:
            start_camera = st.button("🎥 Start Camera", disabled=st.session_state.is_running)
        
        with col_stop:
            stop_camera = st.button("⏹️ Stop Camera", disabled=not st.session_state.is_running)
        
        with col_capture:
            capture_frame = st.button("📸 Capture Frame")
        
        # Camera feed placeholder
        camera_placeholder = st.empty()
        
        # Status indicator
        status_placeholder = st.empty()
    
    with col2:
        st.subheader("📊 Detection Results")
        
        # Detection statistics
        stats_placeholder = st.empty()
        
        # Recent detections table
        st.subheader("🕒 Recent Detections")
        recent_placeholder = st.empty()
        
        # Control buttons
        if st.button("💾 Save Detection Log"):
            if st.session_state.detector:
                if st.session_state.detector.save_detection_log():
                    st.success("✅ Detection log saved!")
                else:
                    st.error("❌ Failed to save detection log")
        
        if st.button("🗑️ Clear History"):
            if st.session_state.detector:
                st.session_state.detector.clear_history()
                st.success("✅ Detection history cleared!")
      # Handle camera start
    if start_camera:
        if st.session_state.detector is None:
            st.error("❌ Please initialize the detector first!")
        else:
            try:
                # Stop any existing camera thread
                if st.session_state.is_running:
                    st.session_state.stop_event.set()
                    if st.session_state.capture_thread and st.session_state.capture_thread.is_alive():
                        st.session_state.capture_thread.join(timeout=1.0)
                    if st.session_state.camera:
                        release_camera(st.session_state.camera)
                
                # Initialize new camera
                st.session_state.camera = initialize_camera(camera_index)
                
                if st.session_state.camera is not None:
                    # Clear the queue
                    while not st.session_state.frame_queue.empty():
                        st.session_state.frame_queue.get()
                    
                    # Reset stop event
                    st.session_state.stop_event = threading.Event()
                    
                    # Start frame capture thread
                    st.session_state.capture_thread = threading.Thread(
                        target=capture_frames,
                        args=(st.session_state.camera, 
                              st.session_state.frame_queue,
                              st.session_state.stop_event,
                              frame_skip)
                    )
                    st.session_state.capture_thread.daemon = True
                    st.session_state.capture_thread.start()
                    
                    st.session_state.is_running = True
                    st.session_state.frame_count = 0
                    st.sidebar.success("✅ Camera started successfully!")
                else:
                    st.error("❌ Failed to start camera")
            except Exception as e:
                st.error(f"❌ Error starting camera: {str(e)}")
    
    # Handle camera stop
    if stop_camera:
        if st.session_state.is_running:
            st.session_state.stop_event.set()
            if st.session_state.capture_thread and st.session_state.capture_thread.is_alive():
                st.session_state.capture_thread.join(timeout=1.0)
            if st.session_state.camera:
                release_camera(st.session_state.camera)
                st.session_state.camera = None
            st.session_state.is_running = False
            st.sidebar.success("✅ Camera stopped")
            
    # Handle frame capture
    if capture_frame and st.session_state.current_frame is not None:
        try:
            # Save current frame
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"captured_frame_{timestamp}.jpg"
            cv2.imwrite(filename, st.session_state.last_captured_frame)
            st.success(f"✅ Frame saved as {filename}")
        except Exception as e:
            st.error(f"❌ Error saving frame: {str(e)}")
    
    # Main camera loop
    if st.session_state.is_running and st.session_state.camera is not None and st.session_state.detector is not None:
        
        # Update detector settings
        st.session_state.detector.confidence_threshold = confidence_threshold
        
        try:
            # Read frame from camera
            ret, frame = st.session_state.camera.read()
            
            if ret:
                st.session_state.frame_count += 1
                
                # Process frame (skip frames for performance)
                if st.session_state.frame_count % frame_skip == 0:
                    # Detect license plates
                    detections = st.session_state.detector.detect_plates_in_frame(frame)
                    
                    # Draw detections on frame
                    annotated_frame = st.session_state.detector.draw_detections(frame, detections)
                else:
                    annotated_frame = frame
                
                # Resize frame for display
                if display_size == "Small (320x240)":
                    display_frame = cv2.resize(annotated_frame, (320, 240))
                elif display_size == "Medium (640x480)":
                    display_frame = cv2.resize(annotated_frame, (640, 480))
                else:  # Large
                    display_frame = cv2.resize(annotated_frame, (800, 600))
                
                # Convert BGR to RGB for Streamlit
                display_frame_rgb = cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)
                
                # Display frame
                with camera_placeholder.container():
                    st.image(display_frame_rgb, channels="RGB", use_column_width=True)
                
                # Update status
                with status_placeholder.container():
                    col_status1, col_status2, col_status3 = st.columns(3)
                    with col_status1:
                        st.metric("Frame Count", st.session_state.frame_count)
                    with col_status2:
                        current_detections = len(st.session_state.detector.detection_history)
                        st.metric("Total Detections", current_detections)
                    with col_status3:
                        unique_count = len(st.session_state.detector.unique_plates)
                        st.metric("Unique Plates", unique_count)
                
                # Update detection statistics
                stats = st.session_state.detector.get_detection_stats()
                
                with stats_placeholder.container():
                    st.markdown('<div class="detection-stats">', unsafe_allow_html=True)
                    
                    if stats['unique_plates'] > 0:
                        st.write("**🎯 Detected License Plates:**")
                        summary_data = create_detection_summary(stats['all_unique_plates'])
                        if summary_data:
                            df = pd.DataFrame(summary_data)
                            st.dataframe(df, use_container_width=True)
                    else:
                        st.write("**No license plates detected yet**")
                    
                    st.markdown('</div>', unsafe_allow_html=True)
                
                # Update recent detections
                with recent_placeholder.container():
                    if stats['recent_detections']:
                        recent_data = [format_detection_for_display(det) for det in stats['recent_detections']]
                        df_recent = pd.DataFrame(recent_data)
                        st.dataframe(df_recent, use_container_width=True)
                    else:
                        st.write("No recent detections")
                
                # Handle frame capture
                if capture_frame:
                    # Save current frame
                    timestamp = time.strftime("%Y%m%d_%H%M%S")
                    filename = f"captured_frame_{timestamp}.jpg"
                    cv2.imwrite(filename, annotated_frame)
                    st.success(f"✅ Frame saved as {filename}")
            
            else:
                st.error("❌ Failed to read frame from camera")
                st.session_state.is_running = False
        
        except Exception as e:
            st.error(f"❌ Error in camera loop: {str(e)}")
            st.session_state.is_running = False
    
    # Display instructions when not running
    if not st.session_state.is_running:
        with camera_placeholder.container():
            st.info("""
            📋 **Instructions:**
            1. Initialize the detector using the sidebar
            2. Select your camera and adjust settings
            3. Click 'Start Camera' to begin real-time detection
            4. License plates will be automatically detected and displayed with bounding boxes
            5. Detection results will appear in the sidebar
            6. Use 'Capture Frame' to save current frame
            7. Use 'Save Detection Log' to export detection history
            """)
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: #666;'>
        🚗 Real-time License Plate Detection System | Powered by YOLO and OpenCV
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
