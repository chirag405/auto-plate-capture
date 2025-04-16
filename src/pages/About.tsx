
import { MainLayout } from '@/components/layout/MainLayout';
import { TechStack } from '@/components/about/TechStack';

const About = () => {
  return (
    <MainLayout>
      <div className="bg-white">
        <div className="relative isolate overflow-hidden bg-gradient-to-b from-brand-blue to-brand-lightBlue py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">About Our Technology</h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Learn about the advanced AI technology behind our automatic license plate recognition system.
              </p>
            </div>
          </div>
        </div>
        
        <TechStack />
        
        <div className="bg-brand-lightGray py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:mx-0">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Why Use License Plate Recognition?</h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Automatic license plate recognition technology has numerous applications across various industries:
              </p>
              
              <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div className="border-l-4 border-brand-accent pl-4">
                  <h3 className="text-lg font-semibold text-gray-900">Law Enforcement</h3>
                  <p className="mt-2 text-gray-600">Identify stolen vehicles, traffic violations, and assist in criminal investigations.</p>
                </div>
                <div className="border-l-4 border-brand-accent pl-4">
                  <h3 className="text-lg font-semibold text-gray-900">Parking Management</h3>
                  <p className="mt-2 text-gray-600">Automate parking lot entry/exit, payment systems, and monitor vehicle duration.</p>
                </div>
                <div className="border-l-4 border-brand-accent pl-4">
                  <h3 className="text-lg font-semibold text-gray-900">Toll Collection</h3>
                  <p className="mt-2 text-gray-600">Enable seamless toll collection without requiring vehicles to stop completely.</p>
                </div>
                <div className="border-l-4 border-brand-accent pl-4">
                  <h3 className="text-lg font-semibold text-gray-900">Border Control</h3>
                  <p className="mt-2 text-gray-600">Monitor vehicles crossing borders and compare against watchlists.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;
