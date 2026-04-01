import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { markSessionExpired } from '../store/slices/authSlice';

const baseQuery = fetchBaseQuery({
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
});

const baseQueryWithLogging: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  reduxApi,
  extraOptions
) => {
  const url = typeof args === 'string' ? args : args.url;
  const method = typeof args === 'string' ? 'GET' : args.method || 'GET';
  const body = typeof args === 'string' ? undefined : args.body;

  console.log(`\n[API CALL] 🚀 ${method} ${url}`);
  if (body) {
    console.log(`[API PAYLOAD] 📦`, JSON.stringify(body, null, 2));
  }

  const result = await baseQuery(args, reduxApi, extraOptions);

  if (result.error) {
    console.error(`[API ERROR] ❌ ${method} ${url}`, JSON.stringify(result.error, null, 2));

    // ── Global 401 handler: JWT expired or invalid ────────────────────────
    if (result.error.status === 401) {
      console.warn('[API] 🔒 401 Unauthorized — session expired, logging out.');
      reduxApi.dispatch(markSessionExpired());
      // Also wipe all cached RTK Query data so stale data isn't shown after re-login
      reduxApi.dispatch(api.util.resetApiState());
    }
  } else if (result.data) {
    console.log(`[API RESPONSE] ✅ ${method} ${url}`, JSON.stringify(result.data, null, 2));
  }

  return result;
};

