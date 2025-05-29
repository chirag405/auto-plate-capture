import cv2
import os
import datetime
import json 
import numpy as np
import pytesseract
from ultralytics import YOLO
from collections import deque
import time # Not strictly used by detector but useful for performance timing if needed

# --- Tesseract Configuration ---
# IMPORTANT: Set the path to your Tesseract executable.
# This is often system-dependent. If Tesseract is in your PATH, this might not be needed.
# Examples:
# Windows: r'C:\Program Files\Tesseract-OCR\tesseract.exe'
# Linux: '/usr/bin/tesseract' (often found via `which tesseract`)
# macOS: '/usr/local/bin/tesseract' (if installed via Homebrew)
TESSERACT_CMD_PATH = r'C:\Program Files\Tesseract-OCR\tesseract.exe' # MODIFY AS NEEDED

try:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD_PATH
    # Attempt to get Tesseract version to check if the path is correct and Tesseract is working.
    tesseract_version = pytesseract.get_tesseract_version()
    print(f"Successfully configured Tesseract. Version: {tesseract_version}")
except pytesseract.TesseractNotFoundError:
    print(f"Error: Tesseract not found at path '{TESSERACT_CMD_PATH}'.")
    print("Please ensure Tesseract is installed and the TESSERACT_CMD_PATH variable is set correctly.")
    print("OCR functionality (text extraction from plates) will NOT work.")
except Exception as e:
    print(f"Warning: An unexpected error occurred while configuring Tesseract: {e}")
    print("OCR functionality may be affected.")

