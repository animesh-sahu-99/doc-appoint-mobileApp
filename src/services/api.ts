import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define a service using a base URL and expected endpoints
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    // Use the machine's local IP address instead of 10.0.2.2 for physical device testing
    baseUrl: 'http://192.168.5.91:9091/api/',
    prepareHeaders: (headers, { getState }) => {
      // By default, if we have a token in the store, let's use that for authenticated requests
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Doctor', 'Appointment', 'Slot'],
  endpoints: (builder) => ({
    // ── Patient / Doctor Discovery ─────────────────────────────────────────
    getDoctors: builder.query({
      query: (params) => ({
        url: 'doctors',
        params,
      }),
      providesTags: ['Doctor'],
    }),
    getDoctorById: builder.query({
      query: (id) => `doctors/${id}`,
      providesTags: (result, error, id) => [{ type: 'Doctor', id }],
    }),

    // ── Doctor Profile (self) ──────────────────────────────────────────────
    getDoctorProfile: builder.query({
      query: (id: string) => `doctors/${id}`,
      providesTags: (result, error, id) => [{ type: 'Doctor', id }],
    }),

    // ── Slot Management ────────────────────────────────────────────────────
    /** GET all slots (available + booked) for a doctor on a specific date */
    getAllSlotsByDate: builder.query<any, { doctorId: string; date: string }>({
      query: ({ doctorId, date }) => `slots/doctor/${doctorId}/date/${date}/all`,
      providesTags: ['Slot'],
    }),
    /** GET only available slots for a doctor on a specific date */
    getAvailableSlotsByDate: builder.query<any, { doctorId: string; date: string }>({
      query: ({ doctorId, date }) => `slots/doctor/${doctorId}/date/${date}`,
      providesTags: ['Slot'],
    }),
    /** POST create a single slot */
    createSlot: builder.mutation({
      query: (body) => ({
        url: 'slots',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Slot'],
    }),
    /** POST create slots in bulk */
    createBulkSlots: builder.mutation({
      query: (body) => ({
        url: 'slots/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Slot'],
    }),
    /** DELETE a single slot by slotId */
    deleteSlot: builder.mutation<any, string>({
      query: (slotId) => ({
        url: `slots/${slotId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Slot'],
    }),
    /** DELETE all slots for a doctor on a specific date */
    deleteSlotsByDate: builder.mutation<any, { doctorId: string; date: string }>({
      query: ({ doctorId, date }) => ({
        url: `slots/doctor/${doctorId}/date/${date}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Slot'],
    }),

    // ── Appointment Management (Doctor side) ───────────────────────────────
    /** GET all appointments for a doctor */
    getDoctorAppointments: builder.query<any, string>({
      query: (doctorId) => `appointments/doctor/${doctorId}`,
      providesTags: ['Appointment'],
    }),
    /** GET upcoming appointments for a doctor */
    getUpcomingDoctorAppointments: builder.query<any, string>({
      query: (doctorId) => `appointments/doctor/${doctorId}/upcoming`,
      providesTags: ['Appointment'],
    }),
    /** GET appointments for a doctor on a specific date */
    getDoctorAppointmentsByDate: builder.query<any, { doctorId: string; date: string }>({
      query: ({ doctorId, date }) => `appointments/doctor/${doctorId}/date/${date}`,
      providesTags: ['Appointment'],
    }),
    /** PUT confirm an appointment */
    confirmAppointment: builder.mutation<any, string>({
      query: (appointmentId) => ({
        url: `appointments/${appointmentId}/confirm`,
        method: 'PUT',
      }),
      invalidatesTags: ['Appointment'],
    }),
    /** PUT cancel an appointment (frees the slot) */
    cancelAppointment: builder.mutation<any, string>({
      query: (appointmentId) => ({
        url: `appointments/${appointmentId}/cancel`,
        method: 'PUT',
      }),
      invalidatesTags: ['Appointment', 'Slot'],
    }),
    /** PUT mark an appointment as completed */
    completeAppointment: builder.mutation<any, string>({
      query: (appointmentId) => ({
        url: `appointments/${appointmentId}/complete`,
        method: 'PUT',
      }),
      invalidatesTags: ['Appointment'],
    }),
    /** PUT mark an appointment as no-show */
    noShowAppointment: builder.mutation<any, string>({
      query: (appointmentId) => ({
        url: `appointments/${appointmentId}/no-show`,
        method: 'PUT',
      }),
      invalidatesTags: ['Appointment', 'Slot'],
    }),

    // ── Patient-side existing endpoints ────────────────────────────────────
    getAppointments: builder.query({
      query: () => 'appointments',
      providesTags: ['Appointment'],
    }),
    /** GET all appointments for a patient */
    getPatientAppointments: builder.query<any, string>({
      query: (patientId) => `appointments/patient/${patientId}`,
      providesTags: ['Appointment'],
    }),
    /** GET upcoming appointments for a patient */
    getUpcomingPatientAppointments: builder.query<any, string>({
      query: (patientId) => `appointments/patient/${patientId}/upcoming`,
      providesTags: ['Appointment'],
    }),
    createAppointment: builder.mutation({
      query: (body) => ({
        url: 'appointments/book',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appointment'],
    }),

    // ── Auth ───────────────────────────────────────────────────────────────
    patientLogin: builder.mutation({
      query: (credentials) => ({
        url: 'auth/patient/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    doctorLogin: builder.mutation({
      query: (credentials) => ({
        url: 'auth/doctor/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    patientRegister: builder.mutation({
      query: (userData) => ({
        url: 'auth/patient/register',
        method: 'POST',
        body: userData,
      }),
    }),
    doctorRegister: builder.mutation({
      query: (userData) => ({
        url: 'auth/doctor/register',
        method: 'POST',
        body: userData,
      }),
    }),
  }),
});

export const {
  // Discovery
  useGetDoctorsQuery,
  useGetDoctorByIdQuery,
  // Doctor profile
  useGetDoctorProfileQuery,
  // Slots
  useGetAllSlotsByDateQuery,
  useGetAvailableSlotsByDateQuery,
  useCreateSlotMutation,
  useCreateBulkSlotsMutation,
  useDeleteSlotMutation,
  useDeleteSlotsByDateMutation,
  // Doctor appointments
  useGetDoctorAppointmentsQuery,
  useGetUpcomingDoctorAppointmentsQuery,
  useGetDoctorAppointmentsByDateQuery,
  useConfirmAppointmentMutation,
  useCancelAppointmentMutation,
  useCompleteAppointmentMutation,
  useNoShowAppointmentMutation,
  // Patient
  useGetAppointmentsQuery,
  useGetPatientAppointmentsQuery,
  useGetUpcomingPatientAppointmentsQuery,
  useCreateAppointmentMutation,
  // Auth
  usePatientLoginMutation,
  useDoctorLoginMutation,
  usePatientRegisterMutation,
  useDoctorRegisterMutation,
} = api;
