import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { DashboardProvider } from './contexts/DashboardContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { ExpiryAlerts } from './pages/ExpiryAlerts';
import { Inventory } from './pages/Inventory';
import { AIMeals } from './pages/AIMeals';
import { NutritionInsights } from './pages/NutritionInsights';
import { BMI } from './pages/BMI';
import { RecipeDetail } from './pages/RecipeDetail';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Pricing } from './pages/Pricing';
import { Settings } from './pages/Settings';
import { Notifications } from './pages/Notifications';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { HelpCenter } from './pages/HelpCenter';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <InventoryProvider>
              <DashboardProvider>
                <Routes>
                  {/* Auth pages — no navbar/footer */}
                  <Route path="/login"           element={<Login />}          />
                  <Route path="/signup"          element={<Signup />}         />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password"  element={<ResetPassword />}  />

                  {/* Main layout — Navbar + Footer */}
                  <Route element={<Layout />}>
                    {/* Public */}
                    <Route index                   element={<Landing />}        />
                    <Route path="pricing"          element={<Pricing />}        />
                    <Route path="about-us"         element={<About />}          />
                    <Route path="contact"          element={<Contact />}        />
                    <Route path="privacy-policy"   element={<PrivacyPolicy />}  />
                    <Route path="terms-of-service" element={<TermsOfService />} />
                    <Route path="help-center"      element={<HelpCenter />}     />

                    {/* Protected */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="dashboard"           element={<Dashboard />}         />
                      <Route path="expiry-alerts"       element={<ExpiryAlerts />}      />
                      <Route path="inventory"           element={<Inventory />}         />
                      <Route path="ai-meals"            element={<AIMeals />}           />
                      <Route path="ai-meals/recipe/:id" element={<RecipeDetail />}      />
                      <Route path="nutrition"           element={<NutritionInsights />} />
                      <Route path="bmi"                 element={<BMI />} />
                      <Route path="settings"            element={<Settings />}          />
                      <Route path="notifications"       element={<Notifications />}     />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </DashboardProvider>
            </InventoryProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
