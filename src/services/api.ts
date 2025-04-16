// This file will handle the communication with the Flask backend API

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

export const processVideo = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_URL}/process-video`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error processing video:", error);
    return {
      success: false,
      error: "Network error while processing video",
    };
  }
};
// Get detection history
export const getDetectionHistory = async (): Promise<ApiResponse<any[]>> => {
  try {
    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock response
    return {
      success: true,
      data: [
        {
          id: 1,
          timestamp: "2025-04-15T14:30:00Z",
          type: "image",
          licensePlate: "ABC123",
          confidence: 0.95,
          thumbnailUrl:
            "https://plus.unsplash.com/premium_photo-1676449104832-e4135da358f5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        },
        {
          id: 2,
          timestamp: "2025-04-15T10:15:00Z",
          type: "video",
          licensePlate: "XYZ789",
          confidence: 0.87,
          thumbnailUrl:
            "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        },
        {
          id: 3,
          timestamp: "2025-04-14T16:45:00Z",
          type: "image",
          licensePlate: "DEF456",
          confidence: 0.92,
          thumbnailUrl:
            "https://images.unsplash.com/photo-1669211679257-c8a5e98a57e2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        },
      ],
    };

    /*
    // Real implementation would be something like:
    const response = await fetch(`${API_BASE_URL}/api/detection-history`);
    const data = await response.json();
    return {
      success: response.ok,
      data: data.history,
      error: !response.ok ? data.error : undefined,
    };
    */
  } catch (error) {
    return handleApiError(error);
  }
};