class LicensePlateDetector:
    """
    Handles license plate detection using a YOLO model and text extraction using Tesseract OCR.
    """
    def __init__(self, model_path='plate_detection_model.pt', confidence_threshold=0.5):
        """
        Initializes the license plate detector.
        Args:
            model_path (str): Path to the YOLO model file (e.g., .pt file).
            confidence_threshold (float): Minimum confidence for YOLO detections.
        """
        self.model = None
        try:
            self.model = YOLO(model_path)
            print(f"Successfully loaded YOLO model from '{model_path}'")
        except Exception as e:
            print(f"CRITICAL: Error loading YOLO model from '{model_path}': {e}")
            print("License plate detection will not function.")
            # self.model remains None, subsequent calls will check for this.
            
        # Stores dictionaries of {'timestamp', 'text', 'confidence', 'bbox'} for logging.
        self.detection_history = deque(maxlen=200) # Increased maxlen for longer history if needed
        self.confidence_threshold = confidence_threshold
        
    def extract_text_from_plate(self, plate_image_np):
        """
        Extracts text from a license plate image region using Tesseract OCR.
        Args:
            plate_image_np (numpy.ndarray): Image of the license plate.
        Returns:
            str or None: Extracted text (alphanumeric, uppercase) or None if OCR fails or text is too short.
        Requires:
            Tesseract OCR installed and configured.
        """
        try:
            # Preprocessing for better OCR results
            gray_plate = cv2.cvtColor(plate_image_np, cv2.COLOR_BGR2GRAY)
            gray_plate = cv2.resize(gray_plate, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC) # Upscale
            gray_plate = cv2.GaussianBlur(gray_plate, (5, 5), 0)
            # Replace Otsu's thresholding with adaptive thresholding
            gray_plate = cv2.adaptiveThreshold(gray_plate, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                             cv2.THRESH_BINARY, 11, 2)
            
            # Morphological opening to remove small noise
            kernel = np.ones((1,1), np.uint8)
            gray_plate = cv2.morphologyEx(gray_plate, cv2.MORPH_OPEN, kernel)
            
            # Tesseract OCR configuration for license plates
            # --psm 7: Treat the image as a single text line.
            config = '--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            original_text_from_tesseract = pytesseract.image_to_string(gray_plate, config=config)
            
            # Clean the extracted text
            cleaned_text = ''.join(char for char in original_text_from_tesseract if char.isalnum()).upper().strip()
            
            if len(cleaned_text) >= 2:
                return cleaned_text
            else:
                print(f"OCR: Text too short or invalid. Original: '{original_text_from_tesseract}', Cleaned: '{cleaned_text}', Length: {len(cleaned_text)}, Plate Dims: {plate_image_np.shape[:2]}")
                return None
            
        except pytesseract.TesseractError as te:
            print(f"OCR Error (Tesseract): {str(te)}. Plate Dims: {plate_image_np.shape[:2]}. Is Tesseract installed and configured correctly?")
            return None
        except Exception as e:
            print(f"OCR Error (Unexpected): {str(e)}. Plate Dims: {plate_image_np.shape[:2]}")
            return None
    
    def detect_plates_in_frame(self, frame_np):
        """
        Detects license plates in a single frame using the YOLO model.
        Args:
            frame_np (numpy.ndarray): The input frame (image) for detection.
        Returns:
            list: A list of detection dictionaries. Each dictionary contains:
                  'bbox' (list of ints): [x1, y1, x2, y2]
                  'confidence' (float): Detection confidence.
                  'text' (str or None): Extracted plate text.
                  'timestamp' (datetime.datetime): Timestamp of detection.
                  'cropped_plate' (numpy.ndarray): Image of the cropped plate region (for drawing/immediate use).
                  The `self.detection_history` stores a version of this without `cropped_plate`.
        """
        detections_for_current_frame = []
        if not self.model:
            print("YOLO model not loaded. Skipping detection.")
            return detections_for_current_frame # Return empty list
            
        try:
            # Perform YOLO detection
            yolo_results = self.model(frame_np, conf=self.confidence_threshold, verbose=False) # verbose=False to reduce console spam
            
            if len(yolo_results) > 0 and hasattr(yolo_results[0], 'boxes') and len(yolo_results[0].boxes) > 0:
                boxes = yolo_results[0].boxes
                
                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy.cpu().numpy()[0]) # Convert to int
                    confidence = round(float(box.conf.cpu().numpy()[0]), 4) # Standardize
                    
                    # Extract the plate region from the original frame
                    plate_region_np = frame_np[y1:y2, x1:x2]
                    
                    if plate_region_np.size > 0:
                        plate_text = self.extract_text_from_plate(plate_region_np)
                        
                        current_time = datetime.datetime.now()
                        
                        # For returning to the main loop (includes non-serializable cropped_plate)
                        detection_details = {
                            'bbox': [x1, y1, x2, y2],
                            'confidence': confidence,
                            'text': plate_text,
                            'timestamp': current_time,
                            'cropped_plate': plate_region_np 
                        }
                        detections_for_current_frame.append(detection_details)
                        
                        # For storing in history (JSON serializable version)
                        history_record = {
                            'timestamp': current_time, # datetime object, will be converted to ISO string in save_detection_log
                            'text': plate_text,
                            'confidence': confidence,
                            'bbox': [x1, y1, x2, y2]
                        }
                        self.detection_history.append(history_record)
        
        except Exception as e:
            print(f"Error during YOLO detection or processing: {str(e)}")
            # Optionally, re-raise or handle more gracefully depending on expected errors
        
        return detections_for_current_frame
    
    def draw_detections(self, frame_to_annotate, current_detections):
        """
        Draws bounding boxes and text labels for detected plates on a frame.
        Args:
            frame_to_annotate (numpy.ndarray): The frame on which to draw.
            current_detections (list): List of detection dictionaries from `detect_plates_in_frame`.
        Returns:
            numpy.ndarray: The frame with detections drawn.
        """
        output_frame = frame_to_annotate.copy() # Work on a copy
        try:
            for detection in current_detections:
                x1, y1, x2, y2 = detection['bbox']
                confidence = detection['confidence']
                text = detection['text']
            
                # Draw bounding box
                cv2.rectangle(output_frame, (x1, y1), (x2, y2), (0, 255, 0), 2) # Green box
            
                # Prepare label text
                label = f"{text if text else 'N/A'} ({confidence:.2f})"
            
                # Calculate text size and position for background rectangle
                (label_width, label_height), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
                label_bg_y1 = y1 - label_height - baseline - 5
                label_bg_y2 = y1 - baseline + 5
                
                # Ensure background is within frame bounds (simple check for top boundary)
                if label_bg_y1 < 0:
                    label_bg_y1 = y1 + baseline + 5 # Place below bbox if not enough space above
                    label_bg_y2 = y1 + label_height + baseline + 10

                cv2.rectangle(output_frame, (x1, label_bg_y1), (x1 + label_width, label_bg_y2), (0, 255, 0), -1)
                cv2.putText(output_frame, label, (x1, label_bg_y2 - baseline - 5), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2) # Black text
        
        except Exception as e:
            print(f"Error drawing detections: {str(e)}")
            return frame_to_annotate # Return original frame if drawing fails
            
        return output_frame
    
    def save_detection_log(self, filepath=None):
        """
        Saves the accumulated detection history to a JSON file.
        Each record includes timestamp, text, confidence, and bbox.
        Args:
            filepath (str, optional): Path to save the log file. 
                                      If None, a timestamped filename is generated.
        Returns:
            bool: True if successful, False otherwise.
        """
        if filepath is None:
            timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"detections_{timestamp_str}.json"
            # Save in the same directory as the script by default
            filepath = os.path.join(os.path.dirname(__file__), filename) 
            # Or a dedicated logs folder:
            # log_dir = os.path.join(os.path.dirname(__file__), "detection_logs")
            # os.makedirs(log_dir, exist_ok=True)
            # filepath = os.path.join(log_dir, filename)

        serializable_log = []
        for record in self.detection_history:
            serializable_log.append({
                'timestamp': record['timestamp'].isoformat(), # Convert datetime to ISO string
                'text': record['text'],
                'confidence': record['confidence'],
                'bbox': record['bbox'] 
            })
            
        try:
            with open(filepath, 'w') as f:
                json.dump(serializable_log, f, indent=2)
            print(f"Detection log saved successfully to '{filepath}'")
            return True
            
        except IOError as e: # More specific exception for file I/O
            print(f"Error saving detection log (IOError) to '{filepath}': {str(e)}")
            return False
        except Exception as e: # Catch-all for other potential errors
            print(f"Error saving detection log (Unexpected) to '{filepath}': {str(e)}")
            return False

