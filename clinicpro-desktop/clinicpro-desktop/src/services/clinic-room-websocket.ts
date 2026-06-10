// WebSocket service for Clinic Room Dashboard

import io from 'socket.io-client';

type SocketInstance = ReturnType<typeof io>;

class ClinicRoomWebSocketService {
  private socket: SocketInstance | null = null;
  private clinicRoomId: string | null = null;
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
        const wsUrl = process.env.WEBSOCKET_URL?.replace('/counters', '/clinic-rooms') || 'ws://localhost:3000/clinic-rooms';
        this.socket = io(wsUrl, {
          transports: ['websocket'],
          timeout: 5000,
        });

        // Auto-enable debug logging
        this.debugEnabled = true;

        this.socket.on('connect', () => {
          console.log('🔌 [CLINIC ROOM WS] Connected:', this.socket?.id);
          if (this.debugEnabled) this.attachDebugListeners();
          // Auto-rejoin room if we had one before reconnect
          if (this.clinicRoomId) {
            console.log('🔄 [CLINIC ROOM WS] Auto-rejoining clinic room:', this.clinicRoomId);
            this.socket?.emit('join_clinic_room', { clinicRoomId: this.clinicRoomId });
          }
          resolve();
        });

        this.socket.on('connect_error', (error: unknown) => {
          console.error('❌ [CLINIC ROOM WS] Connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', (reason: unknown) => {
          console.log('🔌 [CLINIC ROOM WS] Disconnected:', reason);
        });

        // Auto reconnect on disconnect
        this.socket.on('disconnect', () => {
          setTimeout(() => {
            if (!this.socket?.connected) {
              console.log('🔄 [CLINIC ROOM WS] Attempting to reconnect...');
              this.connect().catch((error) => {
                console.error('❌ [CLINIC ROOM WS] Reconnect failed:', error);
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
        console.log(`📡 [CLINIC ROOM WS EVENT] ${name}:`, JSON.stringify(payload, null, 2));
      } catch {
        console.log(`📡 [CLINIC ROOM WS EVENT] ${name}:`, payload);
      }
    };

    this.socket.on('connect', log('connect'));
    this.socket.on('disconnect', log('disconnect'));
    this.socket.on('connect_error', log('connect_error'));
    this.socket.on('error', log('error'));
    this.socket.on('joined_clinic_room', log('joined_clinic_room'));
    this.socket.on('left_clinic_room', log('left_clinic_room'));
    this.socket.on('prescription_service_serving', log('prescription_service_serving'));
    this.socket.on('prescription_service_removed', log('prescription_service_removed'));
    this.socket.on('patient_status_changed', log('patient_status_changed'));
    this.socket.on('new_prescription_patient', log('new_prescription_patient'));
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.clinicRoomId = null;
    }
  }

  joinClinicRoom(clinicRoomId: string): void {
    if (this.socket && this.socket.connected) {
      this.clinicRoomId = clinicRoomId;
      this.socket.emit('join_clinic_room', { clinicRoomId });
      console.log('✅ [CLINIC ROOM WS] Joined clinic room:', clinicRoomId);
      
      // Listen for confirmation
      this.socket.once('joined_clinic_room', (data: { clinicRoomId: string; message: string }) => {
        console.log('✅ [CLINIC ROOM WS] Confirmed joined clinic room:', data);
      });
    } else {
      console.error('❌ [CLINIC ROOM WS] Cannot join - WebSocket not connected');
    }
  }

  leaveClinicRoom(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_clinic_room');
      this.clinicRoomId = null;
      console.log('Left clinic room');
    }
  }

  ping(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ping');
    }
  }

  // Event listeners
  onJoinedClinicRoom(callback: (data: { clinicRoomId: string; message: string }) => void): void {
    if (this.socket) {
      this.socket.on('joined_clinic_room', callback);
    }
  }

  onLeftClinicRoom(callback: (data: { message: string }) => void): void {
    if (this.socket) {
      this.socket.on('left_clinic_room', callback);
    }
  }

  onPrescriptionServiceServing(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('prescription_service_serving', callback);
    }
  }

  onPrescriptionServiceRemoved(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('prescription_service_removed', callback);
    }
  }

  onPatientStatusChanged(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('patient_status_changed', callback);
    }
  }

  onNewPrescriptionPatient(callback: (data: unknown) => void): void {
    if (this.socket) {
      this.socket.on('new_prescription_patient', callback);
    }
  }

  // Remove event listeners
  offJoinedClinicRoom(): void {
    if (this.socket) {
      this.socket.off('joined_clinic_room');
    }
  }

  offLeftClinicRoom(): void {
    if (this.socket) {
      this.socket.off('left_clinic_room');
    }
  }

  offPrescriptionServiceServing(): void {
    if (this.socket) {
      this.socket.off('prescription_service_serving');
    }
  }

  offPrescriptionServiceRemoved(): void {
    if (this.socket) {
      this.socket.off('prescription_service_removed');
    }
  }

  offPatientStatusChanged(): void {
    if (this.socket) {
      this.socket.off('patient_status_changed');
    }
  }

  offNewPrescriptionPatient(): void {
    if (this.socket) {
      this.socket.off('new_prescription_patient');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentClinicRoomId(): string | null {
    return this.clinicRoomId;
  }
}

export const clinicRoomWebSocketService = new ClinicRoomWebSocketService();


