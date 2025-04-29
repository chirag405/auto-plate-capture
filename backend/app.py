from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import cv2
import numpy as np
from PIL import Image
import io
import base64
from ultralytics import YOLO
import pytesseract

# Set the path to the Tesseract executable
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
import tempfile

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the YOLO model
model = YOLO('plate_detection_model.pt')

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
RESULT_FOLDER = 'results'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

def extract_license_plate(image_path):
    """Extract license plate text from detected regions using OCR"""
    # Run detection on the image
    results = model(image_path)
    
    if len(results) == 0 or len(results[0].boxes) == 0:
        return None, None
    
    # Get the original image
    img = cv2.imread(image_path)
    
    # Get the first detection (assuming it's the license plate)
    box = results[0].boxes[0].xyxy.cpu().numpy()[0].astype(int)
    x1, y1, x2, y2 = box
    
    # Extract the license plate region
    plate_region = img[y1:y2, x1:x2]
    
    # Use pytesseract to extract text
    plate_text = pytesseract.image_to_string(plate_region, config='--psm 7')
    plate_text = ''.join(c for c in plate_text if c.isalnum() or c.isspace()).strip()
    
    # Draw the bounding box on the image
    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
    cv2.putText(img, plate_text, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12), 2)
    
    # Save the result image
    result_path = os.path.join(RESULT_FOLDER, f"result_{os.path.basename(image_path)}")
    cv2.imwrite(result_path, img)
    
    return result_path, plate_text

def process_video_file(video_path):
    """Process video for license plate detection"""
    # Create temp directory for frames
    temp_dir = tempfile.mkdtemp()
    
    # Extract frames from video
    vidcap = cv2.VideoCapture(video_path)
    success, image = vidcap.read()
    frame_count = 0
    
    # Get video properties
    fps = vidcap.get(cv2.CAP_PROP_FPS)
    width = int(vidcap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(vidcap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Prepare output video
    output_path = os.path.join(RESULT_FOLDER, f"result_{os.path.basename(video_path)}")
    # Use H.264 codec which is more widely supported
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Track all detected plates
    plate_detections = []
    
    # Process every 3rd frame to reduce computation but catch more plates
    while success:
        if frame_count % 3 == 0:
            # Save frame temporarily
            frame_path = os.path.join(temp_dir, f"frame_{frame_count}.jpg")
            cv2.imwrite(frame_path, image)
            
            # Detect license plate in frame
            results = model(frame_path)
            
            # Process all detected plates in this frame (not just the first one)
            if len(results) > 0 and len(results[0].boxes) > 0:
                for i in range(min(len(results[0].boxes), 3)):  # Process up to 3 plates per frame
                    try:
                        # Get detection
                        box = results[0].boxes[i].xyxy.cpu().numpy()[0].astype(int)
                        x1, y1, x2, y2 = box
                        
                        # Ensure box coordinates are within image bounds
                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(width, x2), min(height, y2)
                        
                        if x2 > x1 and y2 > y1:  # Valid box
                            # Extract the license plate region
                            plate_region = image[y1:y2, x1:x2]
                            
                            # Use OCR to extract text
                            current_plate_text = pytesseract.image_to_string(plate_region, config='--psm 7')
                            current_plate_text = ''.join(c for c in current_plate_text if c.isalnum() or c.isspace()).strip()
                            
                            if current_plate_text and len(current_plate_text) >= 4:
                                # Record the frame number with the plate
                                plate_detections.append({
                                    'plate': current_plate_text,
                                    'frame': frame_count,
                                    'confidence': float(results[0].boxes[i].conf)
                                })
                            
                            # Draw the bounding box on the image
                            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                            if current_plate_text:
                                cv2.putText(image, current_plate_text, (x1, y1-10), 
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12), 2)
                    except Exception as e:
                        print(f"Error processing detection: {e}")
            
            # Remove temporary frame file
            os.remove(frame_path)
        
        # Write the frame to output video
        out.write(image)
        
        # Read next frame
        success, image = vidcap.read()
        frame_count += 1
    
    # Release resources
    vidcap.release()
    out.release()
    
    # Clean up temp directory
    os.rmdir(temp_dir)
    
    # Group detected plates
    from collections import Counter
    unique_plates = []
    
    if plate_detections:
        # Group similar plates and find unique ones
        grouped_plates = {}
        for detection in plate_detections:
            plate = detection['plate']
            # Check if this plate is similar to any existing group
            found_match = False
            for group_key in grouped_plates:
                # Simple similarity check - if 70% of characters match
                similarity = sum(c1 == c2 for c1, c2 in zip(plate, group_key)) / max(len(plate), len(group_key))
                if similarity > 0.7:
                    grouped_plates[group_key].append(detection)
                    found_match = True
                    break
            
            if not found_match:
                grouped_plates[plate] = [detection]
        
        # Extract top plates with frame ranges
        for plate, detections in grouped_plates.items():
            if len(detections) >= 2:  # Only include plates detected multiple times
                frames = [d['frame'] for d in detections]
                avg_confidence = sum(d['confidence'] for d in detections) / len(detections)
                unique_plates.append({
                    'plate': plate,
                    'count': len(detections),
                    'first_frame': min(frames),
                    'last_frame': max(frames),
                    'confidence': avg_confidence
                })
        
        # Sort by confidence and number of detections
        unique_plates.sort(key=lambda x: (x['count'], x['confidence']), reverse=True)
    
    return output_path, unique_plates

def get_base64_encoded_image(image_path):
    """Convert image to base64 for sending to frontend"""
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

def get_base64_encoded_video(video_path):
    """Convert video to base64 for sending to frontend"""
    with open(video_path, "rb") as video_file:
        return base64.b64encode(video_file.read()).decode('utf-8')

@app.route('/api/process-image', methods=['POST'])
def process_image():
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'}), 400
    
    if file:
        # Generate a unique filename
        filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        try:
            # Process the image
            result_path, plate_text = extract_license_plate(file_path)
            
            if result_path is None:
                return jsonify({
                    'success': False, 
                    'error': 'No license plate detected'
                }), 400
            
            # Convert result image to base64
            base64_image = get_base64_encoded_image(result_path)
            
            return jsonify({
                'success': True,
                'data': f"data:image/jpeg;base64,{base64_image}",
                'plate': plate_text or "No text detected"
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
        finally:
            # Clean up
            if os.path.exists(file_path):
                os.remove(file_path)

@app.route('/api/process-video', methods=['POST'])
def process_video():
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No selected file'}), 400
    
    if file:
        # Generate a unique filename
        filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        try:
            # Process the video
            result_path, plate_detections = process_video_file(file_path)
            
            # Always serve from server for better compatibility
            video_url = f"/api/results/{os.path.basename(result_path)}"
            
            return jsonify({
                'success': True,
                'data': video_url,
                'plates': plate_detections,
                'videoName': os.path.basename(result_path)
            })
            
        except Exception as e:
            print(f"Error processing video: {str(e)}")
            return jsonify({'success': False, 'error': str(e)}), 500
        finally:
            # Clean up
            if os.path.exists(file_path):
                os.remove(file_path)

@app.route('/api/results/<filename>')
def serve_result(filename):
    return send_from_directory(RESULT_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)