/**
 * Main Application Component
 *
 * Configures routing and authentication for the ITAM PWA.
 * Wraps the application with necessary context providers.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import AssetDetail from './pages/AssetDetail';
import EmployeeEquipment from './pages/EmployeeEquipment';
import Profile from './pages/Profile';
import EquipmentOutputs from './pages/EquipmentOutputs';
import NewEquipmentOutput from './pages/NewEquipmentOutput';
import CreateHomeOffice from './pages/CreateHomeOffice';
import HomeOfficeDetail from './pages/HomeOfficeDetail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <ProtectedRoute>
                <Scanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets/:id"
            element={
              <ProtectedRoute>
                <AssetDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipment/:id"
            element={
              <ProtectedRoute>
                <AssetDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-equipment/:employeeId"
            element={
              <ProtectedRoute>
                <EmployeeEquipment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipment-outputs"
            element={
              <ProtectedRoute>
                <EquipmentOutputs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipment-outputs/new"
            element={
              <ProtectedRoute>
                <NewEquipmentOutput />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-home-office"
            element={
              <ProtectedRoute>
                <CreateHomeOffice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home-office/:id"
            element={
              <ProtectedRoute>
                <HomeOfficeDetail />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Page not found</p>
                <a href="/dashboard" className="text-primary-600 hover:underline">
                  Go to Dashboard
                </a>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
