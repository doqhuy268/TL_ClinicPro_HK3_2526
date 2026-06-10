import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { clinicRoomWebSocketService } from '../services/clinic-room-websocket';

interface ClinicDashboardProps {
  onBack: () => void;
}

interface ClinicRoom {
  id: string;
  roomCode: string;
  roomName: string;
  specialty?: {
    id: string;
    name: string;
    specialtyCode: string;
  };
  boothCount?: number;
}

interface PrescriptionService {
  id: string;
  prescriptionId: string;
  prescriptionCode: string;
  serviceId: string;
  serviceName: string;
  status: 'PENDING' | 'PREPARING' | 'SERVING' | 'WAITING' | 'WAITING_RESULT' | 'RETURNING' | 'COMPLETED' | 'CANCELLED' | 'SKIPPED' | 'RESCHEDULED' | 'NOT_STARTED';
  patientProfileId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  technicianId?: string;
  technicianName?: string;
  boothId?: string;
  boothCode?: string;
  boothName?: string;
}

const ClinicDashboard: React.FC<ClinicDashboardProps> = ({ onBack }) => {
  const [clinicRooms, setClinicRooms] = useState<ClinicRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [prescriptionServices, setPrescriptionServices] = useState<PrescriptionService[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Fetch clinic rooms on mount
  useEffect(() => {
    const fetchClinicRooms = async () => {
      setLoadingRooms(true);
      setError(null);
      try {
        const response = await apiService.getClinicRooms(1, 100);
        setClinicRooms(response.data || []);
      } catch (err) {
        console.error('Failed to fetch clinic rooms:', err);
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách phòng khám');
      } finally {
        setLoadingRooms(false);
      }
    };

    void fetchClinicRooms();
  }, []);

  // Fetch prescription services when room is selected
  const fetchPrescriptionServices = useCallback(async (roomId: string) => {
    setLoading(true);
    setError(null);
    try {
      const services = await apiService.getPrescriptionServicesByClinicRoom(roomId);
      setPrescriptionServices(services || []);
    } catch (err) {
      console.error('Failed to fetch prescription services:', err);
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle room selection
  const handleRoomSelect = useCallback(async (roomId: string) => {
    setSelectedRoomId(roomId);
    
    // Disconnect from previous room
    if (clinicRoomWebSocketService.isConnected()) {
      clinicRoomWebSocketService.leaveClinicRoom();
      clinicRoomWebSocketService.disconnect();
    }

    // Fetch initial data
    await fetchPrescriptionServices(roomId);

    // Connect to websocket for this room
    try {
      if (!clinicRoomWebSocketService.isConnected()) {
        await clinicRoomWebSocketService.connect();
      }
      // Wait a bit to ensure socket is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      clinicRoomWebSocketService.joinClinicRoom(roomId);
      setWsConnected(true);
    } catch (err) {
      console.error('Failed to connect websocket:', err);
      setWsConnected(false);
    }
  }, [fetchPrescriptionServices]);

  // Setup websocket listeners
  useEffect(() => {
    if (!selectedRoomId || !clinicRoomWebSocketService.isConnected()) {
      console.log('⚠️ [CLINIC DASHBOARD] Skipping listener setup - no room selected or socket not connected');
      return;
    }

    console.log('✅ [CLINIC DASHBOARD] Setting up WebSocket listeners for room:', selectedRoomId);

    const handlePrescriptionServiceServing = (data: any) => {
      console.log('🔵 [CLINIC DASHBOARD] Prescription service serving:', JSON.stringify(data, null, 2));
      // Refresh the list when a service starts serving
      const currentRoomId = selectedRoomId;
      if (currentRoomId) {
        console.log('🔵 [CLINIC DASHBOARD] Refreshing prescription services after serving event...');
        void fetchPrescriptionServices(currentRoomId);
      }
    };

    const handlePrescriptionServiceRemoved = (data: any) => {
      console.log('🔴 [CLINIC DASHBOARD] Prescription service removed:', JSON.stringify(data, null, 2));
      const currentRoomId = selectedRoomId;
      if (currentRoomId) {
        const prescriptionServiceId = data.data?.prescriptionServiceId;
        if (prescriptionServiceId) {
          // Remove immediately from local state
          setPrescriptionServices((prev) => 
            prev.filter((s) => s.id !== prescriptionServiceId)
          );
          console.log('🔴 [CLINIC DASHBOARD] Removed service from local state:', prescriptionServiceId);
        }
        // Also refresh to ensure sync
        console.log('🔴 [CLINIC DASHBOARD] Refreshing prescription services after removed event...');
        void fetchPrescriptionServices(currentRoomId);
      }
    };

    const handlePatientStatusChanged = (data: any) => {
      console.log('🟢 [CLINIC DASHBOARD] Patient status changed:', JSON.stringify(data, null, 2));
      console.log('🟢 [CLINIC DASHBOARD] Selected room ID:', selectedRoomId);
      console.log('🟢 [CLINIC DASHBOARD] Clinic room IDs in data:', data.data?.clinicRoomIds);
      const currentRoomId = selectedRoomId;
      if (currentRoomId) {
        const clinicRoomIds = data.data?.clinicRoomIds || [];
        const newStatus = data.data?.newStatus;
        const oldStatus = data.data?.oldStatus;
        const prescriptionCode = data.data?.prescriptionCode;
        const serviceIds = data.data?.serviceIds || [];
        
        // If clinicRoomIds is empty or includes our selected room, update
        if (clinicRoomIds.length === 0 || clinicRoomIds.includes(currentRoomId)) {
          // Update local state immediately
          setPrescriptionServices((prev) => {
            return prev.map((service) => {
              // Check if this service matches the prescription code and service ID (if provided)
              const matchesPrescription = service.prescriptionCode === prescriptionCode;
              const matchesServiceId = serviceIds.length === 0 || serviceIds.includes(service.serviceId);
              
              if (matchesPrescription && matchesServiceId) {
                // If status changed from SERVING to something else, remove it immediately
                if (oldStatus === 'SERVING' && newStatus !== 'SERVING' && service.status === 'SERVING') {
                  console.log('🟢 [CLINIC DASHBOARD] Removing service from SERVING column:', service.id, oldStatus, '->', newStatus);
                  return null; // Mark for removal
                }
                
                // Update status if it matches the old status
                if (service.status === oldStatus) {
                  console.log('🟢 [CLINIC DASHBOARD] Updating service status:', service.id, oldStatus, '->', newStatus);
                  return { ...service, status: newStatus as PrescriptionService['status'] };
                }
              }
              return service;
            }).filter((s): s is PrescriptionService => s !== null);
          });
          
          // Also refresh to ensure sync with server
          console.log('🟢 [CLINIC DASHBOARD] Refreshing prescription services after status change...');
          void fetchPrescriptionServices(currentRoomId);
        } else {
          console.log('🟢 [CLINIC DASHBOARD] Status change not for this room, skipping refresh');
        }
      }
    };

    const handleNewPrescriptionPatient = (data: any) => {
      console.log('🟡 [CLINIC DASHBOARD] New prescription patient:', JSON.stringify(data, null, 2));
      console.log('🟡 [CLINIC DASHBOARD] Selected room ID:', selectedRoomId);
      console.log('🟡 [CLINIC DASHBOARD] Clinic room IDs in data:', data.data?.clinicRoomIds);
      // Refresh the list when a new patient arrives
      const currentRoomId = selectedRoomId;
      if (currentRoomId) {
        // If clinicRoomIds is empty or includes our selected room, refresh
        const clinicRoomIds = data.data?.clinicRoomIds || [];
        if (clinicRoomIds.length === 0 || clinicRoomIds.includes(currentRoomId)) {
          console.log('🟡 [CLINIC DASHBOARD] Refreshing prescription services after new patient...');
          void fetchPrescriptionServices(currentRoomId);
        } else {
          console.log('🟡 [CLINIC DASHBOARD] New patient not for this room, skipping refresh');
        }
      }
    };

    // Register listeners
    clinicRoomWebSocketService.onPrescriptionServiceServing(handlePrescriptionServiceServing);
    clinicRoomWebSocketService.onPrescriptionServiceRemoved(handlePrescriptionServiceRemoved);
    clinicRoomWebSocketService.onPatientStatusChanged(handlePatientStatusChanged);
    clinicRoomWebSocketService.onNewPrescriptionPatient(handleNewPrescriptionPatient);

    console.log('✅ [CLINIC DASHBOARD] WebSocket listeners registered');

    return () => {
      console.log('🧹 [CLINIC DASHBOARD] Cleaning up WebSocket listeners');
      clinicRoomWebSocketService.offPrescriptionServiceServing();
      clinicRoomWebSocketService.offPrescriptionServiceRemoved();
      clinicRoomWebSocketService.offPatientStatusChanged();
      clinicRoomWebSocketService.offNewPrescriptionPatient();
    };
  }, [selectedRoomId, fetchPrescriptionServices, wsConnected]);

  // Monitor socket connection status
  useEffect(() => {
    if (!selectedRoomId) return;

    const checkConnection = () => {
      const isConnected = clinicRoomWebSocketService.isConnected();
      setWsConnected(isConnected);
      
      if (!isConnected && selectedRoomId) {
        console.log('⚠️ [CLINIC DASHBOARD] Socket disconnected, attempting to reconnect...');
        clinicRoomWebSocketService.connect()
          .then(() => {
            clinicRoomWebSocketService.joinClinicRoom(selectedRoomId);
            setWsConnected(true);
          })
          .catch((err) => {
            console.error('❌ [CLINIC DASHBOARD] Reconnection failed:', err);
            setWsConnected(false);
          });
      }
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 2000);
    checkConnection(); // Initial check

    return () => {
      clearInterval(interval);
    };
  }, [selectedRoomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clinicRoomWebSocketService.isConnected()) {
        clinicRoomWebSocketService.leaveClinicRoom();
        clinicRoomWebSocketService.disconnect();
      }
    };
  }, []);

  // Group services by status
  // "Đang phục vụ" = SERVING
  const servingServices = prescriptionServices.filter((s) => s.status === 'SERVING');
  // "Chuẩn bị phục vụ" = PREPARING
  const preparingServices = prescriptionServices.filter((s) => s.status === 'PREPARING');
  // "Chờ vào phục vụ" = RETURNING hoặc WAITING
  const waitingServices = prescriptionServices.filter(
    (s) => s.status === 'RETURNING' || s.status === 'WAITING'
  );

  const selectedRoom = clinicRooms.find((r) => r.id === selectedRoomId);
  
  // Count unique booths in the current prescription services
  const uniqueBoothIds = new Set(
    prescriptionServices
      .map((s) => s.boothId)
      .filter((id): id is string => Boolean(id))
  );
  const shouldShowBooth = uniqueBoothIds.size > 1;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6 mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Phòng Khám Dashboard
              </h1>
              <p className="text-xl text-gray-600">
                Quản lý bệnh nhân trong phòng khám
              </p>
            </div>
            <button
              onClick={onBack}
              className="border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
            >
              ← Quay lại
            </button>
          </div>

          {/* Room Selection */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn phòng khám:
            </label>
            <select
              value={selectedRoomId || ''}
              onChange={(e) => {
                if (e.target.value) {
                  void handleRoomSelect(e.target.value);
                } else {
                  setSelectedRoomId(null);
                  setPrescriptionServices([]);
                }
              }}
              disabled={loadingRooms}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Chọn phòng khám --</option>
              {clinicRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.roomName} ({room.roomCode})
                  {room.specialty && ` - ${room.specialty.name}`}
                </option>
              ))}
            </select>
            {selectedRoom && (
              <div className="mt-2 text-sm text-gray-600">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {wsConnected ? 'Đã kết nối WebSocket' : 'Chưa kết nối WebSocket'}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Main Content */}
        {selectedRoomId && !loading && (
          <div className="grid grid-cols-3 gap-6">
            {/* Đang phục vụ (SERVING) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Đang phục vụ
                </h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                  {servingServices.length}
                </span>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {servingServices.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Không có bệnh nhân nào</p>
                ) : (
                  servingServices.map((service) => (
                    <div
                      key={service.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{service.patientName}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                          SERVING
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        {service.doctorName && (
                          <p className="text-gray-700">
                            <span className="font-medium">Bác sĩ:</span> {service.doctorName}
                          </p>
                        )}
                        {service.technicianName && (
                          <p className="text-gray-700">
                            <span className="font-medium">Kỹ thuật viên:</span> {service.technicianName}
                          </p>
                        )}
                        {shouldShowBooth && service.boothName && (
                          <p className="text-gray-600 text-xs">
                            Buồng: {service.boothName} ({service.boothCode})
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chuẩn bị phục vụ (PREPARING) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Chuẩn bị phục vụ
                </h2>
                <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">
                  {preparingServices.length}
                </span>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {preparingServices.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Không có bệnh nhân nào</p>
                ) : (
                  preparingServices.map((service) => (
                    <div
                      key={service.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{service.patientName}</p>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                          PREPARING
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        {service.doctorName && (
                          <p className="text-gray-700">
                            <span className="font-medium">Bác sĩ:</span> {service.doctorName}
                          </p>
                        )}
                        {service.technicianName && (
                          <p className="text-gray-700">
                            <span className="font-medium">Kỹ thuật viên:</span> {service.technicianName}
                          </p>
                        )}
                        {shouldShowBooth && service.boothName && (
                          <p className="text-gray-600 text-xs">
                            Buồng: {service.boothName} ({service.boothCode})
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chờ vào phục vụ */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Chờ vào phục vụ
                </h2>
                <span className="bg-gray-100 text-gray-800 text-sm font-semibold px-3 py-1 rounded-full">
                  {waitingServices.length}
                </span>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {waitingServices.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Không có bệnh nhân nào</p>
                ) : (
                  waitingServices.map((service) => (
                    <div
                      key={service.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{service.patientName}</p>
                        </div>
                        <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded">
                          {service.status === 'WAITING' ? 'WAITING' : 'RETURNING'}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        {service.doctorName && (
                          <p className="text-gray-700">
                            <span className="font-medium">Bác sĩ:</span> {service.doctorName}
                          </p>
                        )}
                        {service.technicianName && (
                          <p className="text-gray-700">
                            <span className="font-medium">Kỹ thuật viên:</span> {service.technicianName}
                          </p>
                        )}
                        {shouldShowBooth && service.boothName && (
                          <p className="text-gray-600 text-xs">
                            Buồng: {service.boothName} ({service.boothCode})
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* No Room Selected */}
        {!selectedRoomId && !loading && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-xl text-gray-600">
              Vui lòng chọn phòng khám để xem danh sách bệnh nhân
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicDashboard;
