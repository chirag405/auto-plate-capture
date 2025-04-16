
import { Camera, Video, Database, Zap, Shield, BarChart3 } from 'lucide-react';

const features = [
  {
    name: 'Image Processing',
    description:
      'Upload images containing license plates for instant detection and recognition using advanced YOLO object detection.',
    icon: Camera,
  },
  {
    name: 'Video Analysis',
    description:
      'Process videos to track and recognize license plates across multiple frames with our deep learning models.',
    icon: Video,
  },
  {
    name: 'Data Storage',
    description:
      'All detection results are securely stored and easily accessible through our intuitive dashboard.',
    icon: Database,
  },
  {
    name: 'High Performance',
    description:
      'Optimized algorithms ensure fast processing without compromising on accuracy or detection quality.',
    icon: Zap,
  },
  {
    name: 'Secure Processing',
    description:
      'Advanced security measures to protect all uploaded media and extracted license plate information.',
    icon: Shield,
  },
  {
    name: 'Analytics',
    description:
      'Gain insights into detection patterns and performance metrics through detailed analytics.',
    icon: BarChart3,
  },
];

export function Features() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-brand-accent">Advanced Technology</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need for license plate detection
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Our YOLO-based system offers powerful features for accurate license plate recognition in both images and videos.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
