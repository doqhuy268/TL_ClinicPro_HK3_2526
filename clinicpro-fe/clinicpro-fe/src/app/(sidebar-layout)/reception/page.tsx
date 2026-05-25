/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  UserCheck,
  ListOrdered,
  RefreshCw,
  AlertTriangle,
  Clock,
  User,
  Play,
  SkipForward,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  ClipboardList,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { QuickProfileDialog } from '@/components/patient/QuickProfileDialog';

type QueueStatus = 'WAITING' | 'NEXT' | 'SERVING' | 'SKIPPED' | 'COMPLETED' | 'REMOVED';

type QueueTicket = {
  ticketId: string;
  patientName: string;
  patientAge: number;
  patientGender?: string;
  queueNumber: string;
  status: QueueStatus;
  callCount: number;
  queuePriority?: number | null;
  assignedAt?: string | null;
  counterId?: string | null;
  counterCode?: string;
  counterName?: string;
  isOnTime: boolean;
  isPregnant: boolean;
  isDisabled: boolean;
  isElderly: boolean;
  metadata?: Record<string, unknown> | null;
};

type QueueSnapshot = {
  counterId: string;
  current: QueueTicket | null;
  next: QueueTicket | null;
  queue: QueueTicket[];
  ordered: QueueTicket[];
};

type CounterSummary = {
  counterId: string;
  counterCode: string;
  counterName: string;
  location?: string;
  status?: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  assignedReceptionist?: {
    id: string;
    name: string;
  } | null;
};

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
  typeof value === 'object' && value !== null;

const pickValue = (source: PlainObject, keys: string[]): unknown => {
  for (const key of keys) {
    if (key in source) {
      const value = source[key];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }
  return undefined;
};

const toMaybeString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
};

const toMaybeNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const toBooleanFlag = (value: unknown): boolean => {
  if (value === true) return true;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
};

const toMetadata = (value: unknown): Record<string, unknown> | null =>
  isPlainObject(value) ? value : null;

const DEFAULT_HTTP_HOST = 'http://localhost:3000';

const trimTrailingSlash = (value: string) => (value.endsWith('/') ? value.slice(0, -1) : value);

