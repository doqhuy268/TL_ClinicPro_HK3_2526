import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Counter,
  QueueSnapshot,
  QueueTicketSnapshot,
  TicketStatus,
} from '../types';
import { apiService } from '../services/api';
import { websocketService } from '../services/websocket';

type Badge = {
  label: string;
  className: string;
};

const pickString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

const toRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return undefined;
};

interface QueueTableSectionProps {
  title: string;
  tickets: QueueTicketSnapshot[];
  orderMap: Map<string, number>;
  emptyMessage: string;
  showOrder?: boolean;
}

interface CounterDashboardProps {
  counter: Counter;
  onBack: () => void;
}

const statusLabels: Record<TicketStatus, string> = {
  WAITING: 'Đang chờ',
  NEXT: 'Sắp gọi',
  SERVING: 'Đang phục vụ',
  SKIPPED: 'Đã bỏ qua',
  COMPLETED: 'Hoàn tất',
};

const rowHighlightClass = (status: TicketStatus) => {
  switch (status) {
    case 'SERVING':
      return 'bg-green-50';
    case 'NEXT':
      return 'bg-blue-50';
    case 'SKIPPED':
      return 'bg-amber-50';
    default:
      return '';
  }
};

const extractAppointmentCode = (ticket: QueueTicketSnapshot): string | undefined => {
  const direct = pickString(ticket.appointmentCode);
  if (direct) {
    return direct;
  }

  const metadata = (ticket.metadata ?? {}) as Record<string, unknown>;
  const metadataCandidates = [
    pickString(metadata['appointmentCode']),
    pickString(metadata['appointment_code']),
    pickString(metadata['scheduleCode']),
    pickString(metadata['schedule_code']),
    pickString(metadata['appointmentRef']),
    pickString(metadata['appointmentId']),
  ];

  for (const candidate of metadataCandidates) {
    if (candidate) {
      return candidate;
    }
  }

  const appointment = toRecord(metadata['appointment']);
  if (appointment) {
    const nested = pickString(appointment['code']);
    if (nested) {
      return nested;
    }
  }

  const appointmentDetails = toRecord(metadata['appointmentDetails']);
  if (appointmentDetails) {
    const viaDetails = pickString(appointmentDetails['code']) ?? pickString(appointmentDetails['reference']);
    if (viaDetails) {
      return viaDetails;
    }
  }

  return undefined;
};

const hasAppointmentReference = (ticket: QueueTicketSnapshot): boolean => {
  const metadata = (ticket.metadata ?? {}) as Record<string, unknown>;
  if (metadata['hasAppointment'] === true) {
    return true;
  }

  const appointmentCode = extractAppointmentCode(ticket);
  if (appointmentCode) {
    return true;
  }

  return false;
};

const isChildFlag = (ticket: QueueTicketSnapshot): boolean => {
  if ((ticket as any).isChild === true) {
    return true;
  }
  const md = toRecord(ticket.metadata) ?? {};
  if (md['isChild'] === true || md['is_child'] === true || md['child'] === true) {
    return true;
  }
  return false;
};

const isPriorityTicket = (ticket: QueueTicketSnapshot): boolean => {
  if (ticket.isPregnant || ticket.isDisabled) {
    return true;
  }

  if (isChildFlag(ticket)) {
    return true;
  }

  if (typeof ticket.isElderly === 'boolean') {
    return ticket.isElderly;
  }

  if (typeof ticket.patientAge === 'number') {
    return ticket.patientAge >= 75;
  }

  return false;
};

const isScheduledTicket = (ticket: QueueTicketSnapshot): boolean => {
  if (!ticket.isOnTime) {
    return false;
  }

  return hasAppointmentReference(ticket);
};

