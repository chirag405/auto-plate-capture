// Live Camera Service - api.js

// Common interfaces
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Function to handle API errors
const handleApiError = (error: any): ApiResponse<null> => {
  console.error("API Error:", error);
  return {
    success: false,
    error: error.message || "An unknown error occurred",
  };
};

const API_URL = "http://localhost:5000/api";

export const processImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_URL}/process-image`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error processing image:", error);
    return {
      success: false,
      error: "Network error while processing image",
    };
  }
};

export async function processVideo(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/process-video`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to process video",
      };
    }

    const data = await response.json();

    // Ensure the URL is absolute if it's a relative path
    if (data.success && data.data && data.data.startsWith("/api/")) {
      data.data = `${API_URL}${data.data.substring(4)}`;
    }

    return data;
  } catch (error) {
    console.error("Error processing video:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

export const processLiveFrame = async (imageData) => {
  try {
    // Send the base64 image data directly to the backend
    const response = await fetch(`${API_URL}/process-live-frame`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: imageData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to process camera frame",
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error processing live frame:", error);
    return {
      success: false,
      error: "Failed to process camera frame",
    };
  }
};

// Get detection history
export const getDetectionHistory = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetch(`${API_URL}/detections`);

    if (!response.ok) {
      // Try to parse error from backend, otherwise use a generic message
      let errorMsg = "Failed to fetch detection history";
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMsg = errorData.error;
        }
      } catch (e) {
        // Could not parse JSON error, stick with generic
        console.error("Could not parse error response:", e);
      }
      return {
        success: false,
        error: errorMsg,
      };
    }

    const data = await response.json(); // Backend returns { success: boolean, data?: any[], error?: string }
    
    // The backend response structure { success: boolean, data: any[], error?: string }
    // matches ApiResponse<any[]>, so we can return it directly.
    // If backend's `success` is false, its `error` field will be used.
    return data;

  } catch (error) {
    // Catches network errors or other issues with the fetch call itself
    return handleApiError(error);
  }
};
