# Guía de Implementación Frontend - Sistema de Notificaciones

## Componente de Campanita de Notificaciones (Bell Icon)

### 1. Estado y Context API

Crear un contexto global para las notificaciones:

```javascript
// contexts/NotificationContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Obtener conteo de no leídas
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error al obtener conteo:', error);
    }
  }, []);

  // Obtener notificaciones
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications({
        page,
        limit,
        unreadOnly: false
      });
      setNotifications(response.data.notifications);
      return response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, readAt: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  }, []);

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      // Refrescar conteo
      fetchUnreadCount();
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  }, [fetchUnreadCount]);

  // Cargar conteo inicial
  useEffect(() => {
    fetchUnreadCount();
    
    // Polling cada 30 segundos para actualizar el conteo
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
};
```

### 2. Servicio de API

```javascript
// services/notificationService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class NotificationService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${API_URL}/api/notifications`
    });

    // Interceptor para agregar token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Obtener notificaciones
  async getNotifications(params = {}) {
    const response = await this.axiosInstance.get('/', { params });
    return response.data;
  }

  // Obtener conteo de no leídas
  async getUnreadCount() {
    const response = await this.axiosInstance.get('/unread-count');
    return response.data;
  }

  // Obtener estadísticas
  async getStats() {
    const response = await this.axiosInstance.get('/stats');
    return response.data;
  }

  // Marcar como leída
  async markAsRead(notificationId) {
    const response = await this.axiosInstance.patch(`/${notificationId}/read`);
    return response.data;
  }

  // Marcar múltiples como leídas
  async markMultipleAsRead(notificationIds) {
    const response = await this.axiosInstance.patch('/read-multiple', {
      notificationIds
    });
    return response.data;
  }

  // Marcar todas como leídas
  async markAllAsRead() {
    const response = await this.axiosInstance.patch('/read-all');
    return response.data;
  }

  // Archivar notificación
  async archiveNotification(notificationId) {
    const response = await this.axiosInstance.patch(`/${notificationId}/archive`);
    return response.data;
  }

  // Eliminar notificación
  async deleteNotification(notificationId) {
    const response = await this.axiosInstance.delete(`/${notificationId}`);
    return response.data;
  }
}

export default new NotificationService();
```

### 3. Componente de Campanita (Bell Icon)

```javascript
// components/NotificationBell.jsx
import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import './NotificationBell.css';

const NotificationBell = () => {
  const { unreadCount, fetchNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className="notification-bell-button"
        onClick={handleToggle}
        aria-label="Notificaciones"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} />}
    </div>
  );
};

