// WebSocket service for Desktop Counter App

import io from 'socket.io-client';

type SocketInstance = ReturnType<typeof io>;

class WebSocketService {
  private socket: SocketInstance | null = null;
  private counterId: string | null = null;
  private debugEnabled = false;
  private debugAttached = false;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.connected) {
        if (this.debugEnabled) this.attachDebugListeners();
        resolve();
        return;
      }

      try {
        // Socket.io supports both http:// and ws://, but ws:// is more explicit for WebSocket
        const wsUrl = process.env.WEBSOCKET_URL || 'ws://localhost:3000/counters';
        this.socket = io(wsUrl, {
          transports: ['websocket'],
          timeout: 5000,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected:', this.socket?.id);
          if (this.debugEnabled) this.attachDebugListeners();
          if (this.counterId) {
            this.socket?.emit('join_counter', { counterId: this.counterId });
          }
          resolve();
        });

        this.socket.on('connect_error', (error: unknown) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', (reason: unknown) => {
          console.log('WebSocket disconnected:', reason);
        });

        // Auto reconnect on disconnect
        this.socket.on('disconnect', () => {
          setTimeout(() => {
            if (!this.socket?.connected) {
              console.log('Attempting to reconnect...');
              this.connect().catch((error) => {
                console.error('Reconnect failed:', error);
              });
            }
          }, 3000);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  enableDebug(): void {
    this.debugEnabled = true;
    this.attachDebugListeners();
  }

  private attachDebugListeners(): void {
    if (!this.debugEnabled || !this.socket || this.debugAttached === true) return;
    this.debugAttached = true;

    const log = (name: string) => (payload?: unknown) => {
      try {
        console.log('[WS EVENT]', name, payload ?? '');
      } catch {
        console.log('[WS EVENT]', name);
      }
    };

    // Core lifecycle
    this.socket.on('connect', log('connect'));
    this.socket.on('disconnect', log('disconnect'));
    this.socket.on('connect_error', log('connect_error'));
    this.socket.on('error', log('error'));

    // Counter events
    this.socket.on('joined_counter', log('joined_counter'));
    this.socket.on('left_counter', log('left_counter'));

    // Ticket/patient events
    this.socket.on('new_ticket', log('new_ticket'));
    this.socket.on('ticket_processed', log('ticket_processed'));
    this.socket.on('ticket_status', log('ticket_status'));
    this.socket.on('patient_called', log('patient_called'));
    this.socket.on('next_patient_called', log('next_patient_called'));
    this.socket.on('patient_skipped', log('patient_skipped'));
    this.socket.on('patient_preparing', log('patient_preparing'));
    this.socket.on('patient_served', log('patient_served'));
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinCounter(counterId: string): void {
    if (this.socket && this.socket.connected) {
      this.counterId = counterId;
      this.socket.emit('join_counter', { counterId });
      console.log('Joined counter:', counterId);
    } else {
      console.error('WebSocket not connected');
    }
  }

  leaveCounter(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_counter');
      this.counterId = null;
      console.log('Left counter');
    }
  }

  ping(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ping');
    }
  }

  // Event listeners
  onJoinedCounter(callback: (data: { counterId: string; message: string }) => void): void {
    if (this.socket) {
      this.socket.on('joined_counter', callback);
    }
  }

  onLeftCounter(callback: (data: { message: string }) => void): void {
    if (this.socket) {
      this.socket.on('left_counter', callback);
    }
  }

  onNewTicket(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('new_ticket', callback);
    }
  }

  onPatientCalled(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('patient_called', callback);
    }
  }

  onNextPatientCalled(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('next_patient_called', callback);
    }
  }

  onPatientSkipped(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('patient_skipped', callback);
    }
  }

  onPatientPreparing(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('patient_preparing', callback);
    }
  }

  onPatientServed(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('patient_served', callback);
    }
  }

  onTicketCompleted(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('ticket_completed', callback);
    }
  }

  onTicketProcessed(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('ticket_processed', callback);
    }
  }

  onTicketStatus(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('ticket_status', callback);
    }
  }

  onQueueUpdate(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('queue_update', callback);
    }
  }

  onQueuePositionChanges(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('queue_position_changes', callback);
    }
  }

  onConnect(callback: () => void): void {
    if (this.socket) {
      this.socket.on('connect', callback);
    }
  }

  onDisconnect(callback: (reason: unknown) => void): void {
    if (this.socket) {
      this.socket.on('disconnect', callback);
    }
  }

  onError(callback: (error: unknown) => void): void {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  onPong(callback: (data: { timestamp: string }) => void): void {
    if (this.socket) {
      this.socket.on('pong', callback);
    }
  }

  // Remove event listeners
  offJoinedCounter(): void {
    if (this.socket) {
      this.socket.off('joined_counter');
    }
  }

  offLeftCounter(): void {
    if (this.socket) {
      this.socket.off('left_counter');
    }
  }

  offNewTicket(): void {
    if (this.socket) {
      this.socket.off('new_ticket');
    }
  }

  offPatientCalled(): void {
    if (this.socket) {
      this.socket.off('patient_called');
    }
  }

  offNextPatientCalled(): void {
    if (this.socket) {
      this.socket.off('next_patient_called');
    }
  }

  offPatientSkipped(): void {
    if (this.socket) {
      this.socket.off('patient_skipped');
    }
  }

  offPatientPreparing(): void {
    if (this.socket) {
      this.socket.off('patient_preparing');
    }
  }

  offPatientServed(): void {
    if (this.socket) {
      this.socket.off('patient_served');
    }
  }

  offTicketCompleted(): void {
    if (this.socket) {
      this.socket.off('ticket_completed');
    }
  }

  offTicketProcessed(): void {
    if (this.socket) {
      this.socket.off('ticket_processed');
    }
  }

  offTicketStatus(): void {
    if (this.socket) {
      this.socket.off('ticket_status');
    }
  }

  offQueueUpdate(): void {
    if (this.socket) {
      this.socket.off('queue_update');
    }
  }

  offQueuePositionChanges(): void {
    if (this.socket) {
      this.socket.off('queue_position_changes');
    }
  }

  offConnect(callback: () => void): void {
    if (this.socket) {
      this.socket.off('connect', callback);
    }
  }

  offDisconnect(callback: (reason: unknown) => void): void {
    if (this.socket) {
      this.socket.off('disconnect', callback);
    }
  }

  offError(): void {
    if (this.socket) {
      this.socket.off('error');
    }
  }

  offPong(): void {
    if (this.socket) {
      this.socket.off('pong');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentCounterId(): string | null {
    return this.counterId;
  }
}

export const websocketService = new WebSocketService();