def main():
    """
    Main function to run the OpenCV-based license plate detection.
    """
    cap = None # Initialize to None for finally block
    try:
        # --- Camera Initialization ---
        camera_index = 0 # Or path to video file e.g., "my_video.mp4"
        cap = cv2.VideoCapture(camera_index)
        if not cap.isOpened():
            print(f"Error: Could not open camera/video at index/path: {camera_index}")
            return # Exit if camera fails

        # --- Detector Initialization ---
        # Model should be in the same directory as this script or provide a full path.
        script_dir = os.path.dirname(__file__)
        model_filename = "plate_detection_model.pt"
        model_path = os.path.join(script_dir, model_filename)
        
        if not os.path.exists(model_path):
            print(f"CRITICAL: Model file '{model_filename}' not found in script directory ('{script_dir}').")
            print("Please ensure 'plate_detection_model.pt' is placed there or update 'model_path'.")
            return # Exit if model is not found
            
        detector = LicensePlateDetector(model_path=model_path, confidence_threshold=0.5)
        if not detector.model: 
            print("CRITICAL: Detector initialization failed (YOLO model not loaded). Exiting.")
            return # Exit if detector didn't load model

        print(f"Starting detection from camera/video: {camera_index}. Press 'q' to quit.")
        
        # --- Main Detection Loop ---
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Info: End of video stream or error reading frame.")
                break # Exit loop if no frame or error
            
            # Perform detection on the current frame
            current_detections = detector.detect_plates_in_frame(frame)
            
            # Draw detections on the frame
            annotated_frame = detector.draw_detections(frame, current_detections) # frame.copy() is done in draw_detections
            
            # Display the annotated frame
            cv2.imshow("License Plate Detection (OpenCV)", annotated_frame)
            
            # Handle user input for quitting
            key = cv2.waitKey(1) & 0xFF # Wait 1ms for a key press
            if key == ord('q'):
                print("User pressed 'q'. Quitting application...")
                break
    
    except KeyboardInterrupt:
        print("\nApplication interrupted by user (Ctrl+C).")
    except Exception as e:
        print(f"An unexpected error occurred in main: {e}")
    finally:
        # --- Resource Cleanup ---
        print("Releasing resources...")
        if cap:
            cap.release()
            print("Camera released.")
        cv2.destroyAllWindows()
        print("OpenCV windows destroyed.")
        
        # Save detection log if detector was initialized
        if 'detector' in locals() and detector is not None and detector.model is not None:
           print("Attempting to save detection log...")
           detector.save_detection_log() # Uses default timestamped filename
        else:
           print("Detector not initialized or model not loaded, skipping log saving.")

if __name__ == "__main__":
    main()
