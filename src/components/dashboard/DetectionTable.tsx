
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDetectionHistory } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Image, Video, Calendar, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Detection {
  id: number;
  timestamp: string;
  type: 'image' | 'video';
  licensePlate: string;
  confidence: number;
  thumbnailUrl: string;
}

export function DetectionTable() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDetections = async () => {
      try {
        const result = await getDetectionHistory();
        if (result.success && result.data) {
          setDetections(result.data);
        } else {
          toast({
            title: "Failed to fetch detection history",
            description: result.error || "An unknown error occurred.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred while fetching detection history.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetections();
  }, [toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Detections</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-sm text-gray-500">Loading detection history...</p>
          </div>
        ) : detections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No detections found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thumbnail</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detections.map((detection) => (
                <TableRow key={detection.id}>
                  <TableCell>
                    <img 
                      src={detection.thumbnailUrl} 
                      alt="Thumbnail" 
                      className="h-12 w-20 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell>
                    {detection.type === 'image' ? (
                      <div className="flex items-center">
                        <Image className="h-4 w-4 mr-1" />
                        <span>Image</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Video className="h-4 w-4 mr-1" />
                        <span>Video</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {detection.licensePlate}
                  </TableCell>
                  <TableCell className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                    {formatDate(detection.timestamp)}
                  </TableCell>
                  <TableCell className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-500" />
                    {formatTime(detection.timestamp)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-brand-accent h-2.5 rounded-full" 
                          style={{ width: `${detection.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm">{Math.round(detection.confidence * 100)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