const buildBadges = (ticket: QueueTicketSnapshot): Badge[] => {
  const badges: Badge[] = [];

  if (ticket.status === 'NEXT') {
    badges.push({ label: 'Sắp gọi', className: 'bg-blue-100 text-blue-700' });
  }

  if (ticket.isOnTime) {
    badges.push({ label: 'Đúng giờ', className: 'bg-green-100 text-green-700' });
  }

  if (ticket.isPregnant) {
    badges.push({ label: 'Mang thai', className: 'bg-pink-100 text-pink-700' });
  }

  if (ticket.isDisabled) {
    badges.push({ label: 'Khuyết tật', className: 'bg-purple-100 text-purple-700' });
  }

  if (ticket.isElderly) {
    badges.push({ label: 'Cao tuổi', className: 'bg-gray-200 text-gray-800' });
  }

  if (ticket.isVIP) {
    badges.push({ label: 'VIP', className: 'bg-yellow-100 text-yellow-700' });
  }

  if (ticket.isEmergency) {
    badges.push({ label: 'Cấp cứu', className: 'bg-red-100 text-red-700' });
  }

  if (isChildFlag(ticket)) {
    badges.push({ label: 'Trẻ em', className: 'bg-indigo-100 text-indigo-700' });
  }

  if (ticket.callCount > 0) {
    badges.push({ label: `Gọi ${ticket.callCount}`, className: 'bg-gray-100 text-gray-700' });
  }

  return badges;
};

