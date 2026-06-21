import { Shield, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

export function Footer() {
  const { c } = useTheme();
  const footText       = c.footerText || '#A8B2C1';
  const footTextStrong = c.footerTextStrong || '#FFFFFF';

  return (
    <footer
      className="relative mt-20"
      style={{ background: c.footerBg, borderTop: `1px solid ${c.footerBorder}` }}
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">

          {/* Logo & Tagline */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-8 h-8" style={{ color: c.teal }} fill="currentColor" />
              <span className="font-bold text-xl" style={{ color: footTextStrong }}>FoodGuard</span>
            </div>
            <p className="text-sm" style={{ color: footText }}>
              Smarter food management for healthier living and zero waste.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: footTextStrong }}>Product</h4>
            <ul className="space-y-2">
              {[
                { label: 'Dashboard',  to: '/dashboard' },
                { label: 'Inventory',  to: '/inventory'  },
                { label: 'AI Meals',   to: '/ai-meals'   },
                { label: 'Nutrition',  to: '/nutrition'  },
              ].map(l => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm transition-colors"
                    style={{ color: footText }}
                    onMouseEnter={e => { (e.currentTarget).style.color = c.teal; }}
                    onMouseLeave={e => { (e.currentTarget).style.color = c.textSecondary; }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: footTextStrong }}>Company</h4>
            <ul className="space-y-2">
              {['About Us'].map(label => (
                <li key={label}>
                  <Link
                    to={`/${label.toLowerCase().replace(' ', '-')}`}
                    className="text-sm transition-colors"
                    style={{ color: footText }}
                    onMouseEnter={e => { (e.currentTarget).style.color = c.teal; }}
                    onMouseLeave={e => { (e.currentTarget).style.color = c.textSecondary; }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: footTextStrong }}>Resources</h4>
            <ul className="space-y-2">
              {['Help Center', 'Contact'].map(label => (
                <li key={label}>
                  <Link
                    to={`/${label.toLowerCase().replace(' ', '-')}`}
                    className="text-sm transition-colors"
                    style={{ color: footText }}
                    onMouseEnter={e => { (e.currentTarget).style.color = c.teal; }}
                    onMouseLeave={e => { (e.currentTarget).style.color = c.textSecondary; }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4" style={{ color: footTextStrong }}>Legal</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service'].map(label => (
                <li key={label}>
                  <Link
                    to={`/${label.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-sm transition-colors"
                    style={{ color: footText }}
                    onMouseEnter={e => { (e.currentTarget).style.color = c.teal; }}
                    onMouseLeave={e => { (e.currentTarget).style.color = c.textSecondary; }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${c.footerBorder}` }}
        >
          <p className="text-sm" style={{ color: footText }}>
            © 2026 FoodGuard. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i} href="#"
                style={{ color: footText }}
                onMouseEnter={e => { (e.currentTarget).style.color = c.teal; }}
                onMouseLeave={e => { (e.currentTarget).style.color = c.textSecondary; }}
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
