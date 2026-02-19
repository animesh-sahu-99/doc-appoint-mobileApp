import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Doctor } from './doctorSlice';

export type AppointmentStatus = 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorImage: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  type: 'In-Person' | 'Video';
  fee: number;
}

interface BookingState {
  selectedDate: string | null;
  selectedTime: string | null;
  selectedType: 'In-Person' | 'Video';
  notes: string;
}

interface AppointmentState {
  appointments: Appointment[];
  booking: BookingState;
  loading: boolean;
  error: string | null;
}

const initialState: AppointmentState = {
  appointments: [],
  booking: {
    selectedDate: null,
    selectedTime: null,
    selectedType: 'In-Person',
    notes: '',
  },
  loading: false,
  error: null,
};

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    setAppointments: (state, action: PayloadAction<Appointment[]>) => {
      state.appointments = action.payload;
    },
    addAppointment: (state, action: PayloadAction<Appointment>) => {
      state.appointments.push(action.payload);
    },
    updateAppointmentStatus: (state, action: PayloadAction<{ id: string; status: AppointmentStatus }>) => {
      const appointment = state.appointments.find((a) => a.id === action.payload.id);
      if (appointment) {
        appointment.status = action.payload.status;
      }
    },
    updateBooking: (state, action: PayloadAction<Partial<BookingState>>) => {
      state.booking = { ...state.booking, ...action.payload };
    },
    clearBooking: (state) => {
      state.booking = initialState.booking;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setAppointments,
  addAppointment,
  updateAppointmentStatus,
  updateBooking,
  clearBooking,
  setLoading,
  setError,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;
