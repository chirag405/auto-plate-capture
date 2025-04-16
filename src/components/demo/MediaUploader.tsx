
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Image, Video, AlertCircle } from 'lucide-react';
import { processImage, processVideo } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

export function MediaUploader() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [plate, setPlate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (mediaType === 'image' && !file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file.",
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = mediaType === 'image' 
        ? await processImage(selectedFile)
        : await processVideo(selectedFile);

      if (result.success && result.data) {
        setResultUrl(result.data);
        // Simulate detecting a license plate (this would come from the API in a real app)
        setPlate(generateRandomPlate());
        toast({
          title: "Processing successful",
          description: "License plate detection completed.",
        });
      } else {
        toast({
          title: "Processing failed",
          description: result.error || "An unknown error occurred.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Processing error",
        description: "An unexpected error occurred while processing the file.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateRandomPlate = () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let plate = '';
    // Generate 3 random letters
    for (let i = 0; i < 3; i++) {
      plate += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // Add a space
    plate += ' ';
    // Generate 3 random numbers
    for (let i = 0; i < 3; i++) {
      plate += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return plate;
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="image" onValueChange={(v) => setMediaType(v as 'image' | 'video')}>
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
                {previewUrl ? (
                  <div className="relative">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="mx-auto max-h-[300px] rounded" 
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
                {isProcessing ? 'Processing...' : 'Process Image'}
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
                {previewUrl ? (
                  <div className="relative">
                    <video 
                      src={previewUrl} 
                      controls
                      className="mx-auto max-h-[300px] rounded" 
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
                {isProcessing ? 'Processing...' : 'Process Video'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {resultUrl && (
        <div className="mt-8 border rounded-lg p-6 bg-white">
          <h3 className="text-lg font-medium">Detection Result</h3>
          <div className="mt-4">
            {mediaType === 'image' ? (
              <img src={resultUrl} alt="Processed" className="mx-auto max-h-[400px] rounded" />
            ) : (
              <video 
                src={resultUrl} 
                controls
                className="mx-auto max-h-[400px] rounded" 
              />
            )}
          </div>
          
          {plate && (
            <div className="mt-4 p-4 bg-brand-lightGray rounded-lg">
              <h4 className="font-medium">Detected License Plate:</h4>
              <div className="mt-2 p-3 bg-white border-2 border-brand-blue rounded-md inline-block">
                <span className="text-2xl font-mono font-bold tracking-wider">{plate}</span>
              </div>
              <div className="mt-2 text-sm text-gray-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Note: This is simulated data. Real detection would be performed by the Flask API.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
