from flask import Flask, request, jsonify
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
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    plate_text = None
    
    # Process every 5th frame to reduce computation
    while success:
        if frame_count % 5 == 0:
            # Save frame temporarily
            frame_path = os.path.join(temp_dir, f"frame_{frame_count}.jpg")
            cv2.imwrite(frame_path, image)
            
            # Detect license plate in frame
            results = model(frame_path)
            
            if len(results) > 0 and len(results[0].boxes) > 0:
                # Get the first detection
                box = results[0].boxes[0].xyxy.cpu().numpy()[0].astype(int)
                x1, y1, x2, y2 = box
                
                # Extract the license plate region
                plate_region = image[y1:y2, x1:x2]
                
                # Use OCR to extract text if we haven't found a plate yet
                if plate_text is None:
                    plate_text = pytesseract.image_to_string(plate_region, config='--psm 7')
                    plate_text = ''.join(c for c in plate_text if c.isalnum() or c.isspace()).strip()
                
                # Draw the bounding box on the image
                cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(image, plate_text or "Processing...", (x1, y1-10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12), 2)
            
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
    
    return output_path, plate_text

def get_base64_encoded_image(image_path):
    """Convert image to base64 for sending to frontend"""
    with open(image_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode('utf-8')

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
            result_path, plate_text = process_video_file(file_path)
            
            # For video, we don't return base64 as it would be too large
            # Instead, we serve the file from our server
            video_url = f"/api/results/{os.path.basename(result_path)}"
            
            return jsonify({
                'success': True,
                'data': video_url,
                'plate': plate_text or "No text detected"
            })
            
        except Exception as e:
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