// Icono de campanita SVG
const BellIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default NotificationBell;
```

### 4. Dropdown de Notificaciones

```javascript
// components/NotificationDropdown.jsx
import { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import './NotificationDropdown.css';

const NotificationDropdown = ({ onClose }) => {
  const { 
    notifications, 
    loading, 
    fetchNotifications, 
    markAllAsRead 
  } = useNotifications();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.readAt)
    : notifications;

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-dropdown-header">
        <h3>Notificaciones</h3>
        <button 
          className="mark-all-read-btn"
          onClick={handleMarkAllAsRead}
          disabled={!notifications.some(n => !n.readAt)}
        >
          Marcar todas como leídas
        </button>
      </div>

      <div className="notification-tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Todas
        </button>
        <button 
          className={`tab ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          No leídas
        </button>
      </div>

      <div className="notification-list">
        {loading ? (
          <div className="notification-loading">Cargando...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notification-empty">
            <p>No tienes notificaciones {activeTab === 'unread' ? 'sin leer' : ''}</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <NotificationItem 
              key={notification._id} 
              notification={notification}
              onClose={onClose}
            />
          ))
        )}
      </div>

      <div className="notification-dropdown-footer">
        <a href="/notifications" className="view-all-link">
          Ver todas las notificaciones
        </a>
      </div>
    </div>
  );
};

export default NotificationDropdown;
```

### 5. Item de Notificación

```javascript
// components/NotificationItem.jsx
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import './NotificationItem.css';

const NotificationItem = ({ notification, onClose }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const isUnread = !notification.readAt;

  const handleClick = async () => {
    if (isUnread) {
      await markAsRead(notification._id);
    }
    
    // Si tiene URL de acción, navegar
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
      onClose?.();
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    await deleteNotification(notification._id);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es
  });

  const priorityClass = `priority-${notification.priority}`;

  return (
    <div 
      className={`notification-item ${isUnread ? 'unread' : ''} ${priorityClass}`}
      onClick={handleClick}
    >
      <div className="notification-indicator">
        {isUnread && <span className="unread-dot" />}
        <NotificationIcon type={notification.type} />
      </div>

      <div className="notification-content">
        <div className="notification-title">{notification.title}</div>
        <div className="notification-message">{notification.message}</div>
        <div className="notification-meta">
          <span className="notification-time">{timeAgo}</span>
          {notification.priority === 'urgent' && (
            <span className="urgent-badge">Urgente</span>
          )}
        </div>
      </div>

      <button 
        className="notification-delete-btn"
        onClick={handleDelete}
        aria-label="Eliminar notificación"
      >
        ×
      </button>
    </div>
  );
};

// Iconos según el tipo de notificación
const NotificationIcon = ({ type }) => {
  const icons = {
    email_confirmation: '✉️',
    password_reset: '🔒',
    account_updated: '👤',
    role_changed: '⚡',
    cv_uploaded: '📄',
    cv_processed: '✅',
    cv_analysis_ready: '📊',
    cv_analysis_failed: '❌',
    admin_announcement: '📢',
    system_update: '🔄',
    custom: '📬'
  };

  return (
    <span className="notification-icon" role="img">
      {icons[type] || icons.custom}
    </span>
  );
};

export default NotificationItem;
```

### 6. Estilos CSS

```css
/* NotificationBell.css */
.notification-bell-container {
  position: relative;
}

.notification-bell-button {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.notification-bell-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.notification-bell-button svg {
  width: 24px;
  height: 24px;
  color: #333;
}

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: #dc3545;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: bold;
  min-width: 18px;
  text-align: center;
}

/* NotificationDropdown.css */
.notification-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 380px;
  max-height: 600px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.notification-dropdown-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-dropdown-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.mark-all-read-btn {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 13px;
  padding: 4px 8px;
}

.mark-all-read-btn:hover {
  text-decoration: underline;
}

.mark-all-read-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.notification-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.notification-tabs .tab {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.notification-tabs .tab.active {
  color: #007bff;
  border-bottom-color: #007bff;
  font-weight: 600;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-loading,
.notification-empty {
  padding: 40px 16px;
  text-align: center;
  color: #666;
}

.notification-dropdown-footer {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.view-all-link {
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.view-all-link:hover {
  text-decoration: underline;
}

/* NotificationItem.css */
.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f7ff;
}

.notification-item.priority-urgent {
  border-left: 3px solid #dc3545;
}

.notification-item.priority-high {
  border-left: 3px solid #ffc107;
}

.notification-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background-color: #007bff;
  border-radius: 50%;
}

.notification-icon {
  font-size: 24px;
  line-height: 1;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  color: #333;
}

.notification-message {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.urgent-badge {
  font-size: 11px;
  padding: 2px 6px;
  background-color: #dc3545;
  color: white;
  border-radius: 3px;
  font-weight: 600;
}

.notification-delete-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.notification-item:hover .notification-delete-btn {
  opacity: 1;
}

.notification-delete-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}
```

### 7. Integración en el Layout Principal

```javascript
// App.jsx o Layout.jsx
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationBell from './components/NotificationBell';

function App() {
  return (
    <NotificationProvider>
      <div className="app">
        <header className="app-header">
          <div className="header-left">
            <h1>Mi App</h1>
          </div>
          <div className="header-right">
            {/* Campanita de notificaciones */}
            <NotificationBell />
            
            {/* Otros elementos del header */}
            <UserMenu />
          </div>
        </header>
        
        <main className="app-content">
          {/* Resto de la aplicación */}
        </main>
      </div>
    </NotificationProvider>
  );
}
```

### 8. Página Completa de Notificaciones (Opcional)

```javascript
// pages/NotificationsPage.jsx
import { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationItem from '../components/NotificationItem';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { 
    notifications, 
    loading, 
    fetchNotifications,
    markAllAsRead 
  } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchNotifications(page, 20);
  }, [page, fetchNotifications]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.readAt;
    if (filter === 'read') return n.readAt;
    return true;
  });

  return (
    <div className="notifications-page">
      <div className="notifications-page-header">
        <h1>Notificaciones</h1>
        <button onClick={markAllAsRead}>
          Marcar todas como leídas
        </button>
      </div>

      <div className="notifications-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Todas
        </button>
        <button 
          className={filter === 'unread' ? 'active' : ''}
          onClick={() => setFilter('unread')}
        >
          No leídas
        </button>
        <button 
          className={filter === 'read' ? 'active' : ''}
          onClick={() => setFilter('read')}
        >
          Leídas
        </button>
      </div>

      <div className="notifications-page-list">
        {loading ? (
          <div>Cargando...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            No tienes notificaciones {filter !== 'all' && filter}
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <NotificationItem 
              key={notification._id} 
              notification={notification}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
```

## Resumen de Archivos Necesarios

```
src/
├── contexts/
│   └── NotificationContext.jsx       # Context API para estado global
├── services/
│   └── notificationService.js        # Servicio API
├── components/
│   ├── NotificationBell.jsx          # Campanita con badge
│   ├── NotificationBell.css
│   ├── NotificationDropdown.jsx      # Dropdown con lista
│   ├── NotificationDropdown.css
│   ├── NotificationItem.jsx          # Item individual
│   └── NotificationItem.css
└── pages/
    ├── NotificationsPage.jsx         # Página completa (opcional)
    └── NotificationsPage.css
```

## Dependencias NPM Necesarias

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "date-fns": "^2.30.0"
  }
}
```

## Variables de Entorno

```env
REACT_APP_API_URL=http://localhost:3000
```

## Características Implementadas

✅ Campanita con contador de no leídas  
✅ Badge animado en la campanita  
✅ Dropdown con lista de notificaciones  
✅ Tabs para filtrar (Todas / No leídas)  
✅ Marcar como leída al hacer click  
✅ Marcar todas como leídas  
✅ Eliminar notificaciones individuales  
✅ Navegación a URL de acción  
✅ Indicador visual de no leídas  
✅ Indicadores de prioridad (urgente/alta)  
✅ Iconos según tipo de notificación  
✅ Timestamps relativos ("hace 5 minutos")  
✅ Polling automático cada 30 segundos  
✅ Cierre del dropdown al hacer click fuera  
✅ Responsive design  

## Mejoras Futuras Opcionales

- WebSockets para notificaciones en tiempo real
- Sonido al recibir notificación
- Animación al recibir nueva notificación
- Infinite scroll en el dropdown
- Agrupación de notificaciones
- Notificaciones del navegador (Push API)
