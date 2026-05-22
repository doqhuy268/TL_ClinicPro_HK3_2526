/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { receptionService } from '@/lib/services/reception.service';
import {
  GetCountersResponse,
  GetCurrentCounterResponse,
  PatientInQueue,
  QueueStatusRaw,
  OpenCounterRequest,
  CloseCounterRequest,
  CallNextPatientResponse,
} from '@/lib/types/reception';
import { io, Socket } from 'socket.io-client';

interface UseReceptionReturn {
  counters: GetCountersResponse['counters'];
  currentCounter: GetCurrentCounterResponse | null;
  loadingCounters: boolean;

  queue: PatientInQueue[];
  currentPatient: PatientInQueue | null;
  nextPatient: PatientInQueue | null;
  queueStatus: QueueStatusRaw | null;
  loadingQueue: boolean;

  loadingAction: boolean;
  refreshCounters: () => Promise<void>;
  refreshQueue: () => Promise<void>;
  openCounter: (counterId: string, notes?: string) => Promise<boolean>;
  closeCounter: (notes?: string) => Promise<boolean>;
  callNextPatient: () => Promise<CallNextPatientResponse | null>;
  skipCurrentPatient: () => Promise<boolean>;
}

export function useReception(): UseReceptionReturn {
  const [counters, setCounters] = useState<GetCountersResponse['counters']>([]);
  const [currentCounter, setCurrentCounter] = useState<GetCurrentCounterResponse | null>(null);
  const [loadingCounters, setLoadingCounters] = useState(false);

  const [queue, setQueue] = useState<PatientInQueue[]>([]);
  const [currentPatient, setCurrentPatient] = useState<PatientInQueue | null>(null);
  const [nextPatient, setNextPatient] = useState<PatientInQueue | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatusRaw | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);

  const [loadingAction, setLoadingAction] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const refreshCounters = useCallback(async () => {
    try {
      setLoadingCounters(true);
      const countersRes = await receptionService.getAllCounters();
      setCounters(countersRes.counters || []);
      const currentRes = await receptionService.getCurrentCounter();
      setCurrentCounter(currentRes);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể tải danh sách quầy');
    } finally {
      setLoadingCounters(false);
    }
  }, []);

  const refreshQueue = useCallback(async () => {
    if (!currentCounter) return;
    try {
      setLoadingQueue(true);
      const q = await receptionService.getCounterQueue(currentCounter.id || (currentCounter as any).counterId);
      setQueue(q.queue);

      const status = await receptionService.getCounterQueueStatus(currentCounter.id || (currentCounter as any).counterId);
      setQueueStatus(status);

      // Use status.current and status.queue[0] directly if provided
      const cur = (status.status?.current as any) || null;
      const nxt = (status.status?.queue?.[0] as any) || null;
      setCurrentPatient(cur);
      setNextPatient(nxt);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể tải hàng chờ');
    } finally {
      setLoadingQueue(false);
    }
  }, [currentCounter]);

  const openCounter = useCallback(async (counterId: string, notes?: string) => {
    try {
      setLoadingAction(true);
      const req: OpenCounterRequest = { counterId, notes };
      const res = await receptionService.openCounter(req);
      if (res.success) {
        toast.success('Mở quầy thành công');
        await refreshCounters();
        await refreshQueue();
        return true;
      }
      return false;
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể mở quầy');
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [refreshCounters, refreshQueue]);

  const closeCounter = useCallback(async (notes?: string) => {
    if (!currentCounter) return false;
    try {
      setLoadingAction(true);
      const req: CloseCounterRequest = { counterId: currentCounter.id || (currentCounter as any).counterId, notes };
      const res = await receptionService.closeCounter(req);
      if (res.success) {
        toast.success('Đóng quầy thành công');
        await refreshCounters();
        setQueue([]);
        setCurrentPatient(null);
        setNextPatient(null);
        setQueueStatus(null);
        return true;
      }
      return false;
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể đóng quầy');
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [currentCounter, refreshCounters]);

  const callNextPatient = useCallback(async (): Promise<CallNextPatientResponse | null> => {
    if (!currentCounter) return null;
    try {
      setLoadingAction(true);
      const res = await receptionService.callNextPatient(currentCounter.id || (currentCounter as any).counterId);
      if (res.success) {
        if (res.patient) setCurrentPatient(res.patient);
        await refreshQueue();
        return res;
      }
      return null;
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể gọi bệnh nhân tiếp theo');
      return null;
    } finally {
      setLoadingAction(false);
    }
  }, [currentCounter, refreshQueue]);

  const skipCurrentPatient = useCallback(async (): Promise<boolean> => {
    if (!currentCounter) return false;
    try {
      setLoadingAction(true);
      const res = await receptionService.skipCurrentPatient(currentCounter.id || (currentCounter as any).counterId);
      if (res.success) {
        if (res.patient) setCurrentPatient(res.patient);
        await refreshQueue();
        return true;
      }
      return false;
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể bỏ qua bệnh nhân');
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [currentCounter, refreshQueue]);

  useEffect(() => {
    refreshCounters();
  }, [refreshCounters]);

  useEffect(() => {
    if (currentCounter) {
      refreshQueue();
    } else {
      setQueue([]);
      setCurrentPatient(null);
      setNextPatient(null);
      setQueueStatus(null);
    }
  }, [currentCounter, refreshQueue]);

  // Socket.IO: connect and listen per guide
  useEffect(() => {
    if (!currentCounter) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Namespace /counters as in guide
    const socket = io('http://localhost:3000/counters', {
      transports: ['websocket'],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[socket] connected to /counters');
      socket.emit('join_counter', { counterId: currentCounter.id || (currentCounter as any).counterId });
    });

    socket.on('joined_counter', (data: any) => {
      console.log('[socket] joined_counter:', data);
    });

    socket.on('new_ticket', (data: any) => {
      console.log('[socket] new_ticket:', data);
      refreshQueue();
    });

    socket.on('patient_called', (data: any) => {
      console.log('[socket] patient_called:', data);
      // Prefer server data if present
      if (data?.patient) setCurrentPatient(data.patient);
      refreshQueue();
    });

    socket.on('patient_skipped', (data: any) => {
      console.log('[socket] patient_skipped:', data);
      if (data?.currentPatient) setCurrentPatient(data.currentPatient);
      refreshQueue();
    });

    socket.on('patient_served', (data: any) => {
      console.log('[socket] patient_served:', data);
      refreshQueue();
    });

    socket.on('error', (err: any) => {
      console.log('[socket] error:', err);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('[socket] disconnected:', reason);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentCounter, refreshQueue]);

  return {
    counters,
    currentCounter,
    loadingCounters,
    queue,
    currentPatient,
    nextPatient,
    queueStatus,
    loadingQueue,
    loadingAction,
    refreshCounters,
    refreshQueue,
    openCounter,
    closeCounter,
    callNextPatient,
    skipCurrentPatient,
  };
}

