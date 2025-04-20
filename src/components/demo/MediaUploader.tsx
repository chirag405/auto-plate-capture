import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image, Video, Loader } from "lucide-react";
import { processImage } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

export function MediaUploader() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaType, setMediaType] = useState("image");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [plate, setPlate] = useState(null);
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

    if (mediaType === "image") {
      try {
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
            description: result.error || "An unknown error occurred.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Processing error",
          description:
            "An unexpected error occurred while processing the file.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      // For video, we'll simulate processing and load the pre-existing output
      // No plate information for videos
      setTimeout(() => {
        setResultUrl("/output.mp4");
        setPlate(null); // No plate for videos
        setIsProcessing(false);
        toast({
          title: "Processing successful",
          description: "Video processing completed.",
        });
      }, 2000); // Simulate 2 seconds of processing time
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
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="mt-4 text-lg font-medium">Processing your video...</p>
            <p className="text-sm text-gray-500">This may take a moment</p>
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
                src={resultUrl}
                controls
                className="mx-auto max-h-96 rounded"
              />
            )}
          </div>

          {/* Only show plate for images, not for videos */}
          {plate && mediaType === "image" && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h4 className="font-medium">Detected License Plate:</h4>
              <div className="mt-2 p-3 bg-white border-2 border-blue-500 rounded-md inline-block">
                <span className="text-2xl font-mono font-bold tracking-wider">
                  {plate}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
