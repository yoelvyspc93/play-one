import { HomeHeader } from '../components/home/HomeHeader';
import { HomeBackgroundCards } from '../components/home/HomeBackgroundCards';
import { HomeHeroContent } from '../components/home/HomeHeroContent';
import { HomeHeroStack } from '../components/home/HomeHeroStack';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black overflow-hidden flex flex-col">
      <HomeHeader />

      <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-8 gap-12 relative">
        <HomeBackgroundCards />
        <HomeHeroContent />
        <HomeHeroStack />
      </main>
    </div>
  );
}
