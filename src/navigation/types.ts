export type AuthStackParamList = {
    Splash: undefined;
    Login: undefined;
    Register: undefined;
    OTPVerification: { phone: string };
};

export type PatientTabParamList = {
    Home: undefined;
    Search: undefined;
    Appointments: undefined;
    Profile: undefined;
};

export type DoctorTabParamList = {
    Dashboard: undefined;
    Schedule: undefined;
    Patients: undefined;
    Notifications: undefined;
    Profile: undefined;
};

export type RootStackParamList = {
    Auth: undefined;
    PatientTabs: undefined;
    DoctorTabs: undefined;
    BookingModal: { doctorId: string };
    DoctorProfile: { doctorId: string };
    EditPatientProfile: undefined;
    EditDoctorProfile: undefined;
    DoctorAppointmentDetails: { appointment: any };
    PatientAppointmentDetails: { appointment: any };
    Notifications: undefined;
};
