import { AppointmentBooking } from '@/components/appointment-booking/AppointmentBooking';
import { AppointmentBookingProvider } from '@/lib/contexts/AppointmentBookingContext';

export default function BookingPage() {
  return (
    <div className="container mx-auto py-8">
      <AppointmentBookingProvider>
        <AppointmentBooking />
      </AppointmentBookingProvider>
    </div>
  );
}
