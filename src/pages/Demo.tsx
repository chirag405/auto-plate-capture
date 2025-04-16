
import { MainLayout } from '@/components/layout/MainLayout';
import { MediaUploader } from '@/components/demo/MediaUploader';

const Demo = () => {
  return (
    <MainLayout>
      <div className="py-10 bg-gray-50 min-h-screen">
        <div className="container">
          <h1 className="text-3xl font-bold mb-6">License Plate Detection Demo</h1>
          <p className="text-gray-600 mb-8">
            Upload an image or video containing license plates and our AI will detect and recognize the plates.
          </p>
          
          <MediaUploader />
        </div>
      </div>
    </MainLayout>
  );
};

export default Demo;
