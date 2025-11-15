/**
 * Profile Page Component
 *
 * Displays user information, app settings, and session management.
 * Allows users to view their profile details, configure app preferences,
 * and manage their authentication session.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { BottomNav } from '../components/BottomNav';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { isOnline, pendingCount } = useOfflineQueue();
  const navigate = useNavigate();

  // App settings state
  const [offlineMode, setOfflineMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = {
      offlineMode: localStorage.getItem('app_offlineMode') === 'true',
      notifications: localStorage.getItem('app_notifications') === 'true',
    };

    setOfflineMode(savedSettings.offlineMode);
    setNotifications(savedSettings.notifications);
  }, []);

  // Handle offline mode toggle
  const handleOfflineModeToggle = () => {
    const newValue = !offlineMode;
    setOfflineMode(newValue);
    localStorage.setItem('app_offlineMode', newValue.toString());
    console.log('[Profile] Offline mode:', newValue);
  };

  // Handle notifications toggle
  const handleNotificationsToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('app_notifications', newValue.toString());
  };

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    toggleDarkMode();
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // AuthContext handles navigation to /login
    } catch (error) {
      console.error('[Profile] Logout failed:', error);
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  // Format date with error handling
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('[Profile] Error formatting date:', error);
      return 'N/A';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-400 dark:from-red-700 dark:to-red-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Mi Perfil</h1>
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Avatar and Name */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-primary-100 dark:text-primary-200">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Connection Status */}
        <div className={`p-4 rounded-lg transition-colors ${
          isOnline
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <div>
                <p className={`font-medium ${
                  isOnline
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-yellow-900 dark:text-yellow-100'
                }`}>
                  {isOnline ? 'Conectado' : 'Sin conexión'}
                </p>
                {pendingCount > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pendingCount} {pendingCount === 1 ? 'cambio pendiente' : 'cambios pendientes'} de sincronizar
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Información Personal</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID de Usuario</label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre Completo</label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Correo Electrónico</label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{user.email}</p>
            </div>
            {user.created_at && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cuenta Creada</label>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{formatDate(user.created_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Roles and Permissions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Roles y Permisos</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Roles</label>
              {user.roles && user.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Sin roles asignados</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Permisos</label>
              {user.permissions && user.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.permissions.map((permission, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Sin permisos específicos</p>
              )}
            </div>
          </div>
        </div>

        {/* App Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Configuración de la App</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Offline Mode */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">Modo Sin Conexión</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Permite usar la app sin conexión a internet
                </p>
              </div>
              <button
                onClick={handleOfflineModeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  offlineMode ? 'bg-primary-600' : 'bg-gray-300'
                }`}
                aria-label="Toggle offline mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    offlineMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notifications */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">Notificaciones</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recibir alertas sobre cambios y actualizaciones
                </p>
              </div>
              <button
                onClick={handleNotificationsToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? 'bg-primary-600' : 'bg-gray-300'
                }`}
                aria-label="Toggle notifications"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Dark Mode */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">Modo Oscuro</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Interfaz con colores oscuros
                </p>
              </div>
              <button
                onClick={handleDarkModeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-primary-600' : 'bg-gray-300'
                }`}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Session Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Información de Sesión</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Estado de Sesión</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded text-sm font-medium">
                Activa
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Versión de la App</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">1.0.0</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pb-4">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-red-600 dark:bg-red-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-800 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">¿Cerrar Sesión?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                ¿Estás seguro de que quieres cerrar sesión?
                {pendingCount > 0 && (
                  <span className="block mt-2 text-yellow-600 dark:text-yellow-400 font-medium">
                    Tienes {pendingCount} {pendingCount === 1 ? 'cambio' : 'cambios'} sin sincronizar.
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-800 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isLoggingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cerrando...
                  </>
                ) : (
                  'Cerrar Sesión'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Profile;
