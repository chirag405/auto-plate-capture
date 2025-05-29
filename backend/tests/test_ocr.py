import cv2
import os
import sys
import numpy as np # Added for np.ones in LicensePlateDetector if not already there

# Add backend directory to sys.path to allow direct import of opencv_detector
# This assumes the test is run from the root directory or backend/tests directory.
# If run from backend/tests, '..' goes to backend/.
# If run from root, this path needs adjustment or PYTHONPATH needs to be set.
# For a script in backend/tests/ run with `python backend/tests/test_ocr.py` from root,
# or `python test_ocr.py` from `backend/tests/`
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# We want to ensure 'backend' is in sys.path so 'from opencv_detector' works,
# assuming 'opencv_detector.py' is directly in 'backend'.
# If SCRIPT_DIR is backend/tests, then os.path.join(SCRIPT_DIR, '..') is backend/
sys.path.append(os.path.join(SCRIPT_DIR, '..'))

try:
    from opencv_detector import LicensePlateDetector
except ImportError:
    print("Failed to import LicensePlateDetector. Ensure backend directory is in sys.path.")
    print("If running from root, try adding 'backend' to PYTHONPATH or adjust sys.path logic.")
    sys.exit(1)

# --- USER ACTION REQUIRED FOR OCR TESTING ---
#
# How to get a test image:
# 1. Run the main license plate detection application (either `python backend/opencv_detector.py` 
#    or the Streamlit app via `streamlit run backend/streamlit_app.py`).
# 2. If you encounter an image where OCR fails (especially if the plate seems clear but no text is read,
#    or incorrect text is read after all PSM attempts), the system is designed to automatically 
#    save a debug image of the preprocessed plate that was fed to Tesseract.
# 3. Look in the 'ocr_debug_images/' directory. This directory will be created in the location 
#    where your detection script (e.g., `opencv_detector.py` or `streamlit_app.py`) was run.
#    Inside, you should find images named like 'debug_ocr_input_YYYYMMDD_HHMMSS_WxH.png'.
#
# For this test script:
# 1. Update 'PATH_TO_TEST_IMAGE' below with the full path to one of these saved 
#    *preprocessed* debug images from the 'ocr_debug_images/' folder. 
#    For example, if 'ocr_debug_images' is in your project root, the path might be
#    "ocr_debug_images/debug_ocr_input_20231027_123456_100x50.png".
#    Alternatively, you can copy a debug image into the `backend/tests/` directory or a 
#    subdirectory like `backend/tests/test_images/` and use a relative path.
# 2. Update 'EXPECTED_PLATE_TEXT' with the correct, actual license plate text for that image. 
#    You'll need to determine this manually by looking at the original unprocessed image or video frame.
# ---
PATH_TO_TEST_IMAGE = "ocr_debug_images/PATH_TO_YOUR_DEBUG_IMAGE.PNG"  # Example: "ocr_debug_images/debug_ocr_input_YYYYMMDD_HHMMSS_WxH.png" or "backend/tests/test_images/my_test_plate.png"
EXPECTED_PLATE_TEXT = "EXPECTED_PLATE_TEXT" # e.g., "AB123CD"

# Define a default dummy model path relative to the backend directory
# This is used if the default model_path in LicensePlateDetector constructor is used
# and the actual model isn't present/needed for this OCR test.
DEFAULT_MODEL_FILENAME = "plate_detection_model.pt" # As used in opencv_detector.py
DUMMY_MODEL_PATH_IN_BACKEND = os.path.join(SCRIPT_DIR, '..', DEFAULT_MODEL_FILENAME)
# Path for the detector constructor if we want to ensure it uses a specific dummy file
DUMMY_MODEL_FOR_TEST = os.path.join(SCRIPT_DIR, '..', "dummy_ocr_test_model.pt")


