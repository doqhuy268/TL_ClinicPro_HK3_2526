'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput, EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarEvent, WorkSession } from '@/lib/types/work-session';
import { useWorkSessionCalendar } from '@/lib/hooks/useWorkSessionCalendar';
import { specialtiesService } from '@/lib/services/services.service';
import { toast } from 'sonner';

// Helper function to get FullCalendar view type
const getViewType = (view: 'month' | 'week' | 'day') => {
  switch (view) {
    case 'month':
      return 'dayGridMonth';
    case 'week':
      return 'timeGridWeek';
    case 'day':
      return 'timeGridDay';
    default:
      return 'dayGridMonth';
  }
};

interface Specialty {
  id: string;
  specialtyCode: string;
  name: string;
}

interface WorkSessionCalendarProps {
  events: CalendarEvent[];
  loading?: boolean;
  onEventClick?: (event: WorkSession) => void;
  onDateSelect?: (date: Date, allDay: boolean) => void;
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
  view?: 'month' | 'week' | 'day';
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  // onDateChange?: (startDate: Date, endDate: Date) => void;
  height?: string | number;
  isAdmin?: boolean;
  selectedDoctorId?: string | null;
  isReady?: boolean;
  onSpecialtyFilterChange?: (filteredEvents: CalendarEvent[]) => void;
}

