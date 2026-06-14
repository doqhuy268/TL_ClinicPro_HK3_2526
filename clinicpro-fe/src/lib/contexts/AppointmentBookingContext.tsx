"use client";

import React, { createContext, useContext } from 'react';
import { useAppointmentBooking } from '@/lib/hooks/useAppointmentBooking';

type AppointmentBookingContextValue = ReturnType<typeof useAppointmentBooking>;

const AppointmentBookingContext = createContext<AppointmentBookingContextValue | null>(null);

export function AppointmentBookingProvider({ children }: { children: React.ReactNode }) {
  const value = useAppointmentBooking();
  console.log('value', value);
  return (
    <AppointmentBookingContext.Provider value={value}>
      {children}
    </AppointmentBookingContext.Provider>
  );
}

export function useAppointmentBookingContext(): AppointmentBookingContextValue {
  const ctx = useContext(AppointmentBookingContext);
  if (!ctx) {
    throw new Error('useAppointmentBookingContext must be used within AppointmentBookingProvider');
  }
  return ctx;
}