// Define a service using a base URL and expected endpoints
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithLogging,
  tagTypes: ['User', 'Doctor', 'Appointment', 'Slot', 'Notification', 'Review', 'Document'],
  endpoints: (builder) => ({
    // ── Patient / Doctor Discovery ─────────────────────────────────────────
    getDoctors: builder.query({
      query: (params) => ({
        url: 'doctors',
        params,
      }),
      providesTags: ['Doctor'],
    }),
    /** GET all doctors */
    getAllDoctors: builder.query<any, void>({
      query: () => 'doctors',
      providesTags: ['Doctor'],
    }),
    /** GET all specializations (for category chips) */
    getSpecializations: builder.query<any, void>({
      query: () => 'doctors/specializations',
      providesTags: ['Doctor'],
    }),
    /** GET doctors filtered by specialization code e.g. CARDIOLOGIST */
    getDoctorsBySpecialization: builder.query<any, string>({
      query: (specialization) => `doctors/specialization/${specialization}`,
      providesTags: ['Doctor'],
    }),
    /** GET doctors with available slots filtered by specialization */
    getAvailableDoctorsBySpecialization: builder.query<any, string>({
      query: (specialization) => `doctors/available/specialization/${specialization}`,
      providesTags: ['Doctor'],
    }),
    /** Unified search with optional filters */
    searchDoctors: builder.query<any, Record<string, any>>({
        query: (filters) => ({
            url: 'doctors/search',
            params: filters,
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
    /** PUT update an authenticated doctor's own profile */
    updateDoctor: builder.mutation<any, { doctorId: string; data: any }>({
      query: ({ doctorId, data }) => ({
        url: `doctors/${doctorId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { doctorId }) => [{ type: 'Doctor', id: doctorId }, 'Doctor'],
    }),

    // ── Single Appointment by ID ────────────────────────────────────────────
    /** GET a single appointment by its ID – used for notification deep-links */
    getAppointmentById: builder.query<any, string>({
      query: (appointmentId) => `appointments/${appointmentId}`,
      providesTags: (result, error, id) => [{ type: 'Appointment', id }],
    }),

    // ── Slot Management ────────────────────────────────────────────────────
    /** GET all slots for a doctor across all dates */
    getDoctorSlots: builder.query<any, string>({
      query: (doctorId) => `slots/doctor/${doctorId}`,
      providesTags: ['Slot'],
    }),
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
    /** Update clinical notes for an appointment */
    updateAppointmentNotes: builder.mutation<any, { appointmentId: string; notes: string }>({
      query: ({ appointmentId, notes }) => ({
        url: `appointments/${appointmentId}/notes`,
        method: 'PUT',
        body: { notes },
      }),
      invalidatesTags: (result, error, { appointmentId }) => [
        { type: 'Appointment', id: appointmentId },
        { type: 'Appointment', id: 'LIST' },
      ],
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

    // ── Patient ──────────────────────────────────────────────────────────────
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
    /** GET Patient Profile */
    getPatientProfile: builder.query<any, string>({
      query: (patientId) => `patients/${patientId}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    /** PUT Update Patient Profile */
    updatePatient: builder.mutation<any, { patientId: string; data: any }>({
      query: ({ patientId, data }) => ({
        url: `patients/${patientId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { patientId }) => [{ type: 'User', id: patientId }],
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
    
    // ── Notifications ──────────────────────────────────────────────────────
    getNotifications: builder.query<any, { page?: number; size?: number }>({
      query: (params) => ({
        url: 'notifications',
        params,
      }),
      providesTags: ['Notification'],
    }),
    getUnreadNotificationCount: builder.query<any, void>({
      query: () => 'notifications/unread-count',
      providesTags: ['Notification'],
    }),
    markNotificationAsRead: builder.mutation<any, string>({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsAsRead: builder.mutation<any, void>({
      query: () => ({
        url: 'notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    registerDeviceToken: builder.mutation<any, { fcmToken: string; deviceType: string }>({
      query: (data) => ({
        url: 'notifications/device-token',
        method: 'POST',
        body: data,
      }),
    }),

    // ── Reviews ─────────────────────────────────────────────────────────────
    /** GET reviews for a doctor */
    getDoctorReviews: builder.query<any, { doctorId: string; sort?: string; page?: number; size?: number }>({
      query: ({ doctorId, sort = 'recent', page = 0, size = 10 }) => 
        `reviews/doctor/${doctorId}?sort=${sort}&page=${page}&size=${size}`,
      providesTags: (result, error, { doctorId }) => [
        { type: 'Review', id: `DOCTOR-${doctorId}` },
        { type: 'Review', id: 'LIST' }
      ],
    }),

    /** POST submit a review for an appointment */
    submitReview: builder.mutation<any, { appointmentId: string; rating: number; comment: string }>({
      query: (body) => ({
        url: 'reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { appointmentId }) => [
        { type: 'Review', id: 'LIST' },
        { type: 'Appointment', id: appointmentId },
        { type: 'Doctor', id: 'LIST' }, // To update average ratings in search
      ],
    }),

    /** POST reply to a review */
    replyToReview: builder.mutation<any, { reviewId: string; reply: string }>({
      query: ({ reviewId, reply }) => ({
        url: `reviews/${reviewId}/reply`,
        method: 'POST',
        body: { reply },
      }),
      invalidatesTags: (result, error, { reviewId }) => [
        { type: 'Review', id: 'LIST' }
      ],
    }),
    // ── Documents ───────────────────────────────────────────────────────────
    getAppointmentDocuments: builder.query<any, string>({
      query: (appointmentId) => `appointments/${appointmentId}/documents`,
      providesTags: (result, error, appointmentId) => [
        { type: 'Appointment', id: appointmentId },
        { type: 'Document', id: 'LIST' },
      ],
    }),
    uploadAppointmentDocument: builder.mutation<any, { appointmentId: string; formData: FormData }>({
      query: ({ appointmentId, formData }) => ({
        url: `appointments/${appointmentId}/documents`,
        method: 'POST',
        body: formData,
        // Let React Native Networking handle the Content-Type boundary for FormData
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      invalidatesTags: (result, error, { appointmentId }) => [
        { type: 'Document', id: 'LIST' },
        { type: 'Appointment', id: appointmentId },
      ],
    }),
    deleteAppointmentDocument: builder.mutation<any, { documentId: string }>({
      query: ({ documentId }) => ({
        url: `documents/${documentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Document'],
    }),
  }),
});

export const {
  // Discovery
  useGetDoctorsQuery,
  useGetAllDoctorsQuery,
  useGetSpecializationsQuery,
  useGetDoctorsBySpecializationQuery,
  useGetAvailableDoctorsBySpecializationQuery,
  useGetDoctorByIdQuery,
  useSearchDoctorsQuery,
  // Doctor profile
  useGetDoctorProfileQuery,
  useUpdateDoctorMutation,
  // Slots
  useGetDoctorSlotsQuery,
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
  useGetAppointmentByIdQuery,
  useConfirmAppointmentMutation,
  useCancelAppointmentMutation,
  useCompleteAppointmentMutation,
  useNoShowAppointmentMutation,
  useUpdateAppointmentNotesMutation,
  // Patient
  useGetAppointmentsQuery,
  useGetPatientAppointmentsQuery,
  useGetUpcomingPatientAppointmentsQuery,
  useCreateAppointmentMutation,
  useGetPatientProfileQuery,
  useUpdatePatientMutation,
  // Auth
  usePatientLoginMutation,
  useDoctorLoginMutation,
  usePatientRegisterMutation,
  useDoctorRegisterMutation,
  // Notifications
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useRegisterDeviceTokenMutation,
  // Reviews
  useGetDoctorReviewsQuery,
  useSubmitReviewMutation,
  useReplyToReviewMutation,
  // Documents
  useGetAppointmentDocumentsQuery,
  useUploadAppointmentDocumentMutation,
  useDeleteAppointmentDocumentMutation,
} = api;
