// Notification system for hotspot alerts
import { Hotspot } from '@shared/utils/hotspot-detection';

export interface NotificationConfig {
  enableBrowserNotifications: boolean;
  enableEmailAlerts: boolean;
  enableSMSAlerts: boolean;
  soundEnabled: boolean;
  autoCloseDelay: number; // in milliseconds
  maxNotificationsPerHour: number;
}

export interface HotspotNotification {
  id: string;
  hotspotId: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  location: { lat: number; lng: number };
  read: boolean;
  dismissed: boolean;
  actionTaken: boolean;
}

export class HotspotNotificationManager {
  private notifications: HotspotNotification[] = [];
  private config: NotificationConfig;
  private notificationCount: { [hour: string]: number } = {};
  private listeners: Array<(notification: HotspotNotification) => void> = [];

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = {
      enableBrowserNotifications: true,
      enableEmailAlerts: false,
      enableSMSAlerts: false,
      soundEnabled: true,
      autoCloseDelay: 10000, // 10 seconds
      maxNotificationsPerHour: 10,
      ...config
    };

    this.requestNotificationPermission();
  }

  /**
   * Request browser notification permission
   */
  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && this.config.enableBrowserNotifications) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  }

  /**
   * Check if we can send more notifications this hour
   */
  private canSendNotification(): boolean {
    const currentHour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    const count = this.notificationCount[currentHour] || 0;
    return count < this.config.maxNotificationsPerHour;
  }

  /**
   * Increment notification count for current hour
   */
  private incrementNotificationCount(): void {
    const currentHour = new Date().toISOString().slice(0, 13);
    this.notificationCount[currentHour] = (this.notificationCount[currentHour] || 0) + 1;
  }

  /**
   * Create notification from hotspot
   */
  public createHotspotNotification(hotspot: Hotspot): HotspotNotification {
    const typeMessages = {
      symptom_outbreak: `Disease outbreak detected with ${hotspot.markerCount} cases`,
      water_contamination: `Water contamination hotspot with ${hotspot.markerCount} test results`,
      intervention_zone: `Intervention zone alert with ${hotspot.markerCount} markers`,
      mixed: `Health alert hotspot with ${hotspot.markerCount} incidents`
    };

    const urgencyMessages = {
      low: 'Monitor the situation',
      medium: 'Attention required',
      high: 'Urgent action needed',
      critical: 'Emergency response required immediately!'
    };

    return {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hotspotId: hotspot.id,
      title: `🚨 ${hotspot.severity.toUpperCase()} Alert: ${typeMessages[hotspot.type]}`,
      message: `${typeMessages[hotspot.type]} in a 1km radius. ${urgencyMessages[hotspot.severity]}`,
      severity: hotspot.severity,
      timestamp: new Date().toISOString(),
      location: hotspot.center,
      read: false,
      dismissed: false,
      actionTaken: false
    };
  }

  /**
   * Send hotspot notification
   */
  public async sendHotspotAlert(hotspot: Hotspot): Promise<void> {
    if (!this.canSendNotification()) {
      console.warn('Notification rate limit exceeded');
      return;
    }

    const notification = this.createHotspotNotification(hotspot);
    this.notifications.unshift(notification);
    this.incrementNotificationCount();

    // Notify listeners
    this.listeners.forEach(listener => listener(notification));

    // Show browser notification
    await this.showBrowserNotification(notification);

    // Play sound if enabled
    if (this.config.soundEnabled) {
      this.playNotificationSound(notification.severity);
    }

    // Auto-dismiss after delay for non-critical alerts
    if (notification.severity !== 'critical' && this.config.autoCloseDelay > 0) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, this.config.autoCloseDelay);
    }
  }

  /**
   * Show browser notification
   */
  private async showBrowserNotification(notification: HotspotNotification): Promise<void> {
    if (!this.config.enableBrowserNotifications || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: this.getNotificationIcon(notification.severity),
        badge: '/favicon.ico',
        tag: notification.hotspotId, // Prevent duplicate notifications for same hotspot
        requireInteraction: notification.severity === 'critical'
      });

      browserNotification.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        // Trigger map navigation to hotspot location
        window.dispatchEvent(new CustomEvent('navigateToHotspot', {
          detail: { location: notification.location, hotspotId: notification.hotspotId }
        }));
        browserNotification.close();
      };

      // Auto-close browser notification after delay
      if (this.config.autoCloseDelay > 0 && notification.severity !== 'critical') {
        setTimeout(() => browserNotification.close(), this.config.autoCloseDelay);
      }
    }
  }

  /**
   * Get notification icon based on severity
   */
  private getNotificationIcon(severity: string): string {
    const icons = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨'
    };
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icons[severity as keyof typeof icons] || '⚠️'}</text></svg>`;
  }

  /**
   * Play notification sound based on severity
   */
  private playNotificationSound(severity: string): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different tones for different severities
      const frequencies = {
        low: 440,    // A4
        medium: 523, // C5
        high: 659,   // E5
        critical: 880 // A5
      };

      const frequency = frequencies[severity as keyof typeof frequencies] || 440;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = severity === 'critical' ? 'sawtooth' : 'sine';

      // Volume and duration based on severity
      const volume = severity === 'critical' ? 0.3 : 0.1;
      const duration = severity === 'critical' ? 1.5 : 0.5;

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

      // For critical alerts, play multiple beeps
      if (severity === 'critical') {
        setTimeout(() => this.playNotificationSound('high'), 800);
        setTimeout(() => this.playNotificationSound('high'), 1600);
      }
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  /**
   * Add notification listener
   */
  public addListener(listener: (notification: HotspotNotification) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove notification listener
   */
  public removeListener(listener: (notification: HotspotNotification) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get all notifications
   */
  public getNotifications(): HotspotNotification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  public getUnreadNotifications(): HotspotNotification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Mark notification as read
   */
  public markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Dismiss notification
   */
  public dismissNotification(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.dismissed = true;
    }
  }

  /**
   * Mark action as taken for notification
   */
  public markActionTaken(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.actionTaken = true;
      notification.read = true;
    }
  }

  /**
   * Clear old notifications (older than 24 hours)
   */
  public clearOldNotifications(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    this.notifications = this.notifications.filter(n => n.timestamp > oneDayAgo);
  }

  /**
   * Get notification statistics
   */
  public getStats() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const thisHour = now.toISOString().slice(0, 13);

    const todayNotifications = this.notifications.filter(n => n.timestamp.startsWith(today));
    const thisHourNotifications = this.notifications.filter(n => n.timestamp.startsWith(thisHour));

    return {
      total: this.notifications.length,
      unread: this.getUnreadNotifications().length,
      today: todayNotifications.length,
      thisHour: thisHourNotifications.length,
      critical: this.notifications.filter(n => n.severity === 'critical').length,
      dismissed: this.notifications.filter(n => n.dismissed).length,
      actionTaken: this.notifications.filter(n => n.actionTaken).length
    };
  }
}

// Global notification manager instance
export const notificationManager = new HotspotNotificationManager();