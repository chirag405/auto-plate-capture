
import { MainLayout } from '@/components/layout/MainLayout';
import { Hero } from '@/components/home/Hero';
import { Features } from '@/components/home/Features';
import { HowItWorks } from '@/components/home/HowItWorks';

const Home = () => {
  return (
    <MainLayout>
      <Hero />
      <Features />
      <HowItWorks />
    </MainLayout>
  );
};

export default Home;
