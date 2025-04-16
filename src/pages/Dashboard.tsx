
import { MainLayout } from '@/components/layout/MainLayout';
import { DetectionTable } from '@/components/dashboard/DetectionTable';

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="py-10 bg-gray-50 min-h-screen">
        <div className="container">
          <h1 className="text-3xl font-bold mb-6">Detection Dashboard</h1>
          <p className="text-gray-600 mb-8">
            View your recent license plate detections and their details.
          </p>
          
          <DetectionTable />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