export function WorkSessionCalendar({
  events,
  loading = false,
  onEventClick,
  onDateSelect,
  onEventDrop,
  view = 'month',
  onViewChange,
  // onDateChange,
  height = '100%',
  isAdmin = false,
  selectedDoctorId = null,
  isReady = true,
  onSpecialtyFilterChange,
}: WorkSessionCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>(view);
  const [loadedEvents, setLoadedEvents] = useState<CalendarEvent[]>([]);
  // Track which month loadedEvents belong to, and which month is currently visible
  const loadedEventsMonthKeyRef = useRef<string>('');
  const currentMonthKeyRef = useRef<string>('');
  const getMonthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
  
  // Specialty filter state (only for admin)
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  
  const {loadEvents} = useWorkSessionCalendar({
    selectedDoctorId,
    isAdmin,
    isReady,
  });

  // Fetch specialties for admin
  useEffect(() => {
    if (isAdmin && isReady) {
      const loadSpecialties = async () => {
        try {
          setLoadingSpecialties(true);
          const response = await specialtiesService.listSpecialties(1, 100);
          setSpecialties(response.data || []);
        } catch (err) {
          console.error('Failed to load specialties:', err);
          toast.error('Không thể tải danh sách chuyên khoa');
        } finally {
          setLoadingSpecialties(false);
        }
      };
      loadSpecialties();
    }
  }, [isAdmin, isReady]);

  // Clear loadedEvents when events prop changes to ensure we use fresh data from parent
  // This ensures calendar updates immediately when parent refreshes after status change
  useEffect(() => {
    // When parent provides events, invalidate local cache to prevent stale data
    if (events !== undefined) {
      setLoadedEvents([]);
      loadedEventsMonthKeyRef.current = '';
    }
  }, [events]);

  // Choose source events:
  // - Priority: parent-provided events (always use latest from props for immediate updates)
  // - Fallback: locally loaded events only when parent hasn't provided events yet
  const baseEvents = useMemo<CalendarEvent[]>(() => {
    // Always prioritize events from props if provided (even if empty)
    // This ensures calendar updates immediately when parent refreshes after status change
    if (events !== undefined) {
      return events;
    }
    
    // Fallback: use locally loaded events only if parent hasn't provided any
    const calendarApi = calendarRef.current?.getApi();
    const visibleDate = calendarApi?.getDate();
    const visibleMonthKey = visibleDate ? getMonthKey(visibleDate) : '';
    const hasLoadedForVisibleMonth =
      loadedEvents.length > 0 && loadedEventsMonthKeyRef.current === visibleMonthKey;
    if (hasLoadedForVisibleMonth) {
      return loadedEvents;
    }
    return [];
  }, [events, loadedEvents]);

  // Filter calendar events by specialty (admin only)
  const filteredEvents = useMemo((): CalendarEvent[] => {
    if (!isAdmin || !selectedSpecialtyId) {
      return baseEvents;
    }
    return baseEvents.filter((event) => {
      const workSession = event.extendedProps.workSession as WorkSession;
      return workSession.doctor?.specialtyId === selectedSpecialtyId;
    });
  }, [baseEvents, selectedSpecialtyId, isAdmin]);

  // Notify parent about filtered events change (for stats)
  // Use a ref to track if we've initialized to avoid unnecessary calls
  const hasNotifiedRef = useRef(false);
  useEffect(() => {
    if (onSpecialtyFilterChange) {
      onSpecialtyFilterChange(filteredEvents);
      hasNotifiedRef.current = true;
    }
  }, [filteredEvents, onSpecialtyFilterChange]);


  // Update title when calendar is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        setCurrentTitle(calendarApi.view.title);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [view]);

  // Sync view with FullCalendar when prop changes
  useEffect(() => {
    setCurrentView(view);
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const currentViewType = calendarApi.view.type;
      const expectedViewType = getViewType(view);
      
      if (currentViewType !== expectedViewType) {
        calendarApi.changeView(expectedViewType);
        setCurrentTitle(calendarApi.view.title);
      }
    }
  }, [view]);

  // Note: loadedEvents is no longer used in displayEvents (which uses filteredEvents from events prop)
  // Parent component (page.tsx) is responsible for providing events via props
  // This useEffect was causing infinite reloads and has been removed

  // Load events for month view when component mounts or view changes
  // Only load if events prop is empty (no filter applied)
  useEffect(() => {
    const loadInitialEvents = async () => {
      // Only load if events prop is empty (parent hasn't provided filtered events)
      if (events.length > 0) return;
      
      if (currentView === 'month') {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
          const currentDate = calendarApi.getDate();
          const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          // Use first day of next month as end boundary to include the last day
          const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
          
          try {
            const newEvents = await loadEvents(startDate, endDate);
            setLoadedEvents(newEvents || []);
          } catch (error) {
            console.error('Failed to load initial events for month view:', error);
          }
        }
      } else {
        // Clear loaded events for week/day view
        setLoadedEvents([]);
      }
    };

    loadInitialEvents();
  }, [currentView, loadEvents, events.length]);

  // Load events when date changes (for week/day view when month changes)
  const handleDateChange = async (dateInfo: { view: { title: string; calendar: { getDate: () => Date } } }) => {
    setCurrentTitle(dateInfo.view.title);
    
    // Notify parent component about date change so it can load events for the new month
    const currentDate = dateInfo.view.calendar.getDate();
    // Track visible month
    currentMonthKeyRef.current = getMonthKey(currentDate);
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    // Call parent callback to load events for new month
    // if (onDateChange) {
    //   onDateChange(startDate, endDate);
    // } else {
      // Fallback: load events locally if no callback provided
      try {
        const newEvents = await loadEvents(startDate, endDate);
        setLoadedEvents(newEvents || []);
        loadedEventsMonthKeyRef.current = getMonthKey(currentDate);
      } catch (error) {
        console.error('Failed to load events for month change:', error);
      }
    // }
  };

  // Navigation functions
  const goToPrev = async () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const currentDate = calendarApi.getDate();
      const prevDate = new Date(currentDate);
      
      // Calculate previous date based on view
      if (currentView === 'month') {
        prevDate.setMonth(prevDate.getMonth() - 1);
      } else if (currentView === 'week') {
        prevDate.setDate(prevDate.getDate() - 7);
      } else if (currentView === 'day') {
        prevDate.setDate(prevDate.getDate() - 1);
      }
      
      // Load events for the new month (if month changed)
      const currentMonth = currentDate.getMonth();
      const prevMonth = prevDate.getMonth();
      
      if (currentMonth !== prevMonth) {
        const startDate = new Date(prevDate.getFullYear(), prevDate.getMonth(), 1);
        const endDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
        
        // Notify parent component to load events for new month
        try {
          const newEvents = await loadEvents(startDate, endDate);
          setLoadedEvents(newEvents || []);
          console.log('Loaded events for previous month:', newEvents);
          // Track that loadedEvents belong to prevDate's month
          loadedEventsMonthKeyRef.current = getMonthKey(prevDate);
          // Also update visible month key pre-emptively
          currentMonthKeyRef.current = getMonthKey(prevDate);
        } catch (error) {
          console.error('Failed to load events for previous month:', error);
        }
      }
      
      calendarApi.prev();
      setCurrentTitle(calendarApi.view.title);
    }
  };

  const goToNext = async () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const currentDate = calendarApi.getDate();
      const nextDate = new Date(currentDate);
      
      // Calculate next date based on view
      if (currentView === 'month') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (currentView === 'week') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (currentView === 'day') {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      
      // Load events for the new month (if month changed)
      const currentMonth = currentDate.getMonth();
      const nextMonth = nextDate.getMonth();
      
      if (currentMonth !== nextMonth) {
        const startDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1);
        const endDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 1);
        
        // Notify parent component to load events for new month
        try {
          const newEvents = await loadEvents(startDate, endDate);
          setLoadedEvents(newEvents || []);
          console.log('Loaded events for next month:', newEvents);
          // Track that loadedEvents belong to nextDate's month
          loadedEventsMonthKeyRef.current = getMonthKey(nextDate);
          // Also update visible month key pre-emptively
          currentMonthKeyRef.current = getMonthKey(nextDate);
        } catch (error) {
          console.error('Failed to load events for next month:', error);
        }
      }
      
      calendarApi.next();
      setCurrentTitle(calendarApi.view.title);
    }
  };

  const goToToday = async () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
      setCurrentTitle(calendarApi.view.title);
      
      // Load events for current month when going to today
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      
      // Notify parent component to load events for current month
      try {
        const newEvents = await loadEvents(startDate, endDate);
        setLoadedEvents(newEvents || []);
        loadedEventsMonthKeyRef.current = getMonthKey(today);
        currentMonthKeyRef.current = getMonthKey(today);
      } catch (error) {
        console.error('Failed to load events for today month:', error);
      }
    }
  };

  // View change function
  const handleViewChange = async (newView: 'month' | 'week' | 'day') => {
    setCurrentView(newView);
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const viewType = getViewType(newView);
      calendarApi.changeView(viewType);
      setCurrentTitle(calendarApi.view.title);
      
      // Load events for month view
      if (newView === 'month') {
        const currentDate = calendarApi.getDate();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        
        try {
          const newEvents = await loadEvents(startDate, endDate);
          setLoadedEvents(newEvents || []);
        } catch (error) {
          console.error('Failed to load events for month view:', error);
        }
      } else {
        // Clear loaded events for week/day view
        setLoadedEvents([]);
      }
    }
    onViewChange?.(newView);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (onEventClick) {
      const workSession = clickInfo.event.extendedProps.workSession as WorkSession;
      onEventClick(workSession);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.start, selectInfo.allDay);
    }
  };

  const handleEventDrop = (dropInfo: EventDropArg) => {
    if (onEventDrop) {
      onEventDrop(
        dropInfo.event.id,
        dropInfo.event.start!,
        dropInfo.event.end!
      );
    }
  };

  // Final events to display
  const displayEvents = filteredEvents;
  
  // Memoize calendarEvents to ensure it updates when displayEvents change
  // This ensures FullCalendar receives new events when status is updated
  const calendarEvents: EventInput[] = useMemo(() => {
    return displayEvents.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      textColor: event.textColor,
      extendedProps: event.extendedProps,
    }));
  }, [displayEvents]);

  return (
    <Card className="w-full border border-gray-200 shadow-sm bg-white">
      <CardHeader className="space-y-4 pb-4 border-b border-gray-200 bg-white">
        {/* Specialty Filter for Admin */}
        {isAdmin && (
          <div className="flex items-center gap-3">
            <Label htmlFor="specialty-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Lọc theo chuyên khoa:
            </Label>
            <Select
              value={selectedSpecialtyId || 'all'}
              onValueChange={(value) => {
                setSelectedSpecialtyId(value === 'all' ? null : value);
              }}
              disabled={loadingSpecialties}
            >
              <SelectTrigger 
                id="specialty-filter"
                className=" border-gray-300 bg-white hover:bg-gray-50"
              >
                <SelectValue placeholder="Tất cả chuyên khoa" />
              </SelectTrigger>
              <SelectContent >
                <SelectItem value="all">Tất cả chuyên khoa</SelectItem>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Title and View Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0F766E] text-white">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Lịch làm việc
              </h2>
              
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
            <Button
              variant={currentView === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('month')}
              className={
                currentView === 'month' 
                  ? 'bg-[#0F766E] text-white font-medium' 
                  : 'text-gray-700 font-medium'
              }
            >
              Tháng
            </Button>
            <Button
              variant={currentView === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('week')}
              className={
                currentView === 'week' 
                  ? 'bg-[#0F766E] text-white font-medium' 
                  : 'text-gray-700 font-medium'
              }
            >
              Tuần
            </Button>
            <Button
              variant={currentView === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewChange('day')}
              className={
                currentView === 'day' 
                  ? 'bg-[#0F766E] text-white  font-medium' 
                  : 'text-gray-700 font-medium'
              }
            >
              Ngày
            </Button>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrev}
              className="border-gray-300  text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              className="border-gray-300 text-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="border-gray-300  text-gray-700 font-medium ml-2"
            >
              Hôm nay
            </Button>
          </div>
          
          <div className="text-lg font-semibold text-gray-900">
            {currentTitle}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2.5">
        {loading ? (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 mx-auto"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-[#0F766E] absolute top-0 left-1/2 transform -translate-x-1/2"></div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-700 font-medium">Đang tải lịch làm việc...</p>
                <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="calendar-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={getViewType(view)}
              events={calendarEvents}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              eventClick={handleEventClick}
              select={handleDateSelect}
              eventDrop={handleEventDrop}
              height={height}
              locale="vi"
              headerToolbar={false}
              buttonText={{
                today: 'Hôm nay',
                month: 'Tháng',
                week: 'Tuần',
                day: 'Ngày',
                list: 'Danh sách'
              }}
              allDayText=""
              noEventsText="Không có lịch làm việc"
              timeZone="Asia/Ho_Chi_Minh"
              displayEventTime={true}
              displayEventEnd={true}
              slotLabelFormat={{
                hour: '2-digit',  
                minute: '2-digit',
                hour12: false
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              eventContent={(eventInfo) => {
                // const getStatusColor = (status: string) => {
                //   switch (status?.toLowerCase()) {
                //     case 'approved':
                //     case 'đã duyệt':
                //       return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                //     case 'pending':
                //     case 'chờ duyệt':
                //       return 'bg-amber-50 text-amber-700 border-amber-200';
                //     case 'rejected':
                //     case 'từ chối':
                //       return 'bg-red-50 text-red-700 border-red-200';
                //     default:
                //       return 'bg-gray-50 text-gray-700 border-gray-200';
                //   }
                // };

                const currentViewType = eventInfo.view.type;
                const isMonthView = currentViewType.includes('dayGrid');
                const isWeekView = currentViewType.includes('timeGridWeek');
                const isDayView = currentViewType.includes('timeGridDay');
                const workSession = eventInfo.event.extendedProps.workSession;

                // Use status colors from event if available; fallback to brand tint
                const bgColor = eventInfo.backgroundColor || 'rgba(53, 184, 207, 0.08)';
                const borderColor = eventInfo.borderColor || '#0F766E';
                const textColor = eventInfo.textColor || '#111827';

                // Month: show start-end; Week/Day: use eventInfo.timeText
                // Format theo giờ VN (Asia/Ho_Chi_Minh)
                const formatHM = (d?: Date | null) => {
                  if (!d) return '';
                  return d.toLocaleTimeString('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  });
                };
                const startHM = formatHM(eventInfo.event.start);
                const endHM = formatHM(eventInfo.event.end);

                // Month view: compact line with subtle colored chip
                if (isMonthView) {
                  return (
                    <div
                      className="w-full mx-1 px-2 py-0.5 rounded-sm border transition-colors duration-150 hover:border-[#0F766E]/40"
                      style={{ backgroundColor: bgColor, borderColor, color: textColor }}
                    >
                      <div className="flex items-center gap-2 text-[11px] leading-4 min-w-0">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: borderColor }}
                        />
                        <span className="tabular-nums opacity-80 shrink-0">
                          {startHM}{endHM ? ` - ${endHM}` : ''}
                        </span>
                        {/* <span className="truncate flex-1">{eventInfo.event.title || 'Ca làm việc'}</span> */}
                      </div>
                    </div>
                  );
                }

                // Week/Day view: full-height block matching event duration, compact horizontally + extra info
                return (
                  <div
                    className="h-full w-full px-2 py-2 rounded-sm border max-w-52"
                    style={{ backgroundColor: bgColor, color: textColor, borderColor: 'rgba(0,0,0,0.08)', borderLeft: `1px solid ${borderColor}`, borderRight: `1px solid ${borderColor}`, borderBottom: `1px solid ${borderColor}`, borderTop: `1px solid ${borderColor}` }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium tabular-nums shrink-0">{eventInfo.timeText}</span>
                      {/* <span className="text-xs truncate flex-1">{eventInfo.event.title || 'Ca làm việc'}</span> */}
                    </div>
                    {(isWeekView || isDayView) && (
                      <div className="mt-0.5 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] leading-4 text-gray-600 min-w-0">
                          {/* {Array.isArray(workSession?.services) && workSession.services.length > 0 && (
                            <span className="whitespace-nowrap flex-shrink-0">{workSession.services.length} dv</span>
                          )} */}
                          {workSession?.booth?.name && (
                            <span className="truncate">📍 {workSession.booth.name}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }}
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              eventClassNames={(arg) => [
                'cursor-pointer',
                'transition-all',
                'hover:shadow-lg',
                'hover:scale-105',
                'rounded-md',
                'border',
                'overflow-hidden'
              ]}
              datesSet={handleDateChange}
            />
          </div>
        )}
      </CardContent>

      <style jsx global>{`
        .calendar-container {
          background: #ffffff;
          border-radius: 12px;
          padding: 4px;
          border: 1px solid #e5e7eb;
        }
        
        .fc-theme-standard .fc-event {
          border-radius: 6px;
          border: none;
          padding: 0;
          background: transparent !important;
          overflow: hidden;
          margin: 1px;
          min-height: 24px;
        }
        
        .fc-theme-standard .fc-event:hover {
          transform: translateY(-1px);
          z-index: 10;
        }
        
        .fc-theme-standard .fc-event-title {
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .fc-theme-standard .fc-event-time {
          font-weight: 400;
          font-size: 0.75rem;
        }
        
        .fc-button-primary {
          background: #0F766E;
          border: 1px solid #0F766E;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        /* Today cell highlight - month view (dayGrid) */
        .fc-daygrid-day.fc-day-today {
          background: rgba(53, 184, 207, 0.03) !important;
          position: relative;
        }
        .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          color: #0f172a; /* slate-900 */
          font-weight: 700;
        }
        .fc-daygrid-day.fc-day-today::after {
          content: '';
          position: absolute;
          inset: 0;
          // border: 1px solid #0F766E;
          border-radius: 8px;
          pointer-events: none;
        }

        /* Today column highlight - week/day view (timeGrid) */
        .fc-timegrid-col.fc-day-today,
        .fc-timegrid-col.fc-day.fc-day-today,
        .fc-timegrid-col-frame.fc-scrollgrid-sync-inner:has(.fc-day-today) {
          background: rgba(53, 184, 207, 0.05) !important;
        }
        .fc-timegrid .fc-day-today .fc-timegrid-slot {
          background: rgba(53, 184, 207, 0.03) !important;
        }
        .fc-timegrid-col.fc-day-today .fc-timegrid-axis-cushion {
          color: #0f172a;
          font-weight: 600;
        }
        
        .fc-button-primary:hover {
          background: #0D5E58;
          border-color: #0D5E58;
        }
        
        .fc-today-button {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          border-radius: 6px;
          font-weight: 500;
        }
        
        .fc-today-button:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }
        
        .fc-daygrid-day-top {
          text-align: center;
          padding: 8px;
        }
        
        .fc-col-header-cell {
          background: #f9fafb;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          color: #374151;
          border: 1px solid #e5e7eb;
          padding: 12px 8px;
        }
        
        .fc-timegrid-slot-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
          padding: 4px 8px;
        }
        
        .fc-scrollgrid {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #e5e7eb;
        }
        
        .fc-daygrid-day.fc-day-today {
          background: #f0f9ff;
          position: relative;
        }
        
        .fc-daygrid-day.fc-day-today::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #0F766E;
          z-index: 1;
        }
        
        .fc-timegrid-col.fc-day-today {
          background: #f0f9ff;
        }
        
        .fc-day-past {
          background-color: #fafafa;
        }
        
        .fc-day-future {
          background-color: #ffffff;
        }
        
        .fc-h-event {
          border-radius: 4px;
          margin: 1px 0;
        }
        
        .fc-v-event {
          border-radius: 4px;
          margin: 0 1px;
        }
        
        .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }
        
        .fc-toolbar-chunk {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .fc-direction-ltr .fc-toolbar > * > :not(:first-child) {
          margin-left: 8px;
        }
      `}</style>
    </Card>
  );
}
