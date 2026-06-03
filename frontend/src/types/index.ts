// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'NURSE' | 'DOCTOR';
  phone_number: string;
  bio: string;
  profile_completed: boolean;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

// ─── Patient ──────────────────────────────────────────────────────────────────
export type ClinicStage = 'ANC1' | 'ANC2' | 'ANC3' | 'ANC4' | 'DELIVERED' | 'POSTNATAL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Patient {
  id: number;
  patient_number: string;
  full_name: string;
  phone_number: string;
  national_id: string | null;
  nhif_number: string | null;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  date_of_birth: string | null;
  lmp: string;
  edd: string;
  clinic_stage: ClinicStage;
  risk_level: RiskLevel;
  blood_group: string;
  medical_history: string;
  surgical_history: string;
  allergies: string;
  family_history: string;
  address: string;
  notes: string;
  is_active: boolean;
  registered_by: number | null;
  registered_by_name: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  age: number | null;
  weeks_pregnant: number | null;
  days_to_edd: number | null;
  is_overdue: boolean;
  is_due_soon: boolean;
}

export type PatientForm = Omit<Patient,
  'id' | 'patient_number' | 'edd' | 'created_at' | 'updated_at' |
  'registered_by_name' | 'age' | 'weeks_pregnant' | 'days_to_edd' | 'is_overdue' | 'is_due_soon'
>;

// ─── Appointment ──────────────────────────────────────────────────────────────
export type AppointmentType = 'ANC1' | 'ANC2' | 'ANC3' | 'ANC4' | 'POSTNATAL_7DAY' | 'POSTNATAL_6WEEK' | 'OTHER';
export type AppointmentStatus = 'UPCOMING' | 'ATTENDED' | 'MISSED' | 'RESCHEDULED' | 'CANCELLED';

export interface Appointment {
  id: number;
  patient: number;
  patient_name: string;
  patient_number: string;
  patient_phone: string;
  appointment_type: AppointmentType;
  scheduled_date: string;
  scheduled_time: string | null;
  attended_date: string | null;
  status: AppointmentStatus;
  notes: string;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Postnatal ────────────────────────────────────────────────────────────────
export interface PostnatalRecord {
  id: number;
  patient: number;
  patient_name: string;
  patient_number: string;
  delivery_date: string;
  delivery_type: 'NORMAL' | 'CAESAREAN' | 'ASSISTED';
  baby_weight_kg: string | null;
  baby_gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  mother_condition: string;
  baby_condition: string;
  review_7day_date: string | null;
  review_7day_attended: boolean;
  review_7day_notes: string;
  review_6week_date: string | null;
  review_6week_attended: boolean;
  review_6week_notes: string;
  bcg_given: boolean;
  opv0_given: boolean;
  hep_b_given: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  review_7day_overdue: boolean;
  review_6week_overdue: boolean;
}

// ─── Reminder ─────────────────────────────────────────────────────────────────
export interface ReminderLog {
  id: number;
  patient: number;
  patient_name: string;
  appointment: number | null;
  appointment_info: string | null;
  phone_number: string;
  message_body: string;
  sent_at: string;
  delivery_status: 'PENDING' | 'SENT' | 'FAILED';
  provider: string;
  error_message: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardKPIs {
  total_patients: number;
  due_this_week: number;
  overdue_delivery: number;
  missed_appointments: number;
  upcoming_this_week: number;
  postnatal_pending_7day: number;
  postnatal_pending_6week: number;
  high_risk_patients: number;
}

export interface DashboardSummary {
  kpis: DashboardKPIs;
  appointment_breakdown: {
    upcoming: number;
    attended: number;
    missed: number;
    rescheduled: number;
  };
  stage_breakdown: Record<string, number>;
}

// ─── API Pagination ───────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Clinical Alerts ──────────────────────────────────────────────────────────
export type AlertType =
  | 'FHR_LOW' | 'FHR_HIGH' | 'BP_CRITICAL'
  | 'ACTION_LINE_CROSSED' | 'ALERT_LINE_CROSSED'
  | 'PROLONGED_LABOUR' | 'TEMP_HIGH';
export type AlertSeverity = 'WARNING' | 'CRITICAL';

export interface ClinicalAlert {
  id: number;
  patient: number;
  patient_name: string;
  patient_number: string;
  partograph_entry: number | null;
  alert_type: AlertType;
  alert_type_display: string;
  severity: AlertSeverity;
  severity_display: string;
  value_triggered: string;
  threshold: string;
  message: string;
  acknowledged: boolean;
  acknowledged_by: number | null;
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface AlertCountResponse {
  total: number;
  critical: number;
  recent: ClinicalAlert[];
}

// ─── Staff User (admin management) ───────────────────────────────────────────
export interface StaffUser {
  id: number;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'NURSE' | 'DOCTOR';
  phone_number: string;
  is_active: boolean;
  date_joined: string;
}

// ─── Audit Trail ──────────────────────────────────────────────────────────────
export interface AuditEntry {
  history_id: number;
  history_type: '+' | '~' | '-';
  history_date: string;
  history_user: string;
  changes: Record<string, { old: string | null; new: string | null }>;
}

// --- Pediatrics ---
export interface ChildProfile {
  id: number;
  mother: number;
  mother_details?: Patient;
  first_name: string;
  last_name: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  date_of_birth: string;
  birth_weight_kg: string;
  birth_certificate_number: string;
}

export interface GrowthRecord {
  id: number;
  child: number;
  date_recorded: string;
  weight_kg: string;
  height_cm: string;
  head_circumference_cm: string;
  notes: string;
}

export interface VaccinationRecord {
  id: number;
  child: number;
  vaccine_name: string;
  vaccine_name_display?: string;
  expected_date: string;
  given_date: string;
  status: 'PENDING' | 'GIVEN' | 'MISSED';
  status_display?: string;
  notes: string;
}

export interface ChildClinicVisit {
  id: number;
  child: number;
  visit_date: string;
  fever_illness_history: string;
  nutrition_status: string;
  development_milestones: string;
  doctor_recommendations: string;
  next_visit_date: string;
}