def run_ocr_test():
    print("Starting OCR Test...")

    if "PATH_TO_YOUR_DEBUG_IMAGE.PNG" in PATH_TO_TEST_IMAGE or PATH_TO_TEST_IMAGE == "PATH_TO_YOUR_PROBLEM_IMAGE.PNG": # Catches old and new placeholder
        print(f"TEST SKIPPED: Test image path is not set or is still the placeholder.")
        print(f"Please update PATH_TO_TEST_IMAGE in {__file__} to a valid debug image path.")
        return

    if not os.path.exists(PATH_TO_TEST_IMAGE):
        print(f"TEST SKIPPED: Test image not found at '{PATH_TO_TEST_IMAGE}'.")
        print(f"Current working directory: {os.getcwd()}")
        print(f"Please update PATH_TO_TEST_IMAGE in {__file__} or ensure the image exists.")
        return

    if EXPECTED_PLATE_TEXT == "EXPECTED_PLATE_TEXT":
        print(f"TEST SKIPPED: Expected plate text is not set.")
        print(f"Please update EXPECTED_PLATE_TEXT in {__file__}")
        return

    # Determine model path for detector initialization
    # If the default model exists, the constructor might use it.
    # For an OCR-only test, we prefer to avoid loading a real YOLO model.
    # We pass a specific dummy model path to the constructor.
    # The constructor in opencv_detector.py has a default model_path.
    # We'll use DUMMY_MODEL_FOR_TEST.
    
    detector_model_path = DUMMY_MODEL_FOR_TEST
    created_dummy_for_this_test = False

    # Check if the LicensePlateDetector expects a model file at its default path
    # and if that default path points to a non-existent file.
    # The constructor is `__init__(self, model_path='plate_detection_model.pt', ...)`
    # So, if DUMMY_MODEL_FOR_TEST does not exist, we create it.
    if not os.path.exists(detector_model_path):
        try:
            with open(detector_model_path, 'w') as f:
                f.write("This is a dummy model file for OCR testing.")
            print(f"Created dummy model file for detector at {detector_model_path}")
            created_dummy_for_this_test = True
        except IOError as e:
            print(f"WARNING: Could not create dummy model file at {detector_model_path}: {e}")
            print("Proceeding, but LicensePlateDetector instantiation might fail if it strictly requires a valid model file.")

    try:
        # Instantiate detector. Pass the dummy model path.
        detector = LicensePlateDetector(model_path=detector_model_path)
    except Exception as e:
        print(f"TEST FAILED: Could not instantiate LicensePlateDetector: {e}")
        print("This might be due to the model loading. Ensure dummy model handling is correct or detector can be instantiated without a real model.")
        # Clean up dummy model if we created it for this specific test path
        if created_dummy_for_this_test and os.path.exists(detector_model_path):
            try:
                os.remove(detector_model_path)
                print(f"Removed dummy model file: {detector_model_path}")
            except OSError: pass # Ignore errors on cleanup
        return


    # Load the specific problematic cropped plate image
    plate_image_np = cv2.imread(PATH_TO_TEST_IMAGE)

    if plate_image_np is None:
        print(f"TEST FAILED: Could not load image from '{PATH_TO_TEST_IMAGE}'. Check path and OpenCV installation.")
        if created_dummy_for_this_test and os.path.exists(detector_model_path):
             os.remove(detector_model_path) # cleanup
        return

    print(f"Test image loaded: {PATH_TO_TEST_IMAGE}, Dims: {plate_image_np.shape[:2]}")

    # Call extract_text_from_plate
    print("Calling extract_text_from_plate...")
    extracted_text = detector.extract_text_from_plate(plate_image_np)
    print(f"Raw extracted text: '{extracted_text}'") # This will be None if filtering occurred

    # The assertion
    if extracted_text == EXPECTED_PLATE_TEXT:
        print(f"OCR Test Passed! Expected: '{EXPECTED_PLATE_TEXT}', Got: '{extracted_text}'")
    else:
        error_message = f"OCR Test Failed: Expected '{EXPECTED_PLATE_TEXT}', but got '{extracted_text}'"
        print(error_message)
        # Using a direct assert statement for script-based testing
        # For pytest, this would automatically be caught.
        # For a simple script, we'll raise AssertionError to signal failure clearly.
        raise AssertionError(error_message)

    # Clean up the dummy model created specifically for this test run
    if created_dummy_for_this_test and os.path.exists(detector_model_path):
        try:
            os.remove(detector_model_path)
            print(f"Removed dummy model file: {detector_model_path}")
        except OSError as e:
            print(f"Error removing dummy model file {detector_model_path}: {e}")


if __name__ == "__main__":
    # Note on running this test:
    # 1. From project root: `python backend/tests/test_ocr.py`
    #    (sys.path manipulation should handle imports)
    # 2. From backend/tests/ directory: `python test_ocr.py`
    #    (sys.path manipulation should also work)
    # Ensure PATH_TO_TEST_IMAGE and EXPECTED_PLATE_TEXT are set by the user.

    # No need to manage the default dummy model (DUMMY_MODEL_PATH_IN_BACKEND) here,
    # as we are passing a specific DUMMY_MODEL_FOR_TEST to the constructor.
    # The constructor will try to load what's given.
    
    try:
        run_ocr_test()
    except AssertionError:
        print("Test assertion failed. See message above.")
        sys.exit(1) # Exit with error code for CI/automation
    except Exception as e:
        print(f"An unexpected error occurred during the test: {e}")
        sys.exit(1)
    
    print("Test script finished.")

```
