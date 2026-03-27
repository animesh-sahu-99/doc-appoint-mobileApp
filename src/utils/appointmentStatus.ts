import { AlertCircle, CheckCircle, XCircle, UserMinus } from 'lucide-react-native';

/**
 * Single source of truth for appointment status display config.
 * Used across DoctorDashboard, DoctorAppointments, DoctorAppointmentDetails,
 * PatientAppointmentDetails, and PatientSchedule.
 */
export interface StatusConfig {
    label: string;
    bg: string;
    text: string;
    dot: string;
    border: string;
    icon: any;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
    PENDING:   { label: 'Pending',   bg: '#fffbeb', text: '#d97706', dot: '#f59e0b', border: '#fde68a', icon: AlertCircle },
    CONFIRMED: { label: 'Confirmed', bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e', border: '#bbf7d0', icon: CheckCircle },
    COMPLETED: { label: 'Completed', bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6', border: '#bfdbfe', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', bg: '#fff1f2', text: '#e11d48', dot: '#ef4444', border: '#fecdd3', icon: XCircle },
    NO_SHOW:   { label: 'No Show',   bg: '#f8fafc', text: '#64748b', dot: '#9ca3af', border: '#e2e8f0', icon: UserMinus },
};
