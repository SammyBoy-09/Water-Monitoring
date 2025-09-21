import React, { useState, useEffect } from 'react';
import { X, Bell, AlertTriangle, MapPin, Check, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationManager, HotspotNotification } from '@shared/utils/notification-system';

interface NotificationPanelProps {
  onNavigateToHotspot?: (location: { lat: number; lng: number }, hotspotId: string) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onNavigateToHotspot }) => {
  const [notifications, setNotifications] = useState<HotspotNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial notifications
    setNotifications(notificationManager.getNotifications());
    setUnreadCount(notificationManager.getUnreadNotifications().length);

    // Listen for new notifications
    const handleNewNotification = (notification: HotspotNotification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Auto-open panel for critical alerts
      if (notification.severity === 'critical') {
        setIsOpen(true);
      }
    };

    notificationManager.addListener(handleNewNotification);

    // Cleanup
    return () => {
      notificationManager.removeListener(handleNewNotification);
    };
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    notificationManager.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleDismiss = (notificationId: string) => {
    notificationManager.dismissNotification(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, dismissed: true } : n)
    );
  };

  const handleViewOnMap = (notification: HotspotNotification) => {
    handleMarkAsRead(notification.id);
    if (onNavigateToHotspot) {
      onNavigateToHotspot(notification.location, notification.hotspotId);
    }
    setIsOpen(false);
  };

  const handleMarkActionTaken = (notificationId: string) => {
    notificationManager.markActionTaken(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, actionTaken: true, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const activeNotifications = notifications.filter(n => !n.dismissed);
  const criticalNotifications = activeNotifications.filter(n => n.severity === 'critical');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return '🟡';
      case 'medium': return '🟠';
      case 'high': return '🔴';
      case 'critical': return '🚨';
      default: return '⚠️';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant={criticalNotifications.length > 0 ? "destructive" : "outline"}
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={`${criticalNotifications.length > 0 ? 'animate-pulse' : ''}`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 px-1 min-w-[20px] h-5 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <Card className="absolute top-12 right-0 w-96 max-h-96 overflow-hidden shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Hotspot Alerts ({activeNotifications.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {activeNotifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No active alerts</p>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {activeNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border-2 ${getSeverityColor(notification.severity)} ${
                        !notification.read ? 'ring-2 ring-blue-200' : ''
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getSeverityIcon(notification.severity)}</span>
                          <Badge variant={notification.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {notification.severity.toUpperCase()}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">{notification.title}</h4>
                        <p className="text-xs text-gray-600">{notification.message}</p>
                        
                        {/* Location */}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {notification.location.lat.toFixed(4)}, {notification.location.lng.toFixed(4)}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <div className="text-xs text-gray-400">
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOnMap(notification)}
                          className="flex-1 text-xs h-7"
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          View on Map
                        </Button>
                        
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs h-7"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        
                        {notification.severity === 'critical' || notification.severity === 'high' ? (
                          <Button
                            size="sm"
                            variant={notification.actionTaken ? "outline" : "default"}
                            onClick={() => handleMarkActionTaken(notification.id)}
                            className="text-xs h-7"
                            disabled={notification.actionTaken}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            {notification.actionTaken ? 'Done' : 'Action Taken'}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with stats */}
            {activeNotifications.length > 0 && (
              <div className="border-t p-3 bg-gray-50 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Critical: {criticalNotifications.length}</span>
                  <span>Unread: {unreadCount}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Critical Alert Overlay */}
      {criticalNotifications.length > 0 && !isOpen && (
        <div className="absolute top-12 right-0 w-80 pointer-events-none">
          {criticalNotifications.slice(0, 2).map((notification) => (
            <div
              key={`overlay-${notification.id}`}
              className="mb-2 p-3 bg-red-100 border-2 border-red-300 rounded-lg shadow-lg animate-pulse"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🚨</span>
                <Badge variant="destructive" className="text-xs">CRITICAL</Badge>
              </div>
              <p className="text-sm font-semibold text-red-800">{notification.title}</p>
              <p className="text-xs text-red-600 mt-1">{notification.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;