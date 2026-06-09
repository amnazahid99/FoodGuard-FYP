import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CosmicBackground } from './CosmicBackground';
import { useTheme } from '../../contexts/ThemeContext';

export function Layout() {
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
