import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image, Video, Loader, Camera } from "lucide-react";
import { processImage, processVideo, processLiveFrame } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

export function MediaUploader() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaType, setMediaType] = useState("image");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [plate, setPlate] = useState(null);
  const [plates, setPlates] = useState([]);
  const [progress, setProgress] = useState(0);
  const [videoName, setVideoName] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameraMode, setCameraMode] = useState(false);
  // Add debug state to help troubleshoot camera issues
  const [cameraDebugInfo, setCameraDebugInfo] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const { toast } = useToast();

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Add a debug effect to log any changes to camera state
  useEffect(() => {
    if (videoRef.current) {
      console.log("Video element:", {
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight,
        paused: videoRef.current.paused,
        readyState: videoRef.current.readyState,
        error: videoRef.current.error,
      });
    }
  }, [isCameraActive]);

  // Force re-render after component mounts to ensure refs are properly set
  useEffect(() => {
    const timer = setTimeout(() => {
      setCameraDebugInfo("Component fully mounted, video ref initialized");
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (mediaType === "image" && !file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (mediaType === "video" && !file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setResultUrl(null);
    setPlate(null);
    setProgress(0);

    // Create a preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCameraMode(false);
  };

  const handleUploadClick = () => {
    if (mediaType === "livecam") {
      toggleCamera();
    } else {
      fileInputRef.current?.click();
    }
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      // Stop the camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      setCameraDebugInfo("Camera stopped");
      return;
    }

    // Reset error state when trying to start camera
    setCameraError(null);
    setCameraDebugInfo("Requesting camera access...");

    try {
      // First, check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      // List available devices to debug
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setCameraDebugInfo(`Found ${videoDevices.length} video devices`);

      // Request camera access with fallback options
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Use front camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setCameraDebugInfo("Camera access granted");
      streamRef.current = stream;

      // Ensure the video element exists before trying to use it
      if (!videoRef.current) {
        setCameraDebugInfo("Video element reference is null - will retry");

        // Small delay to allow the ref to be set
        setTimeout(() => {
          if (videoRef.current) {
            attachStreamToVideo(stream);
          } else {
            setCameraError("Video element not found after retry");
            stream.getTracks().forEach((track) => track.stop());
          }
        }, 500);
      } else {
        attachStreamToVideo(stream);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Could not access camera: " + err.message);
      setCameraDebugInfo("Camera access failed. See console for details.");

      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive",
      });

      // Clean up if error occurs
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  // Separate function to attach stream to video to improve readability
  const attachStreamToVideo = async (stream) => {
    try {
      // Set stream to video element
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;

      // Add event listeners to debug video element
      videoRef.current.onloadedmetadata = () => {
        setCameraDebugInfo("Video metadata loaded");
      };

      videoRef.current.oncanplay = () => {
        setCameraDebugInfo("Video can play");
        // Try to play automatically when ready
        handleManualVideoPlay();
      };

      videoRef.current.onerror = (e) => {
        setCameraDebugInfo(`Video error: ${e}`);
      };

      // Try to play the video
      setIsCameraActive(true);
      setCameraMode(true);
      setPreviewUrl(null);
      setSelectedFile(null);
      setResultUrl(null);
      setPlate(null);

      // Attempt to play, but don't fail if it doesn't work (user might need to click)
      handleManualVideoPlay();
    } catch (err) {
      setCameraError("Error setting up video: " + err.message);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref is null");
      return null;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Make sure video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("Video dimensions are zero. Stream may not be ready.");
      toast({
        title: "Capture Error",
        description: "Video stream not ready. Please try again.",
        variant: "destructive",
      });
      return null;
    }

    const context = canvas.getContext("2d");

    // Match canvas dimensions to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to the canvas (mirror the image back)
    context.save();
    context.scale(-1, 1);
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    context.restore();

    // Get the data URL from the canvas with better quality
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    console.log("Frame captured successfully, data length:", dataUrl.length);

    return dataUrl;
  };
  const handleProcessMedia = async () => {
    if (mediaType === "livecam") {
      if (!isCameraActive) {
        toast({
          title: "Camera not active",
          description: "Please enable the camera first.",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);

      try {
        // Capture current frame from video
        const frameData = captureFrame();
        if (!frameData) {
          throw new Error("Could not capture frame from camera");
        }

        // Convert data URL to Blob
        const blob = await fetch(frameData).then((res) => res.blob());
        if (!blob) {
          throw new Error("Failed to convert frame to Blob");
        }

        // Create a File object similar to regular image upload
        const file = new File([blob], "camera-capture.jpg", {
          type: "image/jpeg",
        });

        // Use the same image processing API
        const result = await processImage(file);

        if (result.success && result.data) {
          setResultUrl(result.data);
          setPlate(result.plate);
          toast({
            title: "Processing successful",
            description: "License plate detection completed.",
          });
        } else {
          toast({
            title: "Processing failed",
            description: result.error || "No license plate detected.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Camera processing error:", error);
        toast({
          title: "Processing error",
          description: "Failed to process camera frame. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      if (mediaType === "image") {
        // Process image
        const result = await processImage(selectedFile);

        if (result.success && result.data) {
          setResultUrl(result.data);
          setPlate(result.plate);
          toast({
            title: "Processing successful",
            description: "License plate detection completed.",
          });
        } else {
          toast({
            title: "Processing failed",
            description: result.error || "No license plate detected.",
            variant: "destructive",
          });
        }
      } else {
        // Process video with progress simulation
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const newProgress = prev + Math.random() * 5;
            return newProgress >= 100 ? 100 : newProgress;
          });
        }, 500);

        const result = await processVideo(selectedFile);

        clearInterval(progressInterval);
        setProgress(100);

        if (result.success && result.data) {
          const videoUrl = `${result.data}?t=${new Date().getTime()}`;
          setResultUrl(videoUrl);
          setPlates(result.plates || []);
          setVideoName(result.videoName || "processed-video.mp4");

          toast({
            title: "Processing successful",
            description: result.plates?.length
              ? `Detected ${result.plates.length} license plates.`
              : "Video processing completed. No plates found.",
          });
        } else {
          toast({
            title: "Processing failed",
            description: result.error || "No license plate detected in video.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing error",
        description: "An unexpected error occurred while processing the file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  // const handleProcessMedia = async () => {
  //   if (mediaType === "livecam") {
  //     if (!isCameraActive) {
  //       toast({
  //         title: "Camera not active",
  //         description: "Please enable the camera first.",
  //         variant: "destructive",
  //       });
  //       return;
  //     }

  //     setIsProcessing(true);

  //     try {
  //       // Capture current frame from video
  //       const frameData = captureFrame();
  //       if (!frameData) {
  //         throw new Error("Could not capture frame from camera");
  //       }

  //       // Process the captured frame
  //       const result = await processLiveFrame(frameData);

  //       if (result.success && result.data) {
  //         setResultUrl(result.data);
  //         setPlate(result.plate);
  //         toast({
  //           title: "Processing successful",
  //           description: "License plate detection completed.",
  //         });
  //       } else {
  //         toast({
  //           title: "Processing failed",
  //           description: result.error || "No license plate detected.",
  //           variant: "destructive",
  //         });
  //       }
  //     } catch (error) {
  //       toast({
  //         title: "Processing error",
  //         description: "An error occurred while processing the camera frame.",
  //         variant: "destructive",
  //       });
  //     } finally {
  //       setIsProcessing(false);
  //     }
  //     return;
  //   }

  //   if (!selectedFile) {
  //     toast({
  //       title: "No file selected",
  //       description: "Please select a file first.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setIsProcessing(true);
  //   setProgress(0);

  //   try {
  //     if (mediaType === "image") {
  //       // Process image
  //       const result = await processImage(selectedFile);

  //       if (result.success && result.data) {
  //         setResultUrl(result.data);
  //         setPlate(result.plate);
  //         toast({
  //           title: "Processing successful",
  //           description: "License plate detection completed.",
  //         });
  //       } else {
  //         toast({
  //           title: "Processing failed",
  //           description: result.error || "No license plate detected.",
  //           variant: "destructive",
  //         });
  //       }
  //     } else {
  //       // Process video - show progress simulation
  //       const progressInterval = setInterval(() => {
  //         setProgress((prev) => {
  //           const newProgress = prev + Math.random() * 5;
  //           return newProgress >= 100 ? 100 : newProgress;
  //         });
  //       }, 500);

  //       // Process video
  //       const result = await processVideo(selectedFile);

  //       clearInterval(progressInterval);
  //       setProgress(100);

  //       if (result.success && result.data) {
  //         // For videos, ensure we're using a timestamped URL to prevent caching issues
  //         const videoUrl = `${result.data}?t=${new Date().getTime()}`;
  //         setResultUrl(videoUrl);

  //         // Store the detected plates array
  //         if (result.plates && Array.isArray(result.plates)) {
  //           setPlates(result.plates);
  //         } else {
  //           setPlates([]);
  //         }

  //         // Store video name for download functionality
  //         if (result.videoName) {
  //           setVideoName(result.videoName);
  //         }

  //         toast({
  //           title: "Processing successful",
  //           description:
  //             result.plates && result.plates.length > 0
  //               ? `Detected ${result.plates.length} license plates in video.`
  //               : "Video processing completed. No plates found.",
  //         });
  //       } else {
  //         toast({
  //           title: "Processing failed",
  //           description: result.error || "No license plate detected in video.",
  //           variant: "destructive",
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "Processing error",
  //       description: "An unexpected error occurred while processing the file.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  // Function to manually start video playback
  const handleManualVideoPlay = async () => {
    if (videoRef.current && videoRef.current.paused) {
      try {
        await videoRef.current.play();
        setCameraDebugInfo("Video playback started");
      } catch (err) {
        setCameraDebugInfo(`Playback failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="w-full">
      <Tabs
        defaultValue="image"
        onValueChange={(v) => {
          setMediaType(v);
          setSelectedFile(null);
          setPreviewUrl(null);
          setResultUrl(null);
          setPlate(null);
          setPlates([]);
          setProgress(0);
          setVideoName(null);
          setCameraDebugInfo(null);

          // Stop camera if switching away from livecam tab
          if (v !== "livecam" && isCameraActive) {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }
            setIsCameraActive(false);
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span>Image</span>
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span>Video</span>
          </TabsTrigger>
          <TabsTrigger value="livecam" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span>Live Camera</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="pt-4">
          {/* Image content remains the same */}
          <Card className="p-6">
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={handleUploadClick}
              >
                {previewUrl && mediaType === "image" ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mx-auto max-h-64 rounded"
                    />
                    <div className="mt-2 text-sm text-gray-500">
                      Click to change image
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm font-medium">
                      Click to upload an image or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, JPEG up to 10MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <Button
                onClick={handleProcessMedia}
                disabled={!selectedFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Process Image"
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="pt-4">
          {/* Video content remains the same */}
          <Card className="p-6">
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={handleUploadClick}
              >
                {previewUrl && mediaType === "video" ? (
                  <div className="relative">
                    <video
                      src={previewUrl}
                      controls
                      className="mx-auto max-h-64 rounded"
                    />
                    <div className="mt-2 text-sm text-gray-500">
                      Click to change video
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm font-medium">
                      Click to upload a video or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      MP4, MOV, AVI up to 100MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*"
                  className="hidden"
                />
              </div>

              <Button
                onClick={handleProcessMedia}
                disabled={!selectedFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Process Video"
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="livecam" className="pt-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {/* Always render the video element but hide it when not active */}
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`mx-auto h-64 w-full rounded bg-black ${
                      !isCameraActive && "hidden"
                    }`}
                    style={{ transform: "scaleX(-1)" }}
                    onClick={handleManualVideoPlay}
                    onError={(e) => {
                      console.error("Video element error:", e);
                      setCameraError(
                        `Failed to load video stream: ${
                          (e.target as HTMLVideoElement).error?.message ||
                          "Unknown error"
                        }`
                      );
                    }}
                  />

                  {/* Canvas for capturing frames */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Overlay for when video is paused */}
                  {isCameraActive && videoRef.current?.paused && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white cursor-pointer"
                      onClick={handleManualVideoPlay}
                    >
                      <div className="text-center">
                        <p>Click to play video</p>
                        <p className="text-xs">
                          (Browser autoplay policy requires user interaction)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Show placeholder when camera is not active */}
                  {!isCameraActive && (
                    <div
                      className="py-8 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={handleUploadClick}
                    >
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm font-medium">
                        Click to activate camera
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {cameraError || "Live detection using your camera"}
                      </p>
                    </div>
                  )}

                  {/* Display debug information */}
                  {cameraDebugInfo && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      Debug: {cameraDebugInfo}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <Button
                    onClick={toggleCamera}
                    className="flex-1"
                    variant={isCameraActive ? "destructive" : "outline"}
                  >
                    {isCameraActive ? "Stop Camera" : "Start Camera"}
                  </Button>

                  <Button
                    onClick={handleProcessMedia}
                    disabled={!isCameraActive || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "Detect Plate"
                    )}
                  </Button>
                </div>

                {/* Add a check permissions button */}
                <Button
                  onClick={async () => {
                    try {
                      setCameraDebugInfo("Checking permissions...");
                      const permissions = await navigator.permissions.query({
                        name: "camera",
                      });
                      setCameraDebugInfo(
                        `Camera permission status: ${permissions.state}`
                      );

                      // If permission is granted but camera not active, suggest starting it
                      if (permissions.state === "granted" && !isCameraActive) {
                        toast({
                          title: "Camera permissions granted",
                          description:
                            "Click 'Start Camera' to activate the feed.",
                        });
                      }
                    } catch (err) {
                      setCameraDebugInfo(
                        `Permission check failed: ${err.message}`
                      );
                    }
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  Check Camera Permissions
                </Button>

                {/* Add a Force Reload Camera button for troubleshooting */}
                {isCameraActive && (
                  <Button
                    onClick={() => {
                      // Stop the existing stream
                      if (streamRef.current) {
                        streamRef.current
                          .getTracks()
                          .forEach((track) => track.stop());
                        streamRef.current = null;
                      }

                      // Reset video element
                      if (videoRef.current) {
                        videoRef.current.srcObject = null;
                      }

                      // Set state to inactive
                      setIsCameraActive(false);
                      setCameraDebugInfo(
                        "Camera reset, attempting to restart..."
                      );

                      // Restart after a short delay
                      setTimeout(() => {
                        toggleCamera();
                      }, 500);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Force Reload Camera
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rest of the component remains the same */}
      {isProcessing && mediaType === "video" && (
        <div className="mt-8 border rounded-lg p-6 bg-white">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-lg font-medium">Processing your video...</p>
            <p className="text-sm text-gray-500 mb-4">This may take a moment</p>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {Math.round(progress)}% complete
            </p>
          </div>
        </div>
      )}

      {resultUrl && !isProcessing && (
        <div className="mt-8 border rounded-lg p-6 bg-white">
          <h3 className="text-lg font-medium">Detection Result</h3>
          <div className="mt-4">
            {mediaType === "livecam" || mediaType === "image" ? (
              <img
                src={resultUrl}
                alt="Processed"
                className="mx-auto max-h-96 rounded"
              />
            ) : (
              <video
                key={resultUrl}
                src={resultUrl}
                controls
                controlsList="nodownload"
                className="mx-auto max-h-96 rounded w-full"
                onError={(e) => {
                  console.error("Video error:", e);
                  toast({
                    title: "Video playback error",
                    description:
                      "Could not play the processed video. Try downloading it instead.",
                    variant: "destructive",
                  });
                }}
              />
            )}
          </div>

          {/* For image or live camera - show single plate */}
          {(mediaType === "image" || mediaType === "livecam") && plate && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h4 className="font-medium">Detected License Plate:</h4>
              <div className="mt-2 p-3 bg-white border-2 border-blue-500 rounded-md inline-block">
                <span className="text-2xl font-mono font-bold tracking-wider">
                  {plate}
                </span>
              </div>
            </div>
          )}

          {/* For video - show multiple plates if available */}
          {mediaType === "video" && plates && plates.length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h4 className="font-medium">Detected License Plates:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {plates.slice(0, 5).map((plateData, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white border-2 border-blue-500 rounded-md"
                  >
                    <span className="text-xl font-mono font-bold tracking-wider block">
                      {plateData.plate}
                    </span>
                    <span className="text-sm text-gray-600 mt-1 block">
                      Confidence: {Math.round(plateData.confidence * 100)}% •
                      Detected {plateData.count} times
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mediaType === "video" && (!plates || plates.length === 0) && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h4 className="font-medium">
                No license plates detected in video
              </h4>
            </div>
          )}

          {/* Download button for video */}
          {mediaType === "video" && resultUrl && (
            <div className="mt-4">
              <Button
                onClick={() => {
                  // Extract filename from URL if it's a server path
                  const filename = resultUrl.startsWith("/api/")
                    ? resultUrl.split("/").pop()
                    : "processed-video.mp4";

                  const link = document.createElement("a");
                  link.href = resultUrl;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Download Video
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