const QueueTableSection: React.FC<QueueTableSectionProps> = ({
  title,
  tickets,
  orderMap,
  emptyMessage,
  showOrder = true,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
          {tickets.length} {tickets.length === 1 ? 'bệnh nhân' : 'bệnh nhân'}
        </span>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {tickets.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {showOrder && (
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                    #
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                  Mã số
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                  Họ tên
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                  Tuổi
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {tickets.map((ticket) => {
                const order = orderMap.get(ticket.ticketId);
                const badges = buildBadges(ticket);
                return (
                  <tr 
                    key={ticket.ticketId} 
                    className={`transition-colors hover:bg-gray-50 ${rowHighlightClass(ticket.status)}`}
                  >
                    {showOrder && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold bg-gray-100 text-gray-700">
                          {order !== undefined ? order : '--'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900 font-mono">{ticket.queueNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{ticket.patientName}</span>
                        {ticket.metadata && (ticket.metadata as any).patientProfileCode && (
                          <div className="text-xs text-blue-600 mt-0.5">HS: {(ticket.metadata as any).patientProfileCode}</div>
                        )}
                        {ticket.metadata && (ticket.metadata as any).appointmentCode && (
                          <div className="text-xs text-green-600 mt-0.5">Hẹn: {(ticket.metadata as any).appointmentCode}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {typeof ticket.patientAge === 'number' ? `${ticket.patientAge} tuổi` : '--'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        ticket.status === 'SERVING' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'NEXT' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'SKIPPED' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {statusLabels[ticket.status] || ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {badges.length === 0 ? (
                          <span className="text-xs text-gray-400">--</span>
                        ) : (
                          badges.map((badge, badgeIndex) => (
                            <span
                              key={`${ticket.ticketId}-${badge.label}-${badgeIndex}`}
                              className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const CounterDashboard: React.FC<CounterDashboardProps> = ({ counter, onBack }) => {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchQueueSnapshot = useCallback(
    async (options?: { silent?: boolean; showSpinner?: boolean }) => {
      const silent = options?.silent ?? false;
      const showSpinner = options?.showSpinner ?? false;

      if (silent) {
        if (showSpinner) {
          setIsRefreshing(true);
        }
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const data = await apiService.getQueueSnapshot(counter.counterId);
        setSnapshot(data);
        setLastUpdated(new Date().toISOString());
        if (!silent) {
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch queue snapshot:', err);
        if (!silent) {
          setError('Không thể tải dữ liệu hàng đợi. Vui lòng thử lại.');
        }
      } finally {
        if (silent) {
          if (showSpinner) {
            setIsRefreshing(false);
          }
        } else {
          setLoading(false);
        }
      }
    },
    [counter.counterId]
  );

  useEffect(() => {
    let isSubscribed = true;
    setWsConnected(false);

    const handleRealtimeUpdate = () => {
      if (isSubscribed) {
        void fetchQueueSnapshot({ silent: true });
      }
    };

    const handleNewTicket = (payload: unknown) => {
      try {
        const obj = (payload || {}) as any;
        const ticket = obj?.data ?? obj; // some servers wrap under data
        if (ticket && (ticket.ticketId || ticket.queueNumber)) {
          console.log('[WS] new_ticket received:', ticket);
        } else {
          console.log('[WS] new_ticket payload:', obj);
        }
      } catch {
        console.log('[WS] new_ticket payload (raw)');
      }
      handleRealtimeUpdate();
    };

    const handleQueuePositionChanges = (payload: unknown) => {
      try {
        const obj = (payload || {}) as any;
        const changes = obj?.changes ?? obj;
        const summary = {
          type: obj?.type,
          currentServing: changes?.currentServing,
          currentNext: changes?.currentNext,
          newCount: Array.isArray(changes?.newPatients) ? changes.newPatients.length : undefined,
          movedCount: Array.isArray(changes?.movedPatients) ? changes.movedPatients.length : undefined,
          removedCount: Array.isArray(changes?.removedPatients) ? changes.removedPatients.length : undefined,
        };
        console.log('[WS] queue_position_changes:', summary);
      } catch {
        console.log('[WS] queue_position_changes payload (raw)');
      }
      handleRealtimeUpdate();
    };

    const handleQueueUpdate = (payload: unknown) => {
      try {
        const obj = (payload || {}) as any;
        const counts = {
          hasCurrent: !!obj?.current,
          queueLength: Array.isArray(obj?.queue) ? obj.queue.length : undefined,
          orderedLength: Array.isArray(obj?.ordered) ? obj.ordered.length : undefined,
        };
        console.log('[WS] queue_update:', counts);
      } catch {
        console.log('[WS] queue_update payload (raw)');
      }
      handleRealtimeUpdate();
    };

    const handleConnect = () => {
      if (!isSubscribed) {
        return;
      }
      websocketService.offQueueUpdate();
      websocketService.offQueuePositionChanges();
      websocketService.offNewTicket();
      websocketService.joinCounter(counter.counterId);
      websocketService.onQueueUpdate(handleQueueUpdate);
      websocketService.onQueuePositionChanges(handleQueuePositionChanges);
      websocketService.onNewTicket(handleNewTicket);
      setWsConnected(true);
    };

    const handleDisconnect = () => {
      if (!isSubscribed) {
        return;
      }
      setWsConnected(false);
    };

    void fetchQueueSnapshot();

    const connectAndSubscribe = async () => {
      try {
        if (!websocketService.isConnected()) {
          await websocketService.connect();
        }

        websocketService.onConnect(handleConnect);
        websocketService.onDisconnect(handleDisconnect);

        if (websocketService.isConnected()) {
          handleConnect();
        }
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        setWsConnected(false);
      }
    };

    connectAndSubscribe();

    return () => {
      isSubscribed = false;
      websocketService.offQueueUpdate();
      websocketService.offQueuePositionChanges();
      websocketService.offNewTicket();
      websocketService.offConnect(handleConnect);
      websocketService.offDisconnect(handleDisconnect);
      websocketService.leaveCounter();
    };
  }, [counter.counterId, fetchQueueSnapshot]);

  const orderMap = useMemo(() => {
    const map = new Map<string, number>();
    if (snapshot?.ordered) {
      snapshot.ordered.forEach((ticket, index) => {
        map.set(ticket.ticketId, index + 1);
      });
    }
    return map;
  }, [snapshot]);

  const categorized = useMemo(() => {
    const priority: QueueTicketSnapshot[] = [];
    const scheduled: QueueTicketSnapshot[] = [];
    const waiting: QueueTicketSnapshot[] = [];

    if (snapshot?.ordered) {
      snapshot.ordered.forEach((ticket) => {
        if (ticket.status === 'SERVING') {
          return;
        }

        if (isPriorityTicket(ticket)) {
          priority.push(ticket);
          return;
        }

        if (isScheduledTicket(ticket)) {
          scheduled.push(ticket);
          return;
        }

        waiting.push(ticket);
      });
    }

    return { priority, scheduled, waiting };
  }, [snapshot]);

  const currentList = useMemo(() => {
    if (snapshot?.current) {
      return [snapshot.current];
    }
    return [];
  }, [snapshot]);

  const handleManualRefresh = () => {
    void fetchQueueSnapshot({ silent: true, showSpinner: true });
  };

  const formatUpdatedAt = useMemo(() => {
    if (!lastUpdated) {
      return null;
    }

    try {
      const date = new Date(lastUpdated);
      return date.toLocaleString();
    } catch {
      return lastUpdated;
    }
  }, [lastUpdated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đang tải dữ liệu hàng đợi...</h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Không thể tải dữ liệu</h2>
          <p className="text-gray-600">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => fetchQueueSnapshot({ silent: false })}
              className="w-full bg-gray-900 text-white px-6 py-3 font-bold rounded-lg hover:bg-gray-800 transition-all shadow-lg"
            >
              Thử lại
            </button>
            <button
              onClick={onBack}
              className="w-full border-2 border-gray-300 px-6 py-3 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6 flex-shrink-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <button
                  onClick={onBack}
                  className="mb-2 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Quay lại danh sách quầy
                </button>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{counter.counterName}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-semibold">{counter.counterCode}</span>
                  <span>·</span>
                  <span>{counter.location}</span>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  wsConnected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <span className={`inline-flex h-2 w-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>{wsConnected ? 'Realtime đang hoạt động' : 'Realtime tạm ngắt'}</span>
                </div>
                {formatUpdatedAt && (
                  <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    Cập nhật: <span className="font-medium">{formatUpdatedAt}</span>
                  </div>
                )}
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className={`inline-flex items-center gap-2 border-2 border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 rounded-lg transition-all ${
                    isRefreshing 
                      ? 'cursor-not-allowed opacity-70' 
                      : 'hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                  }`}
                >
                  {isRefreshing ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Làm mới
                </button>
              </div>
            </div>
          </div>

          {/* Tables Grid - Takes remaining space */}
          <div className="flex-1 grid gap-4 lg:grid-cols-2 min-h-0 overflow-hidden">
            {/* Left column - 50% width */}
            <div className="grid grid-rows-[3fr_7fr] gap-4 h-full min-h-0">
              {/* Đang phục vụ - 30% height */}
              <div className="min-h-0 overflow-hidden">
                <QueueTableSection
                  title="Đang phục vụ"
                  tickets={currentList}
                  orderMap={orderMap}
                  emptyMessage="Chưa có bệnh nhân nào đang phục vụ"
                  showOrder={false}
                />
              </div>

              {/* Danh sách chờ - 70% height */}
              <div className="min-h-0 overflow-hidden">
                <QueueTableSection
                  title="Danh sách chờ"
                  tickets={categorized.waiting}
                  orderMap={orderMap}
                  emptyMessage="Không có bệnh nhân trong danh sách chờ"
                />
              </div>
            </div>

            {/* Right column - 50% width */}
            <div className="grid grid-rows-[3fr_7fr] gap-4 h-full min-h-0">
              {/* Ưu tiên - 30% height */}
              <div className="min-h-0 overflow-hidden">
                <QueueTableSection
                  title="Ưu tiên"
                  tickets={categorized.priority}
                  orderMap={orderMap}
                  emptyMessage="Không có bệnh nhân ưu tiên"
                />
              </div>

              {/* Hẹn trước - 70% height */}
              <div className="min-h-0 overflow-hidden">
                <QueueTableSection
                  title="Hẹn trước"
                  tickets={categorized.scheduled}
                  orderMap={orderMap}
                  emptyMessage="Không có bệnh nhân hẹn trước đúng giờ"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterDashboard;
