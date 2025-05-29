
import cv2
import numpy as np
import pytesseract
from ultralytics import YOLO
import streamlit as st
import os
import json
import datetime
from collections import deque
import time

# Set the path to the Tesseract executable
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class LicensePlateDetector:
    def __init__(self, model_path='plate_detection_model.pt'):
        """Initialize the license plate detector with YOLO model"""
        self.model = YOLO(model_path)
        self.detection_history = deque(maxlen=100)  # Store last 100 detections
        self.unique_plates = {}  # Track unique plates with timestamps
        self.confidence_threshold = 0.5
        
    def preprocess_frame(self, frame):
        """Preprocess frame for better detection"""
        # Convert to RGB if needed
        if len(frame.shape) == 3 and frame.shape[2] == 3:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        else:
            frame_rgb = frame
            
        return frame_rgb
    
    def extract_text_from_plate(self, plate_region): # plate_region is plate_image_np
        """Extract text from license plate region using OCR"""
        try:
            # Preprocessing for better OCR results (mirroring opencv_detector.py)
            gray_plate = cv2.cvtColor(plate_region, cv2.COLOR_BGR2GRAY)
            gray_plate = cv2.resize(gray_plate, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

            block_size = 11 
            C_val = 2
            gray_plate = cv2.adaptiveThreshold(gray_plate, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                             cv2.THRESH_BINARY, block_size, C_val)
            
            opening_kernel = np.ones((2,2), np.uint8) 
            gray_plate = cv2.morphologyEx(gray_plate, cv2.MORPH_OPEN, opening_kernel)

            dilate_kernel = np.ones((2,2), np.uint8)
            gray_plate = cv2.dilate(gray_plate, dilate_kernel, iterations=1)
            
            psm_modes_to_try = ['7', '8', '6', '11']
            final_cleaned_text = None
            last_original_text = ""
            last_cleaned_attempt = ""

            for psm_mode in psm_modes_to_try:
                current_config = f'--psm {psm_mode} -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                try:
                    original_text_from_tesseract = pytesseract.image_to_string(gray_plate, config=current_config)
                    last_original_text = original_text_from_tesseract
                    
                    cleaned_text_attempt = ''.join(char for char in original_text_from_tesseract if char.isalnum()).upper().strip()
                    last_cleaned_attempt = cleaned_text_attempt

                    if len(cleaned_text_attempt) >= 2:
                        final_cleaned_text = cleaned_text_attempt
                        break 
                
                except pytesseract.TesseractError as te_loop:
                    print(f"OCR Error (Tesseract) with PSM {psm_mode}: {str(te_loop)}. Plate Dims: {plate_region.shape[:2]}")
                    last_original_text = f"TesseractError with PSM {psm_mode}: {str(te_loop)}"
                    last_cleaned_attempt = "" 
                    continue 
                except Exception as e_loop:
                    print(f"OCR Error (Unexpected) with PSM {psm_mode}: {str(e_loop)}. Plate Dims: {plate_region.shape[:2]}")
                    last_original_text = f"Exception with PSM {psm_mode}: {str(e_loop)}"
                    last_cleaned_attempt = ""
                    continue 
            
            if final_cleaned_text and len(final_cleaned_text) >= 2:
                return final_cleaned_text
            else:
                debug_image_filename = "NotSaved"
                try:
                    if gray_plate is not None:
                        debug_image_dir = "ocr_debug_images"
                        os.makedirs(debug_image_dir, exist_ok=True)
                        timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                        h, w = gray_plate.shape[:2]
                        debug_image_filename = os.path.join(debug_image_dir, f"debug_ocr_input_{timestamp_str}_{w}x{h}.png")
                        cv2.imwrite(debug_image_filename, gray_plate)
                        print(f"OCR DEBUG: Saved preprocessed plate image for Tesseract to {debug_image_filename}")
                    else:
                        print("OCR DEBUG: gray_plate not available for saving (it was None).")
                        debug_image_filename = "NotAvailable"
                except Exception as e_save:
                    print(f"OCR DEBUG: Error saving debug image: {e_save}")
                    debug_image_filename = f"SaveError_{e_save}"

                print(f"OCR: All PSM modes failed. Text too short or invalid. Last Original: '{last_original_text}', Last Cleaned: '{last_cleaned_attempt}', Length: {len(last_cleaned_attempt)}, Plate Dims (Original Crop): {plate_region.shape[:2]}, Saved Debug Input: {debug_image_filename}")
                return None
            
        except pytesseract.TesseractError as te: 
            print(f"OCR Error (Tesseract System Level): {str(te)}. Plate Dims: {plate_region.shape[:2]}. Is Tesseract installed and configured correctly?")
            st.error(f"OCR Error (Tesseract System Level): {str(te)}. Check Tesseract installation.")
            return None
        except Exception as e: 
            print(f"OCR Error (Unexpected Global): {str(e)}. Plate Dims: {plate_region.shape[:2]}")
            st.error(f"OCR Error (Unexpected): {str(e)}")
            return None
    
    def detect_plates_in_frame(self, frame): # frame is frame_np
        """Detect license plates in a single frame"""
        detections = []
        
        try:
            # Run YOLO detection
            results = self.model(frame, conf=self.confidence_threshold)
            
            if len(results) > 0 and len(results[0].boxes) > 0:
                boxes = results[0].boxes
                
                for box in boxes:
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy.cpu().numpy()[0].astype(int)
                    confidence = float(box.conf.cpu().numpy()[0])
                    
                    # Add padding to the bounding box (mirroring opencv_detector.py)
                    padding_pixels = 10
                    y1_pad = max(0, y1 - padding_pixels)
                    x1_pad = max(0, x1 - padding_pixels)
                    y2_pad = min(frame.shape[0], y2 + padding_pixels)
                    x2_pad = min(frame.shape[1], x2 + padding_pixels)
                    
                    # Extract plate region using padded coordinates
                    plate_region = frame[y1_pad:y2_pad, x1_pad:x2_pad]
                    
                    if plate_region.size > 0:
                        # Extract text from plate
                        plate_text = self.extract_text_from_plate(plate_region)
                        
                        detection = {
                            'bbox': (x1, y1, x2, y2),
                            'confidence': confidence,
                            'text': plate_text,
                            'timestamp': datetime.datetime.now(),
                            'cropped_plate': plate_region
                        }
                        
                        detections.append(detection)
                        
                        # Add to history
                        self.detection_history.append(detection)
                        
                        # Update unique plates tracking
                        if plate_text and len(plate_text) >= 3:
                            if plate_text not in self.unique_plates:
                                self.unique_plates[plate_text] = {
                                    'first_seen': datetime.datetime.now(),
                                    'last_seen': datetime.datetime.now(),
                                    'count': 1,
                                    'max_confidence': confidence
                                }
                            else:
                                self.unique_plates[plate_text]['last_seen'] = datetime.datetime.now()
                                self.unique_plates[plate_text]['count'] += 1
                                self.unique_plates[plate_text]['max_confidence'] = max(
                                    self.unique_plates[plate_text]['max_confidence'], 
                                    confidence
                                )
        
        except Exception as e:
            st.error(f"Detection Error: {str(e)}")
        
        return detections
    
    def draw_detections(self, frame, detections):
        """Draw bounding boxes and text on frame"""
        annotated_frame = frame.copy()
        try:
            for detection in detections:
                x1, y1, x2, y2 = detection['bbox']
            confidence = detection['confidence']
            text = detection['text']
            
            # Draw bounding box
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Prepare label
            if text:
                label = f"{text} ({confidence:.2f})"
            else:
                label = f"Plate ({confidence:.2f})"
            
            # Draw label background
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)[0]
            cv2.rectangle(annotated_frame, (x1, y1 - 30), (x1 + label_size[0], y1), (0, 255, 0), -1)
            
            # Draw label text
            cv2.putText(annotated_frame, label, (x1, y1 - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
        
        except Exception as e:
            st.error(f"Error drawing detections: {str(e)}")
            # Return the original frame if drawing fails
            return frame.copy() # Or return annotated_frame up to the point of error
            
        return annotated_frame
    
    def get_detection_stats(self):
        """Get detection statistics"""
        return {
            'total_detections': len(self.detection_history),
            'unique_plates': len(self.unique_plates),
            'recent_detections': list(self.detection_history)[-10:] if self.detection_history else [],
            'all_unique_plates': dict(self.unique_plates)
        }
    
    def save_detection_log(self, filepath='detections_log.json'):
        """Save detection history to file"""
        try:
            # Convert datetime objects to strings for JSON serialization
            log_data = {
                'detections': [],
                'unique_plates': {}
            }
            
            # Process detection history
            for detection in self.detection_history:
                log_detection = {
                    'bbox': detection['bbox'],
                    'confidence': detection['confidence'],
                    'text': detection['text'],
                    'timestamp': detection['timestamp'].isoformat()
                }
                log_data['detections'].append(log_detection)
            
            # Process unique plates
            for plate, data in self.unique_plates.items():
                log_data['unique_plates'][plate] = {
                    'first_seen': data['first_seen'].isoformat(),
                    'last_seen': data['last_seen'].isoformat(),
                    'count': data['count'],
                    'max_confidence': data['max_confidence']
                }
            
            with open(filepath, 'w') as f:
                json.dump(log_data, f, indent=2)
            
            return True
            
        except Exception as e:
            st.error(f"Error saving detection log: {str(e)}")
            return False
    
    def clear_history(self):
        """Clear detection history and unique plates"""
        self.detection_history.clear()
        self.unique_plates.clear()

def initialize_camera(camera_index=0):
    """Initialize camera with error handling"""
    try:
        cap = cv2.VideoCapture(camera_index)
        
        if not cap.isOpened():
            st.error(f"Cannot access camera {camera_index}")
            return None
        
        # Set camera properties for better performance
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        return cap
        
    except Exception as e:
        st.error(f"Camera initialization error: {str(e)}")
        return None

def release_camera(cap):
    """Safely release camera"""
    if cap is not None:
        cap.release()
        cv2.destroyAllWindows()

def format_detection_for_display(detection):
    """Format detection data for display in Streamlit"""
    timestamp = detection['timestamp'].strftime("%H:%M:%S")
    confidence = f"{detection['confidence']:.2f}"
    text = detection['text'] if detection['text'] else "No text"
    
    return {
        'Time': timestamp,
        'Plate Text': text,
        'Confidence': confidence
    }

def create_detection_summary(unique_plates):
    """Create a summary of detected plates for display"""
    summary = []
    
    for plate, data in unique_plates.items():
        summary.append({
            'Plate Number': plate,
            'First Seen': data['first_seen'].strftime("%H:%M:%S"),
            'Last Seen': data['last_seen'].strftime("%H:%M:%S"),
            'Detection Count': data['count'],
            'Max Confidence': f"{data['max_confidence']:.2f}"
        })
    
    return summary
