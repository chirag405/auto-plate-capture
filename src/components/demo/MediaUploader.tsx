import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image, Video, Loader } from "lucide-react";
import { processImage, processVideo } from "@/services/api";
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
  const fileInputRef = useRef(null);
  const { toast } = useToast();

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
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleProcessMedia = async () => {
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
        // Process video - show progress simulation
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const newProgress = prev + Math.random() * 5;
            return newProgress >= 100 ? 100 : newProgress;
          });
        }, 500);

        // Process video
        const result = await processVideo(selectedFile);

        clearInterval(progressInterval);
        setProgress(100);

        if (result.success && result.data) {
          // For videos, ensure we're using a timestamped URL to prevent caching issues
          const videoUrl = `${result.data}?t=${new Date().getTime()}`;
          setResultUrl(videoUrl);

          // Store the detected plates array
          if (result.plates && Array.isArray(result.plates)) {
            setPlates(result.plates);
          } else {
            setPlates([]);
          }

          // Store video name for download functionality
          if (result.videoName) {
            setVideoName(result.videoName);
          }

          toast({
            title: "Processing successful",
            description:
              result.plates && result.plates.length > 0
                ? `Detected ${result.plates.length} license plates in video.`
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
      toast({
        title: "Processing error",
        description: "An unexpected error occurred while processing the file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
        }}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span>Image</span>
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span>Video</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="pt-4">
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
      </Tabs>

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
            {mediaType === "image" ? (
              <img
                src={resultUrl}
                alt="Processed"
                className="mx-auto max-h-96 rounded"
              />
            ) : (
              <video
                key={resultUrl} /* Key to force re-render */
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

          {/* For image - show single plate */}
          {mediaType === "image" && plate && (
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
