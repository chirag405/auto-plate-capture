
import { Card, CardContent } from '@/components/ui/card';

export function HowItWorks() {
  return (
    <div className="bg-brand-lightGray py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-brand-accent">How It Works</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Three simple steps to plate detection
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Our AI-powered system makes license plate detection simple and efficient.
          </p>
        </div>
        
        <div className="mt-16 flex flex-col md:flex-row gap-8 items-center justify-center">
          <Card className="w-full md:w-1/3 bg-white">
            <CardContent className="pt-6">
              <div className="rounded-full bg-brand-blue w-12 h-12 flex items-center justify-center text-white font-bold text-xl mb-4">1</div>
              <h3 className="text-lg font-semibold mb-2">Upload Media</h3>
              <p className="text-gray-600">
                Upload an image or video containing license plates to our secure platform.
              </p>
            </CardContent>
          </Card>
          
          <div className="hidden md:block text-4xl text-brand-blue">→</div>
          <div className="block md:hidden text-4xl text-brand-blue">↓</div>
          
          <Card className="w-full md:w-1/3 bg-white">
            <CardContent className="pt-6">
              <div className="rounded-full bg-brand-blue w-12 h-12 flex items-center justify-center text-white font-bold text-xl mb-4">2</div>
              <h3 className="text-lg font-semibold mb-2">AI Processing</h3>
              <p className="text-gray-600">
                Our YOLO model detects and recognizes license plates with high accuracy.
              </p>
            </CardContent>
          </Card>
          
          <div className="hidden md:block text-4xl text-brand-blue">→</div>
          <div className="block md:hidden text-4xl text-brand-blue">↓</div>
          
          <Card className="w-full md:w-1/3 bg-white">
            <CardContent className="pt-6">
              <div className="rounded-full bg-brand-blue w-12 h-12 flex items-center justify-center text-white font-bold text-xl mb-4">3</div>
              <h3 className="text-lg font-semibold mb-2">View Results</h3>
              <p className="text-gray-600">
                Review the detected license plates and access them through the dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