const API_BASE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_HTTP_HOST}/api`
);

// Remove duplicate API_BASE_URL definition if exists

const SOCKET_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_QUEUE_SOCKET_URL || `${DEFAULT_HTTP_HOST}/counters`
);

const KNOWN_STATUSES: QueueStatus[] = ['WAITING', 'NEXT', 'SERVING', 'SKIPPED', 'COMPLETED', 'REMOVED'];

const normalizeStatus = (status: unknown): QueueStatus => {
  const fallback: QueueStatus = 'WAITING';
  if (!status) return fallback;
  const candidate = String(status).toUpperCase() as QueueStatus;
  return KNOWN_STATUSES.includes(candidate) ? candidate : fallback;
};

const normalizeCounter = (raw: unknown): CounterSummary | null => {
  if (!isPlainObject(raw)) return null;
  const counterIdRaw = pickValue(raw, ['counterId', 'id', 'counter_id', 'uuid']);
  if (counterIdRaw === undefined || counterIdRaw === null) return null;

  // Extract assigned receptionist information
  const assignedReceptionistRaw = pickValue(raw, ['assignedReceptionist', 'currentAssignment', 'assigned_receptionist']);
  let assignedReceptionist = null;
  
  if (assignedReceptionistRaw && isPlainObject(assignedReceptionistRaw)) {
    const receptionistId = toMaybeString(pickValue(assignedReceptionistRaw, ['id', 'receptionistId', 'receptionist_id']));
    const receptionistName = toMaybeString(pickValue(assignedReceptionistRaw, ['name', 'receptionistName', 'receptionist_name']));
    
    if (receptionistId && receptionistName) {
      assignedReceptionist = {
        id: receptionistId,
        name: receptionistName
      };
    }
  }

  // Determine status based on assigned receptionist
  const status = assignedReceptionist ? 'BUSY' : 'AVAILABLE';

  return {
    counterId: String(counterIdRaw),
    counterCode: toMaybeString(pickValue(raw, ['counterCode', 'code', 'counter_code'])) ?? 'N/A',
    counterName:
      toMaybeString(pickValue(raw, ['counterName', 'name', 'counter_code'])) ?? 'Không rõ tên',
    location: toMaybeString(pickValue(raw, ['location', 'floor', 'tầng'])) ?? undefined,
    status: toMaybeString(pickValue(raw, ['status'])) as 'AVAILABLE' | 'BUSY' | 'OFFLINE' | undefined ?? status,
    assignedReceptionist,
  };
};

const normalizeTicket = (
  ticket: unknown,
  fallback: Partial<CounterSummary> = {}
): QueueTicket | null => {
  if (!isPlainObject(ticket)) return null;
  const ticketIdRaw = pickValue(ticket, ['ticketId', 'id']);
  if (ticketIdRaw === undefined || ticketIdRaw === null) return null;

  const queuePriorityRaw = pickValue(ticket, [
    'queuePriority',
    'priority',
    'queue_priority',
    'priorityScore',
  ]);

  return {
    ticketId: String(ticketIdRaw),
    patientName: toMaybeString(pickValue(ticket, ['patientName', 'name'])) ?? 'Không rõ tên',
    patientAge: toMaybeNumber(pickValue(ticket, ['patientAge', 'age'])) ?? 0,
    patientGender: toMaybeString(pickValue(ticket, ['patientGender', 'gender'])) ?? 'UNKNOWN',
    queueNumber: toMaybeString(pickValue(ticket, ['queueNumber', 'number'])) ?? '',
    status: normalizeStatus(pickValue(ticket, ['status'])),
    callCount: toMaybeNumber(pickValue(ticket, ['callCount', 'calls'])) ?? 0,
    queuePriority:
      queuePriorityRaw !== undefined && queuePriorityRaw !== null
        ? toMaybeNumber(queuePriorityRaw) ?? null
        : null,
    assignedAt: toMaybeString(pickValue(ticket, ['assignedAt', 'updatedAt', 'calledAt'])) ?? null,
    counterId: toMaybeString(pickValue(ticket, ['counterId'])) ?? fallback.counterId ?? null,
    counterCode: toMaybeString(pickValue(ticket, ['counterCode'])) ?? fallback.counterCode,
    counterName: toMaybeString(pickValue(ticket, ['counterName'])) ?? fallback.counterName,
    isOnTime: toBooleanFlag(pickValue(ticket, ['isOnTime'])),
    isPregnant: toBooleanFlag(pickValue(ticket, ['isPregnant'])),
    isDisabled: toBooleanFlag(pickValue(ticket, ['isDisabled'])),
    isElderly: toBooleanFlag(pickValue(ticket, ['isElderly'])),
    metadata: toMetadata(pickValue(ticket, ['metadata'])),
  };
};

const buildOrderedList = (
  current: QueueTicket | null,
  next: QueueTicket | null,
  queue: QueueTicket[]
): QueueTicket[] => {
  const result: QueueTicket[] = [];
  const seen = new Set<string>();

  if (current) {
    result.push(current);
    seen.add(current.ticketId);
  }

  if (next && !seen.has(next.ticketId)) {
    result.push(next);
    seen.add(next.ticketId);
  }

  queue.forEach((ticket) => {
    if (!seen.has(ticket.ticketId)) {
      result.push(ticket);
      seen.add(ticket.ticketId);
    }
  });

  return result;
};

const normalizeQueueSnapshot = (raw: unknown, fallbackCounterId: string): QueueSnapshot => {
  const record = isPlainObject(raw) ? raw : {};
  const statusRecord = isPlainObject(record['status']) ? (record['status'] as PlainObject) : undefined;

  const counterMeta: Partial<CounterSummary> = {
    counterId:
      toMaybeString(pickValue(record, ['counterId', 'counter_id', 'id', 'uuid'])) ?? fallbackCounterId,
    counterCode: toMaybeString(pickValue(record, ['counterCode', 'code', 'counter_code'])),
    counterName: toMaybeString(pickValue(record, ['counterName', 'name', 'counter_code'])),
  };

  const currentRaw =
    pickValue(record, ['current']) ?? (statusRecord ? pickValue(statusRecord, ['current']) : undefined);
  const nextRaw =
    pickValue(record, ['next']) ??
    (statusRecord ? pickValue(statusRecord, ['next', 'currentNext', 'nextPatient']) : undefined);

  const recordQueue = pickValue(record, ['queue']);
  const queueSource: unknown[] = Array.isArray(recordQueue)
    ? recordQueue
    : statusRecord
    ? (() => {
        const statusQueue = pickValue(statusRecord, ['queue']);
        return Array.isArray(statusQueue) ? statusQueue : [];
      })()
    : [];

  const orderedRaw = pickValue(record, ['ordered']);

  const current = normalizeTicket(currentRaw, counterMeta);
  const next = normalizeTicket(nextRaw, counterMeta);
  const queue = queueSource
    .map((item) => normalizeTicket(item, counterMeta))
    .filter((item): item is QueueTicket => Boolean(item));

  const ordered = Array.isArray(orderedRaw)
    ? (orderedRaw as unknown[])
        .map((item) => normalizeTicket(item, counterMeta))
        .filter((item): item is QueueTicket => Boolean(item))
    : buildOrderedList(current, next, queue);

  return {
    counterId: String(counterMeta.counterId ?? fallbackCounterId),
    current: current ?? null,
    next: next ?? null,
    queue,
    ordered,
  };
};

const fetchQueueSnapshotFromApi = async (counterId: string): Promise<QueueSnapshot> => {
  const url = `${API_BASE_URL}/counter-assignment/queue/${counterId}`;
  
  // Get auth token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const options = {
    credentials: 'include' as RequestCredentials,
    cache: 'no-store' as RequestCache,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const response = await fetch(url, options);

  if (response.status === 204) {
    return {
      counterId,
      current: null,
      next: null,
      queue: [],
      ordered: [],
    };
  }

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = isPlainObject(data) && typeof data.message === 'string' ? data.message : null;
    throw new Error(message || 'Không thể tải thông tin hàng chờ');
  }

  return normalizeQueueSnapshot(data, counterId);
};

const fetchCountersFromApi = async (): Promise<CounterSummary[]> => {
  const url = `${API_BASE_URL}/counter-assignment/counters`;
  
  // Get auth token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const options = {
    credentials: 'include' as RequestCredentials,
    cache: 'no-store' as RequestCache,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const response = await fetch(url, options);

  if (response.status === 204) {
    return [];
  }

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = isPlainObject(data) && typeof data.message === 'string' ? data.message : null;
    throw new Error(message || 'Không thể tải danh sách quầy');
  }

  const countersRaw: unknown[] = Array.isArray(data)
    ? data
    : isPlainObject(data) && Array.isArray((data as PlainObject)['counters'])
    ? ((data as PlainObject)['counters'] as unknown[])
    : [];

  return countersRaw
    .map((item) => normalizeCounter(item))
    .filter((item): item is CounterSummary => Boolean(item));
};

// Removed unused function: assignCounterApi

const openCounterApi = async (counterId: string, notes?: string, isVip?: boolean): Promise<{ success: boolean; message?: string }> => {
  const url = `${API_BASE_URL}/receptionists/counters/open`;
  const body = {
    counterId,
    notes: notes || undefined,
    isVip: isVip ?? false,
  };

  // Get auth token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: 'include' as RequestCredentials,
    body: JSON.stringify(body),
  };

  const response = await fetch(url, options);

  const data: unknown = await response.json().catch(() => ({}));

  const successFlag =
    (typeof data === 'object' && data !== null && 'success' in data && (data as any).success) ||
    response.ok;

  if (!successFlag) {
    const message = isPlainObject(data) && typeof data.message === 'string' ? data.message : null;
    throw new Error(message || 'Không thể mở quầy');
  }

  return {
    success: true,
    message: isPlainObject(data) && typeof data.message === 'string' ? data.message : 'Đã mở quầy thành công',
  };
};

const checkoutCounterApi = async (counterId: string): Promise<{ success: boolean; message?: string }> => {
  const url = `${API_BASE_URL}/counter-assignment/checkout`;
  const body = {
    counterId,
  };

  // Get auth token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: 'include' as RequestCredentials,
    body: JSON.stringify(body),
  };

  const response = await fetch(url, options);

  const data: unknown = await response.json().catch(() => ({}));

  const successFlag =
    (typeof data === 'object' && data !== null && 'success' in data && (data as any).success) ||
    response.ok;

  if (!successFlag) {
    const message = isPlainObject(data) && typeof data.message === 'string' ? data.message : null;
    throw new Error(message || 'Không thể checkout counter');
  }

  return {
    success: true,
    message: isPlainObject(data) && typeof data.message === 'string' ? data.message : 'Đã checkout counter thành công',
  };
};

const statusBadgeClass = (status: QueueStatus) => {
  switch (status) {
    case 'SERVING':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'NEXT':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'SKIPPED':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'COMPLETED':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'REMOVED':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'WAITING':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatTime = (iso?: string | null) => {
  if (!iso) return '--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ReceptionPage() {
  const [counters, setCounters] = useState<CounterSummary[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);



  const [loadingCounters, setLoadingCounters] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [assignNotes, setAssignNotes] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showCreatePrescriptionDialog, setShowCreatePrescriptionDialog] = useState(false);
  const [prescriptionAppointmentCode, setPrescriptionAppointmentCode] = useState('');
  const [prescriptionPatientProfileCode, setPrescriptionPatientProfileCode] = useState('');
  const [creatingPrescription, setCreatingPrescription] = useState(false);
  const [creatingPrescriptionForTicket, setCreatingPrescriptionForTicket] = useState<string | null>(null);

  const [showQuickProfileDialog, setShowQuickProfileDialog] = useState(false);
  const [quickProfileData, setQuickProfileData] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);

  const selectedCounter = useMemo(
    () => counters.find((counter) => counter.counterId === selectedCounterId) ?? null,
    [counters, selectedCounterId]
  );

  const refreshQueueSnapshot = useCallback(
    async (counterId: string, options: { silent?: boolean } = {}) => {
      if (!counterId) return null;
      if (!options.silent) {
        setLoadingQueue(true);
      }

      try {
        const data = await fetchQueueSnapshotFromApi(counterId);
        setSnapshot(data);
        return data;
      } catch (error) {
        if (!options.silent) {
          const message = error instanceof Error ? error.message : 'Không thể tải hàng chờ';
          toast.error(message);
        }
        return null;
      } finally {
        if (!options.silent) {
          setLoadingQueue(false);
        }
      }
    },
    []
  );

  const handleCallNext = useCallback(async () => {
    if (!selectedCounterId) {
      toast.error('Vui lòng chọn quầy trước khi gọi bệnh nhân tiếp theo');
      return;
    }

    setLoadingAction(true);

    try {
      const url = `${API_BASE_URL}/counter-assignment/next-patient/${selectedCounterId}`;
      
      // Get auth token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      const options = {
        method: 'POST',
        credentials: 'include' as RequestCredentials,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const response = await fetch(url, options);

      const raw = await response.json().catch(() => ({}));
      const data = isPlainObject(raw) ? raw : {};

      const successFlag =
        (typeof data.success === 'boolean' && data.success) ||
        (typeof data.ok === 'boolean' && data.ok);

      if (!response.ok || !successFlag) {
        const message = typeof data.message === 'string' ? data.message : null;
        throw new Error(message || 'Không thể gọi bệnh nhân tiếp theo');
      }

      const message = typeof data.message === 'string' ? data.message : null;
      toast.success(message || 'Đã gọi bệnh nhân tiếp theo');
      
      // Refresh queue snapshot trước để lấy currentPatient mới
      await refreshQueueSnapshot(selectedCounterId);
      
      // Nếu bệnh nhân hiện tại có appointmentCode, cập nhật status thành COMPLETED
      const updatedSnapshot = await fetchQueueSnapshotFromApi(selectedCounterId);
      if (updatedSnapshot?.current?.metadata && (updatedSnapshot.current.metadata as any).appointmentCode) {
        const appointmentCode = (updatedSnapshot.current.metadata as any).appointmentCode;
        try {
          await fetch(`${API_BASE_URL}/appointment-booking/appointments/${encodeURIComponent(appointmentCode)}/check-in`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (err) {
          console.error('Error updating appointment status:', err);
          // Không hiển thị lỗi cho user vì đây là thao tác phụ
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gọi bệnh nhân tiếp theo';
      toast.error(message);
    } finally {
      setLoadingAction(false);
    }
  }, [selectedCounterId, refreshQueueSnapshot]);

  const handleSkipCurrent = useCallback(async () => {
    if (!selectedCounterId) {
      toast.error('Vui lòng chọn quầy trước khi bỏ qua bệnh nhân');
      return;
    }

    setLoadingAction(true);

    try {
      const url = `${API_BASE_URL}/counter-assignment/skip-current/${selectedCounterId}`;
      
      // Get auth token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      const options = {
        method: 'POST',
        credentials: 'include' as RequestCredentials,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const response = await fetch(url, options);

      const raw = await response.json().catch(() => ({}));
      const data = isPlainObject(raw) ? raw : {};

      const successFlag =
        (typeof data.success === 'boolean' && data.success) ||
        (typeof data.ok === 'boolean' && data.ok);

      if (!response.ok || !successFlag) {
        const message = typeof data.message === 'string' ? data.message : null;
        throw new Error(message || 'Không thể bỏ qua bệnh nhân hiện tại');
      }

      const message = typeof data.message === 'string' ? data.message : null;
      toast.success(message || 'Đã bỏ qua bệnh nhân hiện tại');
      await refreshQueueSnapshot(selectedCounterId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể bỏ qua bệnh nhân hiện tại';
      toast.error(message);
    } finally {
      setLoadingAction(false);
    }
  }, [selectedCounterId, refreshQueueSnapshot]);

  const loadCounters = useCallback(async () => {
    setLoadingCounters(true);
    try {
      const list = await fetchCountersFromApi();
      setCounters(list);
      setSelectedCounterId((prev) => (prev ? prev : list[0]?.counterId ?? ''));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách quầy';
      toast.error(message);
    } finally {
      setLoadingCounters(false);
    }
  }, []);

  const handleAssignCounter = useCallback(async () => {
    if (!selectedCounterId) {
      toast.error('Vui lòng chọn quầy trước khi assign');
      return;
    }

    setLoadingAssign(true);

    try {
      const result = await openCounterApi(selectedCounterId, assignNotes, isVip);
      toast.success(result.message || 'Đã mở quầy thành công');
      setShowAssignDialog(false);
      setShowCounterModal(false);
      setAssignNotes('');
      setIsVip(false);
      // Refresh counters list to update status
      await loadCounters();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể mở quầy';
      toast.error(message);
    } finally {
      setLoadingAssign(false);
    }
  }, [selectedCounterId, assignNotes, isVip, loadCounters]);

  const handleCheckoutCounter = useCallback(async () => {
    if (!selectedCounterId) {
      toast.error('Vui lòng chọn quầy trước khi checkout');
      return;
    }

    setLoadingCheckout(true);

    try {
      const result = await checkoutCounterApi(selectedCounterId);
      toast.success(result.message || 'Đã checkout counter thành công');
      setShowCheckoutDialog(false);
      setShowCounterModal(false);
      // Refresh counters list to update status
      await loadCounters();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể checkout counter';
      toast.error(message);
    } finally {
      setLoadingCheckout(false);
    }
  }, [selectedCounterId, loadCounters]);

  const handleCreatePrescriptionFromTicket = useCallback(async (ticket: QueueTicket) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      toast.error('Vui lòng đăng nhập để tạo phiếu chỉ định');
      return;
    }

    setCreatingPrescriptionForTicket(ticket.ticketId);

    try {
      const metadata = ticket.metadata as any;
      const appointmentCode = metadata?.appointmentCode;
      const patientProfileCode = metadata?.patientProfileCode;

      // Ưu tiên tạo từ appointmentCode nếu có
      if (appointmentCode) {
        try {
          // Tạo prescription từ appointment
          const prescriptionRes = await fetch(`${API_BASE_URL}/prescriptions/appointment/${encodeURIComponent(appointmentCode)}/create-prescription`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!prescriptionRes.ok) {
            const err = await prescriptionRes.json().catch(() => ({}));
            throw new Error(err?.message || 'Không thể tạo phiếu chỉ định từ lịch hẹn');
          }

          const prescriptionResult = await prescriptionRes.json();
          toast.success('Tạo phiếu chỉ định thành công');
          
          // Cập nhật appointment status thành COMPLETED
          try {
            await fetch(`${API_BASE_URL}/appointment-booking/appointments/${encodeURIComponent(appointmentCode)}/check-in`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
          } catch (err) {
            console.error('Error updating appointment status:', err);
          }

          // Auto generate and download PDF
          const prescriptionData = prescriptionResult.data || prescriptionResult;
          const prescriptionCode = prescriptionData.prescriptionCode || prescriptionResult.prescriptionCode;
          
          if (prescriptionCode) {
            try {
              // Check if response already has full prescription data (with services, patientProfile, doctor)
              const hasFullData = prescriptionData.services && 
                                  Array.isArray(prescriptionData.services) && 
                                  prescriptionData.patientProfile && 
                                  prescriptionData.doctor;
              
              let fullPrescriptionData = prescriptionData;
              
              // If response doesn't have full data, fetch it
              if (!hasFullData) {
                const presRes = await fetch(`${API_BASE_URL}/prescriptions/${encodeURIComponent(prescriptionCode)}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                if (presRes.ok) {
                  const fullPrescription = await presRes.json();
                  fullPrescriptionData = fullPrescription.data || fullPrescription;
                }
              }
              
              // Generate and download PDF
              const { generatePrescriptionPDF } = await import('@/lib/utils/prescription-pdf');
              await generatePrescriptionPDF(fullPrescriptionData);
              toast.success('Đã tải PDF phiếu chỉ định');
            } catch (pdfError) {
              console.error('Error generating PDF:', pdfError);
              toast.error('Tạo phiếu thành công nhưng không thể tạo PDF. Vui lòng in từ danh sách phiếu.');
            }
          }

          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo phiếu chỉ định từ lịch hẹn';
          toast.error(message);
          return;
        }
      }

      // Nếu không có appointmentCode, thử tạo từ patientProfileCode
      if (patientProfileCode) {
        try {
          // Tìm patient profile
          const profileRes = await fetch(`${API_BASE_URL}/patient-profiles/search?code=${encodeURIComponent(patientProfileCode)}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!profileRes.ok) {
            const err = await profileRes.json().catch(() => ({}));
            throw new Error(err?.message || 'Không tìm thấy hồ sơ bệnh nhân');
          }

          const profiles = await profileRes.json();
          const profile = Array.isArray(profiles) ? profiles[0] : (profiles?.data?.[0] || profiles?.patientProfiles?.[0]);

          if (!profile) {
            throw new Error('Không tìm thấy hồ sơ bệnh nhân');
          }

          // Redirect đến trang tạo prescription với patientProfileId
          window.location.href = `/reception/prescription?patientProfileId=${profile.id}`;
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tìm hồ sơ bệnh nhân';
          toast.error(message);
          return;
        }
      }

      // Nếu không có cả hai, đưa data vào Quick Profile Dialog
      setQuickProfileData(ticket.metadata || ticket);
      setShowQuickProfileDialog(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo phiếu chỉ định';
      toast.error(message);
    } finally {
      setCreatingPrescriptionForTicket(null);
    }
  }, []);

  const handleCreatePrescription = useCallback(async () => {
    if (!prescriptionAppointmentCode && !prescriptionPatientProfileCode) {
      toast.error('Vui lòng nhập mã lịch hẹn hoặc mã hồ sơ bệnh nhân');
      return;
    }

    setCreatingPrescription(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    try {
      let appointmentData = null;
      let patientProfileId = null;

      // Nếu có appointmentCode, lấy thông tin appointment
      if (prescriptionAppointmentCode) {
        const appointmentRes = await fetch(`${API_BASE_URL}/prescriptions/appointment/${encodeURIComponent(prescriptionAppointmentCode)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!appointmentRes.ok) {
          const err = await appointmentRes.json().catch(() => ({}));
          throw new Error(err?.message || 'Không tìm thấy lịch hẹn');
        }

        appointmentData = await appointmentRes.json();
        patientProfileId = appointmentData.patientProfile?.id;

        if (!patientProfileId) {
          throw new Error('Không tìm thấy thông tin bệnh nhân từ lịch hẹn');
        }

        // Tạo prescription từ appointment
        const prescriptionRes = await fetch(`${API_BASE_URL}/prescriptions/appointment/${encodeURIComponent(prescriptionAppointmentCode)}/create-prescription`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!prescriptionRes.ok) {
          const err = await prescriptionRes.json().catch(() => ({}));
          throw new Error(err?.message || 'Không thể tạo phiếu chỉ định từ lịch hẹn');
        }

        const prescriptionResult = await prescriptionRes.json();
        toast.success('Tạo phiếu chỉ định thành công');
        
        // Cập nhật appointment status thành COMPLETED
        try {
          await fetch(`${API_BASE_URL}/appointment-booking/appointments/${encodeURIComponent(prescriptionAppointmentCode)}/check-in`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (err) {
          console.error('Error updating appointment status:', err);
        }

        // Auto generate and download PDF
        const prescriptionData = prescriptionResult.data || prescriptionResult;
        const prescriptionCode = prescriptionData.prescriptionCode || prescriptionResult.prescriptionCode;
        
        if (prescriptionCode) {
          try {
            // Check if response already has full prescription data (with services, patientProfile, doctor)
            const hasFullData = prescriptionData.services && 
                                Array.isArray(prescriptionData.services) && 
                                prescriptionData.patientProfile && 
                                prescriptionData.doctor;
            
            let fullPrescriptionData = prescriptionData;
            
            // If response doesn't have full data, fetch it
            if (!hasFullData) {
              const presRes = await fetch(`${API_BASE_URL}/prescriptions/${encodeURIComponent(prescriptionCode)}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (presRes.ok) {
                const fullPrescription = await presRes.json();
                fullPrescriptionData = fullPrescription.data || fullPrescription;
              }
            }
            
            // Generate and download PDF
            const { generatePrescriptionPDF } = await import('@/lib/utils/prescription-pdf');
            await generatePrescriptionPDF(fullPrescriptionData);
            toast.success('Đã tải PDF phiếu chỉ định');
          } catch (pdfError) {
            console.error('Error generating PDF:', pdfError);
            toast.error('Tạo phiếu thành công nhưng không thể tạo PDF. Vui lòng in từ danh sách phiếu.');
          }
        }

        // Đóng dialog và reset form
        setShowCreatePrescriptionDialog(false);
        setPrescriptionAppointmentCode('');
        setPrescriptionPatientProfileCode('');
        return;
      }

      // Nếu có patientProfileCode, cần redirect đến trang tạo prescription với patientProfileId
      if (prescriptionPatientProfileCode) {
        // Tìm patient profile
        const profileRes = await fetch(`${API_BASE_URL}/patient-profiles/search?code=${encodeURIComponent(prescriptionPatientProfileCode)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!profileRes.ok) {
          const err = await profileRes.json().catch(() => ({}));
          throw new Error(err?.message || 'Không tìm thấy hồ sơ bệnh nhân');
        }

        const profiles = await profileRes.json();
        const profile = Array.isArray(profiles) ? profiles[0] : (profiles?.data?.[0] || profiles?.patientProfiles?.[0]);

        if (!profile) {
          throw new Error('Không tìm thấy hồ sơ bệnh nhân');
        }

        // Redirect đến trang tạo prescription với patientProfileId
        window.location.href = `/reception/prescription?patientProfileId=${profile.id}`;
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo phiếu chỉ định';
      toast.error(message);
    } finally {
      setCreatingPrescription(false);
    }
  }, [prescriptionAppointmentCode, prescriptionPatientProfileCode]);

  useEffect(() => {
    loadCounters();
  }, [loadCounters]);

  useEffect(() => {
    if (!selectedCounterId) {
      setSnapshot(null);
      return;
    }

    refreshQueueSnapshot(selectedCounterId);
  }, [selectedCounterId, refreshQueueSnapshot]);

  useEffect(() => {
    const counterId = selectedCounterId;
    if (!counterId) {
      if (socketRef.current) {
        socketRef.current.emit('leave_counter', {});
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    const joinPayload = { counterId };

    const handleConnect = () => {
      socket.emit('join_counter', joinPayload);
    };

    const handleRealtimeRefresh = () => {
      refreshQueueSnapshot(counterId, { silent: true });
    };

    socket.on('connect', handleConnect);
    socket.on('joined_counter', () => {
      // Joined counter room
    });
    socket.on('new_ticket', handleRealtimeRefresh);
    socket.on('queue_position_changes', handleRealtimeRefresh);
    socket.on('patient_status_update', handleRealtimeRefresh);
    socket.on('queue_update', (payload: unknown) => {
      try {
        const queuePayload =
          isPlainObject(payload) && 'queue' in payload
            ? (payload as PlainObject)['queue']
            : payload;
        const normalized = normalizeQueueSnapshot(queuePayload, counterId);
        setSnapshot(normalized);
        } catch (error) {
          console.error('[socket] queue_update error:', error);
          refreshQueueSnapshot(counterId, { silent: true });
        }
    });
    socket.on('error', (error: unknown) => {
      console.error('[socket] error:', error);
      // Socket error
    });
    socket.on('disconnect', (reason: string) => {
      console.error('[socket] disconnect:', reason);
      // Socket disconnected
    });

    handleConnect();

    return () => {
      socket.emit('leave_counter', joinPayload);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedCounterId, refreshQueueSnapshot]);

  const orderedTickets = snapshot?.ordered ?? [];
  const currentPatient = snapshot?.current ?? null;
  const nextPatient = snapshot?.next ?? null;
  const queueTickets = orderedTickets.filter(
    (ticket) => ticket.ticketId !== currentPatient?.ticketId && ticket.ticketId !== nextPatient?.ticketId
  );
  // const waitingCount = snapshot?.queue.length ?? 0;

  return (
    <div className="min-h-screen space-y-6 bg-white px-8 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quản lý hàng chờ tiếp nhận</h1>
          <p className="mt-1 text-gray-600">
            Theo dõi trạng thái quầy và thao tác với bệnh nhân theo chuẩn API hàng chờ mới
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => selectedCounterId && refreshQueueSnapshot(selectedCounterId)}
            disabled={!selectedCounterId || loadingQueue}
          >
            {loadingQueue ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Làm mới hàng chờ
          </Button>
          {selectedCounterId && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreatePrescriptionDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tạo phiếu chỉ định
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCounterModal(true)}
              >
                <User className="mr-2 h-4 w-4" />
                Quản lý quầy
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        <Card className="border border-gray-200 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <UserCheck className="h-5 w-5 text-gray-600" />
              Trạng thái phục vụ
            </CardTitle>
            {selectedCounter && (
              <div className="text-sm text-gray-600">
                Quầy: {selectedCounter.counterName} ({selectedCounter.counterCode})
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingQueue && !currentPatient && !nextPatient ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-8 text-sm text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                Đang tải thông tin...
              </div>
            ) : currentPatient ? (
              <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={statusBadgeClass(currentPatient.status)}>
                    {currentPatient.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      currentPatient.callCount >= 3
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-white text-gray-700 border-gray-200'
                    }
                  >
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Gọi {currentPatient.callCount}
                  </Badge>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{currentPatient.patientName}</p>
                  <p className="text-sm text-gray-600">Tuổi: {currentPatient.patientAge}</p>
                  <p className="text-sm font-medium text-blue-700">Số thứ tự: {currentPatient.queueNumber}</p>
                  {currentPatient.metadata && (currentPatient.metadata as any).patientProfileCode && (
                    <p className="text-xs text-gray-600">Mã hồ sơ: {(currentPatient.metadata as any).patientProfileCode}</p>
                  )}
                  {currentPatient.metadata && (currentPatient.metadata as any).appointmentCode && (
                    <p className="text-xs text-gray-600">Mã lịch hẹn: {(currentPatient.metadata as any).appointmentCode}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Bắt đầu: {formatTime(currentPatient.assignedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentPatient.isPregnant && (
                    <Badge variant="outline" className="border-pink-200 bg-pink-100 text-pink-700">
                      Ưu tiên thai sản
                    </Badge>
                  )}
                  {currentPatient.isDisabled && (
                    <Badge variant="outline" className="border-indigo-200 bg-indigo-100 text-indigo-700">
                      Ưu tiên khuyết tật
                    </Badge>
                  )}
                  {currentPatient.isElderly && (
                    <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-700">
                      Người cao tuổi
                    </Badge>
                  )}
                  {currentPatient.isOnTime && (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-700">
                      Đúng hẹn
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCreatePrescriptionFromTicket(currentPatient)}
                    disabled={creatingPrescriptionForTicket === currentPatient.ticketId}
                    className="text-xs"
                  >
                    {creatingPrescriptionForTicket === currentPatient.ticketId ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <ClipboardList className="mr-1 h-3 w-3" />
                        Tạo chỉ định
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-600">
                <User className="h-8 w-8 text-gray-400" />
                Chưa có bệnh nhân đang được phục vụ
              </div>
            )}

            {nextPatient && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">Bệnh nhân tiếp theo</p>
                    <p>{nextPatient.patientName}</p>
                    <p className="text-xs text-yellow-700">Số thứ tự: {nextPatient.queueNumber}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCreatePrescriptionFromTicket(nextPatient)}
                    disabled={creatingPrescriptionForTicket === nextPatient.ticketId}
                    className="text-xs"
                  >
                    {creatingPrescriptionForTicket === nextPatient.ticketId ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <ClipboardList className="mr-1 h-3 w-3" />
                        Tạo chỉ định
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Button
                type="button"
                onClick={handleCallNext}
                disabled={!selectedCounterId || loadingAction}
                className="w-full"
                size="lg"
              >
                {loadingAction ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Gọi bệnh nhân tiếp theo
              </Button>
              <Button
                type="button"
                onClick={handleSkipCurrent}
                disabled={!selectedCounterId || !currentPatient || loadingAction}
                className="w-full"
                variant="outline"
              >
                {loadingAction ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <SkipForward className="mr-2 h-4 w-4" />
                )}
                Bỏ qua bệnh nhân hiện tại
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <ListOrdered className="h-5 w-5 text-gray-600" />
              Hàng chờ ({queueTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingQueue && queueTickets.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-10 text-sm text-gray-600">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                Đang đồng bộ dữ liệu hàng chờ...
              </div>
            ) : queueTickets.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-10 text-sm text-gray-600">
                <Users className="h-8 w-8 text-gray-400" />
                Hàng chờ trống
              </div>
            ) : (
              <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                {queueTickets.map((ticket, index) => {
                  const priorityBadges = [] as JSX.Element[];
                  if (ticket.isPregnant) {
                    priorityBadges.push(
                      <Badge
                        key={`${ticket.ticketId}-pregnant`}
                        variant="outline"
                        className="border-pink-200 bg-pink-100 text-pink-700"
                      >
                        Thai sản
                      </Badge>
                    );
                  }
                  if (ticket.isDisabled) {
                    priorityBadges.push(
                      <Badge
                        key={`${ticket.ticketId}-disabled`}
                        variant="outline"
                        className="border-indigo-200 bg-indigo-100 text-indigo-700"
                      >
                        Khuyết tật
                      </Badge>
                    );
                  }
                  if (ticket.isElderly) {
                    priorityBadges.push(
                      <Badge
                        key={`${ticket.ticketId}-elderly`}
                        variant="outline"
                        className="border-amber-200 bg-amber-100 text-amber-700"
                      >
                        Cao tuổi
                      </Badge>
                    );
                  }
                  if (ticket.isOnTime) {
                    priorityBadges.push(
                      <Badge
                        key={`${ticket.ticketId}-ontime`}
                        variant="outline"
                        className="border-emerald-200 bg-emerald-100 text-emerald-700"
                      >
                        Đúng hẹn
                      </Badge>
                    );
                  }

                  return (
                    <div
                      key={ticket.ticketId}
                      className={`rounded-lg border p-4 transition-colors ${
                        ticket.status === 'SERVING'
                          ? 'border-blue-300 bg-blue-50'
                          : ticket.status === 'NEXT'
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <span>{index + 1}.</span>
                          <span>{ticket.patientName}</span>
                        </div>
                        <Badge variant="outline" className={statusBadgeClass(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(ticket.assignedAt)}
                        </span>
                        <span>Số: {ticket.queueNumber || '--'}</span>
                        <span>Tuổi: {ticket.patientAge}</span>
                        {ticket.metadata && (ticket.metadata as any).patientProfileCode && (
                          <span className="text-blue-600 font-medium">Hồ sơ: {(ticket.metadata as any).patientProfileCode}</span>
                        )}
                        {ticket.metadata && (ticket.metadata as any).appointmentCode && (
                          <span className="text-green-600 font-medium">Lịch hẹn: {(ticket.metadata as any).appointmentCode}</span>
                        )}

                        {ticket.callCount > 0 && (
                          <Badge
                            variant="outline"
                            className={
                              ticket.callCount >= 3
                                ? 'border-red-200 bg-red-100 text-red-700'
                                : 'border-gray-200 bg-gray-100 text-gray-700'
                            }
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Gọi {ticket.callCount}
                          </Badge>
                        )}
                      </div>
                      {priorityBadges.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">{priorityBadges}</div>
                      )}
                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreatePrescriptionFromTicket(ticket)}
                          disabled={creatingPrescriptionForTicket === ticket.ticketId}
                          className="text-xs"
                        >
                          {creatingPrescriptionForTicket === ticket.ticketId ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Đang tạo...
                            </>
                          ) : (
                            <>
                              <ClipboardList className="mr-1 h-3 w-3" />
                              Tạo chỉ định
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Counter Management Modal */}
      <Dialog open={showCounterModal} onOpenChange={setShowCounterModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quản lý quầy</DialogTitle>
            <DialogDescription>
              Chọn quầy và thực hiện checkin/checkout
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {/* Counter Selection */}
            <div>
              <Label htmlFor="counter-select" className="text-sm font-medium text-gray-700">
                Chọn quầy
              </Label>
              <Select
                value={selectedCounterId || undefined}
                onValueChange={(value) => setSelectedCounterId(value)}
                disabled={loadingCounters}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={loadingCounters ? 'Đang tải...' : 'Chọn quầy tiếp nhận'} />
                </SelectTrigger>
                <SelectContent>
                  {counters.length === 0 && !loadingCounters ? (
                    <div className="p-2 text-sm text-gray-500">Không có quầy khả dụng</div>
                  ) : (
                    counters.map((counter) => (
                      <SelectItem key={counter.counterId} value={counter.counterId}>
                        <div className="flex items-center justify-between w-full">
                          <span>{counter.counterName} ({counter.counterCode})</span>
                          <div className="flex items-center gap-2 ml-2">
                            {counter.assignedReceptionist ? (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                {counter.assignedReceptionist.name}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-xs">
                                Trống
                              </Badge>
                            )}
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                counter.status === 'BUSY' 
                                  ? 'bg-red-100 text-red-800 border-red-200' 
                                  : counter.status === 'AVAILABLE'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {counter.status === 'BUSY' ? 'Bận' : counter.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Offline'}
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Counter Status and Actions */}
            {selectedCounter ? (
              <div className="space-y-4">
                {/* Counter Info */}
                <div className={`rounded-lg border p-4 ${
                  selectedCounter.assignedReceptionist 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-green-200 bg-green-50'
                }`}>
                  <p className={`text-sm font-semibold ${
                    selectedCounter.assignedReceptionist ? 'text-blue-800' : 'text-green-800'
                  }`}>
                    Thông tin quầy
                  </p>
                  <p className={`text-sm ${
                    selectedCounter.assignedReceptionist ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    {selectedCounter.counterName} ({selectedCounter.counterCode})
                  </p>
                  {selectedCounter.location && (
                    <p className={`text-xs ${
                      selectedCounter.assignedReceptionist ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      Vị trí: {selectedCounter.location}
                    </p>
                  )}
                  {selectedCounter.assignedReceptionist ? (
                    <div className="mt-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        Đang phục vụ: <span className="font-semibold">{selectedCounter.assignedReceptionist.name}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">Chưa có người phục vụ</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {selectedCounter.assignedReceptionist ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowCheckoutDialog(true)}
                    disabled={loadingCheckout}
                    className="w-full"
                    size="lg"
                  >
                    {loadingCheckout ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Checkout khỏi quầy
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setShowAssignDialog(true)}
                    disabled={loadingAssign}
                    className="w-full"
                    size="lg"
                  >
                    {loadingAssign ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    Checkin vào quầy
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Vui lòng chọn quầy để quản lý
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCounterModal(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Counter Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Counter</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn vào làm việc tại quầy{' '}
              <span className="font-semibold">
                {selectedCounter?.counterName} ({selectedCounter?.counterCode})
              </span>{' '}
              không?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assign-notes" className="text-right">
                Ghi chú
              </Label>
              <Textarea
                id="assign-notes"
                placeholder="Ví dụ: Ca sáng - 8h-12h"
                className="col-span-3"
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is-vip" className="text-right">
                Loại quầy
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                  id="is-vip"
                  checked={isVip}
                  onCheckedChange={(checked) => setIsVip(!!checked)}
                />
                <Label htmlFor="is-vip" className="text-sm font-normal cursor-pointer">
                  Quầy VIP
                </Label>
              </div>
            </div>
            {isVip && (
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Thông báo:</strong> Quầy VIP - Chỉ nhận các bệnh nhân VIP
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAssignDialog(false);
                setAssignNotes('');
                setIsVip(false);
              }}
              disabled={loadingAssign}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleAssignCounter}
              disabled={loadingAssign}
            >
              {loadingAssign ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Xác nhận Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Counter Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Checkout Counter</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn rời khỏi quầy{' '}
              <span className="font-semibold">
                {selectedCounter?.counterName} ({selectedCounter?.counterCode})
              </span>{' '}
              không?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Sau khi checkout, bạn sẽ không thể quản lý hàng chờ tại quầy này nữa.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCheckoutDialog(false)}
              disabled={loadingCheckout}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCheckoutCounter}
              disabled={loadingCheckout}
            >
              {loadingCheckout ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Xác nhận Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Prescription Dialog */}
      <Dialog open={showCreatePrescriptionDialog} onOpenChange={setShowCreatePrescriptionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Tạo phiếu chỉ định
            </DialogTitle>
            <DialogDescription>
              Nhập mã lịch hẹn hoặc mã hồ sơ bệnh nhân để tạo phiếu chỉ định
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="appointment-code">Mã lịch hẹn (Appointment Code)</Label>
              <Input
                id="appointment-code"
                placeholder="VD: APT-1234567890"
                value={prescriptionAppointmentCode}
                onChange={(e) => {
                  setPrescriptionAppointmentCode(e.target.value);
                  if (e.target.value) {
                    setPrescriptionPatientProfileCode('');
                  }
                }}
                disabled={creatingPrescription}
              />
              <p className="text-xs text-gray-500">
                Nếu tạo từ mã lịch hẹn, hệ thống sẽ tự động tạo phiếu chỉ định và cập nhật trạng thái lịch hẹn
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Hoặc</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-profile-code">Mã hồ sơ bệnh nhân (Patient Profile Code)</Label>
              <Input
                id="patient-profile-code"
                placeholder="VD: PAT-1234567890"
                value={prescriptionPatientProfileCode}
                onChange={(e) => {
                  setPrescriptionPatientProfileCode(e.target.value);
                  if (e.target.value) {
                    setPrescriptionAppointmentCode('');
                  }
                }}
                disabled={creatingPrescription}
              />
              <p className="text-xs text-gray-500">
                Nếu tạo từ mã hồ sơ, bạn sẽ được chuyển đến trang tạo phiếu chỉ định
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreatePrescriptionDialog(false);
                setPrescriptionAppointmentCode('');
                setPrescriptionPatientProfileCode('');
              }}
              disabled={creatingPrescription}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleCreatePrescription}
              disabled={creatingPrescription || (!prescriptionAppointmentCode && !prescriptionPatientProfileCode)}
            >
              {creatingPrescription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo phiếu chỉ định
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickProfileDialog
        open={showQuickProfileDialog}
        onOpenChange={setShowQuickProfileDialog}
        initialData={quickProfileData}
        onProfileCreated={(profileId, profileCode) => {
          // Khi profile tạo thành công, điều hướng thẳng sang trang tạo Phiếu Chỉ Định
          window.location.href = `/reception/prescription?patientProfileId=${profileId}`;
        }}
      />
    </div>
  );
}
