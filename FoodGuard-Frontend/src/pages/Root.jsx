import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CosmicBackground } from '../components/CosmicBackground';
import { useTheme } from '../contexts/ThemeContext';

export function Root() {
  const { c } = useTheme();

  return (
    <div className="relative min-h-screen" style={{ background: c.pageBg }}>
      <CosmicBackground />
      <div className="relative z-10">
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
