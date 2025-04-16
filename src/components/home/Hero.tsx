
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-b from-brand-blue to-brand-lightBlue pb-16 pt-14 sm:pb-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl pt-10 text-center sm:pt-16">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl animate-fade-in">
            Automatic Number Plate Recognition
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Powerful AI-driven license plate detection for images and videos using YOLO object detection. Fast, accurate, and easy to use.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link to="/demo">
              <Button size="lg" className="bg-white text-brand-blue hover:bg-gray-100">
                Try the Demo
              </Button>
            </Link>
            <Link to="/about" className="text-sm font-semibold leading-6 text-white">
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        
        <div className="mt-16 flow-root sm:mt-20">
          <div className="relative rounded-xl bg-brand-darkGray/5 p-2 ring-1 ring-inset ring-white/10 lg:-m-4 lg:rounded-2xl lg:p-4">
            <img
              src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=3540&auto=format&fit=crop"
              alt="License plate detection screenshot"
              className="rounded-md shadow-2xl ring-1 ring-white/10"
            />
            <div className="absolute inset-0 rounded-md ring-1 ring-inset ring-white/10"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
