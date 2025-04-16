
import { Card, CardContent } from '@/components/ui/card';

export function TechStack() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-brand-accent">Technology</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Built with cutting-edge technology
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Our system leverages state-of-the-art deep learning models and frameworks to deliver reliable license plate detection.
          </p>
        </div>
        
        <div className="mt-16">
          <h3 className="text-xl font-semibold mb-4">Key Technologies:</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-lg font-semibold mb-2">YOLO (You Only Look Once)</h4>
                <p className="text-gray-600">
                  A state-of-the-art real-time object detection system that can identify license plates in a single forward pass of the neural network. We use YOLO for its exceptional balance of speed and accuracy.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-lg font-semibold mb-2">Optical Character Recognition (OCR)</h4>
                <p className="text-gray-600">
                  After detecting license plates, our custom OCR system extracts the alphanumeric characters with high accuracy, even in challenging conditions like varying lighting and angles.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-lg font-semibold mb-2">Flask Backend API</h4>
                <p className="text-gray-600">
                  A lightweight and efficient Python web framework that handles all image and video processing requests. Flask provides a seamless interface between the frontend and our AI models.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h4 className="text-lg font-semibold mb-2">React Frontend</h4>
                <p className="text-gray-600">
                  A modern, responsive user interface built with React and Tailwind CSS that provides an intuitive experience for uploading media, viewing results, and accessing detection history.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-4">System Architecture:</h3>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">
                  Our system follows a client-server architecture where the React frontend allows users to upload images or videos. These are sent to the Flask backend API, which processes them using the YOLO model for license plate detection and OCR for character recognition. The processed results are then returned to the frontend for display and stored in a database for future reference in the dashboard.
                </p>
                <div className="mt-6 flex flex-col space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-brand-blue rounded-full mr-2"></div>
                    <span>User uploads media through the React frontend</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-brand-blue rounded-full mr-2"></div>
                    <span>Flask API receives the media files</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-brand-blue rounded-full mr-2"></div>
                    <span>YOLO model detects license plates in the media</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-brand-blue rounded-full mr-2"></div>
                    <span>OCR extracts alphanumeric characters</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-brand-blue rounded-full mr-2"></div>
                    <span>Results are sent back to the frontend and stored</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
