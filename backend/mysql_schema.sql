-- Maternity Follow-Up Tracker
-- MySQL schema generated from the Django models and migrations in this repo.
--
-- Use this on a fresh MySQL server before running the app, or import the
-- schema into an empty database named `maternity_db`.

CREATE DATABASE IF NOT EXISTS maternity_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE maternity_db;

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

-- ---------------------------------------------------------------------------
-- Django core tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS django_migrations (
  id BIGINT NOT NULL AUTO_INCREMENT,
  app VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  applied DATETIME(6) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS django_content_type (
  id BIGINT NOT NULL AUTO_INCREMENT,
  app_label VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY django_content_type_app_label_model_uniq (app_label, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_permission (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  content_type_id BIGINT NOT NULL,
  codename VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY auth_permission_content_type_codename_uniq (content_type_id, codename),
  KEY auth_permission_content_type_id_idx (content_type_id),
  CONSTRAINT auth_permission_content_type_fk
    FOREIGN KEY (content_type_id) REFERENCES django_content_type (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_group (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY auth_group_name_uniq (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_group_permissions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY auth_group_permissions_group_permission_uniq (group_id, permission_id),
  KEY auth_group_permissions_group_id_idx (group_id),
  KEY auth_group_permissions_permission_id_idx (permission_id),
  CONSTRAINT auth_group_permissions_group_fk
    FOREIGN KEY (group_id) REFERENCES auth_group (id)
    ON DELETE CASCADE,
  CONSTRAINT auth_group_permissions_permission_fk
    FOREIGN KEY (permission_id) REFERENCES auth_permission (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custom user model used by AUTH_USER_MODEL = users.StaffUser
CREATE TABLE IF NOT EXISTS staff_users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  password VARCHAR(128) NOT NULL,
  last_login DATETIME(6) NULL,
  is_superuser BOOLEAN NOT NULL DEFAULT 0,
  email VARCHAR(254) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'NURSE',
  phone_number VARCHAR(15) NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT 1,
  is_staff BOOLEAN NOT NULL DEFAULT 0,
  date_joined DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY staff_users_email_uniq (email),
  KEY staff_users_role_idx (role),
  KEY staff_users_is_active_idx (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users_staffuser_groups (
  id BIGINT NOT NULL AUTO_INCREMENT,
  staffuser_id BIGINT NOT NULL,
  group_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY users_staffuser_groups_uniq (staffuser_id, group_id),
  KEY users_staffuser_groups_staffuser_id_idx (staffuser_id),
  KEY users_staffuser_groups_group_id_idx (group_id),
  CONSTRAINT users_staffuser_groups_staffuser_fk
    FOREIGN KEY (staffuser_id) REFERENCES staff_users (id)
    ON DELETE CASCADE,
  CONSTRAINT users_staffuser_groups_group_fk
    FOREIGN KEY (group_id) REFERENCES auth_group (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users_staffuser_user_permissions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  staffuser_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY users_staffuser_user_permissions_uniq (staffuser_id, permission_id),
  KEY users_staffuser_user_permissions_staffuser_id_idx (staffuser_id),
  KEY users_staffuser_user_permissions_permission_id_idx (permission_id),
  CONSTRAINT users_staffuser_user_permissions_staffuser_fk
    FOREIGN KEY (staffuser_id) REFERENCES staff_users (id)
    ON DELETE CASCADE,
  CONSTRAINT users_staffuser_user_permissions_permission_fk
    FOREIGN KEY (permission_id) REFERENCES auth_permission (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS django_admin_log (
  id BIGINT NOT NULL AUTO_INCREMENT,
  action_time DATETIME(6) NOT NULL,
  object_id LONGTEXT NULL,
  object_repr VARCHAR(200) NOT NULL,
  action_flag SMALLINT UNSIGNED NOT NULL,
  change_message LONGTEXT NOT NULL,
  content_type_id BIGINT NULL,
  user_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY django_admin_log_content_type_id_idx (content_type_id),
  KEY django_admin_log_user_id_idx (user_id),
  CONSTRAINT django_admin_log_content_type_fk
    FOREIGN KEY (content_type_id) REFERENCES django_content_type (id)
    ON DELETE SET NULL,
  CONSTRAINT django_admin_log_user_fk
    FOREIGN KEY (user_id) REFERENCES staff_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS django_session (
  session_key VARCHAR(40) NOT NULL,
  session_data LONGTEXT NOT NULL,
  expire_date DATETIME(6) NOT NULL,
  PRIMARY KEY (session_key),
  KEY django_session_expire_date_idx (expire_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Patient workflow tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS patients (
  id BIGINT NOT NULL AUTO_INCREMENT,
  patient_number VARCHAR(20) NOT NULL DEFAULT '',
  full_name VARCHAR(200) NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  next_of_kin_name VARCHAR(200) NOT NULL DEFAULT '',
  next_of_kin_phone VARCHAR(15) NOT NULL DEFAULT '',
  date_of_birth DATE NULL,
  lmp DATE NOT NULL,
  edd DATE NOT NULL,
  clinic_stage VARCHAR(20) NOT NULL DEFAULT 'ANC1',
  risk_level VARCHAR(10) NOT NULL DEFAULT 'LOW',
  blood_group VARCHAR(5) NOT NULL DEFAULT 'O+',
  address LONGTEXT NOT NULL DEFAULT '',
  notes LONGTEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT 1,
  registered_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY patients_patient_number_uniq (patient_number),
  KEY patients_registered_by_id_idx (registered_by_id),
  KEY patients_created_at_idx (created_at),
  CONSTRAINT patients_registered_by_fk
    FOREIGN KEY (registered_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS partograph_entries (
  id BIGINT NOT NULL AUTO_INCREMENT,
  patient_id BIGINT NOT NULL,
  recorded_by_id BIGINT NULL,
  hours_in_labour DECIMAL(4,1) NOT NULL,
  recorded_at DATETIME(6) NOT NULL,
  cervical_dilation_cm DECIMAL(3,1) NULL,
  descent_station INT NULL,
  fetal_heart_rate INT NULL,
  moulding VARCHAR(1) NOT NULL DEFAULT '0',
  liquor VARCHAR(1) NOT NULL DEFAULT 'I',
  contractions_per_10min INT NULL,
  contraction_duration VARCHAR(5) NOT NULL DEFAULT '',
  bp_systolic INT NULL,
  bp_diastolic INT NULL,
  pulse_rate INT NULL,
  temperature_celsius DECIMAL(4,1) NULL,
  urine_volume_ml INT NULL,
  urine_protein VARCHAR(3) NOT NULL DEFAULT 'NIL',
  oxytocin_units INT NULL,
  iv_fluids_ml INT NULL,
  drugs_given LONGTEXT NOT NULL DEFAULT '',
  notes LONGTEXT NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  KEY partograph_entries_patient_id_idx (patient_id),
  KEY partograph_entries_recorded_by_id_idx (recorded_by_id),
  KEY partograph_entries_hours_in_labour_idx (hours_in_labour),
  CONSTRAINT partograph_entries_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE CASCADE,
  CONSTRAINT partograph_entries_recorded_by_fk
    FOREIGN KEY (recorded_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  patient_id BIGINT NOT NULL,
  appointment_type VARCHAR(20) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NULL,
  attended_date DATE NULL,
  status VARCHAR(15) NOT NULL DEFAULT 'UPCOMING',
  notes LONGTEXT NOT NULL DEFAULT '',
  created_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY appointments_patient_id_idx (patient_id),
  KEY appointments_scheduled_date_idx (scheduled_date),
  KEY appointments_created_by_id_idx (created_by_id),
  CONSTRAINT appointments_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE CASCADE,
  CONSTRAINT appointments_created_by_fk
    FOREIGN KEY (created_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS postnatal_records (
  id BIGINT NOT NULL AUTO_INCREMENT,
  patient_id BIGINT NOT NULL,
  pregnancy_number INT UNSIGNED NOT NULL DEFAULT 1,
  delivery_date DATE NOT NULL,
  delivery_type VARCHAR(15) NOT NULL,
  baby_weight_kg DECIMAL(4,2) NULL,
  baby_gender VARCHAR(10) NOT NULL DEFAULT 'UNKNOWN',
  mother_condition VARCHAR(200) NOT NULL DEFAULT '',
  baby_condition VARCHAR(200) NOT NULL DEFAULT '',
  review_7day_date DATE NULL,
  review_7day_attended BOOLEAN NOT NULL DEFAULT 0,
  review_7day_notes LONGTEXT NOT NULL DEFAULT '',
  review_6week_date DATE NULL,
  review_6week_attended BOOLEAN NOT NULL DEFAULT 0,
  review_6week_notes LONGTEXT NOT NULL DEFAULT '',
  bcg_given BOOLEAN NOT NULL DEFAULT 0,
  bcg_date DATE NULL,
  opv0_given BOOLEAN NOT NULL DEFAULT 0,
  opv0_date DATE NULL,
  hep_b_given BOOLEAN NOT NULL DEFAULT 0,
  hep_b_date DATE NULL,
  notes LONGTEXT NOT NULL DEFAULT '',
  created_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY postnatal_records_patient_pregnancy_uniq (patient_id, pregnancy_number),
  KEY postnatal_records_patient_id_idx (patient_id),
  KEY postnatal_records_created_by_id_idx (created_by_id),
  KEY postnatal_records_delivery_date_idx (delivery_date),
  CONSTRAINT postnatal_records_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE CASCADE,
  CONSTRAINT postnatal_records_created_by_fk
    FOREIGN KEY (created_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Clinical records and documents
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clinical_notes (
  id BIGINT NOT NULL AUTO_INCREMENT,
  patient_id BIGINT NOT NULL,
  category VARCHAR(20) NOT NULL DEFAULT 'CONSULTATION',
  priority VARCHAR(10) NOT NULL DEFAULT 'ROUTINE',
  title VARCHAR(200) NOT NULL,
  content LONGTEXT NOT NULL,
  diagnosis_codes VARCHAR(200) NOT NULL DEFAULT '',
  lab_test_name VARCHAR(200) NOT NULL DEFAULT '',
  lab_result_value VARCHAR(200) NOT NULL DEFAULT '',
  lab_result_unit VARCHAR(50) NOT NULL DEFAULT '',
  lab_reference_range VARCHAR(100) NOT NULL DEFAULT '',
  lab_is_abnormal BOOLEAN NOT NULL DEFAULT 0,
  medication_name VARCHAR(200) NOT NULL DEFAULT '',
  dosage VARCHAR(100) NOT NULL DEFAULT '',
  frequency VARCHAR(100) NOT NULL DEFAULT '',
  duration VARCHAR(100) NOT NULL DEFAULT '',
  created_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY clinical_notes_patient_id_idx (patient_id),
  KEY clinical_notes_created_by_id_idx (created_by_id),
  KEY clinical_notes_created_at_idx (created_at),
  CONSTRAINT clinical_notes_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE CASCADE,
  CONSTRAINT clinical_notes_created_by_fk
    FOREIGN KEY (created_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_documents (
  id BIGINT NOT NULL AUTO_INCREMENT,
  patient_id BIGINT NOT NULL,
  document_type VARCHAR(20) NOT NULL DEFAULT 'OTHER',
  title VARCHAR(200) NOT NULL,
  description LONGTEXT NOT NULL DEFAULT '',
  file VARCHAR(100) NOT NULL,
  file_size_bytes INT UNSIGNED NOT NULL DEFAULT 0,
  mime_type VARCHAR(100) NOT NULL DEFAULT '',
  uploaded_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY patient_documents_patient_id_idx (patient_id),
  KEY patient_documents_uploaded_by_id_idx (uploaded_by_id),
  KEY patient_documents_created_at_idx (created_at),
  CONSTRAINT patient_documents_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE CASCADE,
  CONSTRAINT patient_documents_uploaded_by_fk
    FOREIGN KEY (uploaded_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Nutrition and follow-up planning
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS nutrition_categories (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL DEFAULT '🥗',
  description LONGTEXT NOT NULL DEFAULT '',
  color_hex VARCHAR(7) NOT NULL DEFAULT '#2DD4BF',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY nutrition_categories_name_uniq (name),
  KEY nutrition_categories_sort_order_idx (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_nutrition_profiles (
  id BIGINT NOT NULL AUTO_INCREMENT,
  patient_id BIGINT NOT NULL,
  phase VARCHAR(20) NOT NULL DEFAULT 'ANC_T1',
  is_anaemic BOOLEAN NOT NULL DEFAULT 0,
  is_hypertensive BOOLEAN NOT NULL DEFAULT 0,
  is_diabetic BOOLEAN NOT NULL DEFAULT 0,
  is_lactating BOOLEAN NOT NULL DEFAULT 0,
  is_post_caesarean BOOLEAN NOT NULL DEFAULT 0,
  bmi DECIMAL(5,2) NULL,
  current_weight_kg DECIMAL(5,2) NULL,
  target_weight_gain_kg DECIMAL(4,1) NULL,
  calorie_target INT UNSIGNED NOT NULL DEFAULT 2200,
  allergies LONGTEXT NOT NULL DEFAULT '',
  dietary_preferences LONGTEXT NOT NULL DEFAULT '',
  notes LONGTEXT NOT NULL DEFAULT '',
  updated_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY patient_nutrition_profiles_patient_uniq (patient_id),
  KEY patient_nutrition_profiles_updated_by_id_idx (updated_by_id),
  CONSTRAINT patient_nutrition_profiles_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE CASCADE,
  CONSTRAINT patient_nutrition_profiles_updated_by_fk
    FOREIGN KEY (updated_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS diet_plans (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  phase VARCHAR(20) NOT NULL,
  condition_tags VARCHAR(200) NOT NULL DEFAULT '',
  meal_type VARCHAR(20) NOT NULL,
  day_of_week INT UNSIGNED NOT NULL DEFAULT 1,
  description LONGTEXT NOT NULL,
  foods LONGTEXT NOT NULL,
  calories_approx INT UNSIGNED NOT NULL DEFAULT 0,
  local_alternatives LONGTEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY diet_plans_day_meal_idx (day_of_week, meal_type),
  KEY diet_plans_phase_idx (phase)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS diet_recommendations (
  id BIGINT NOT NULL AUTO_INCREMENT,
  patient_id BIGINT NOT NULL,
  diet_plan_id BIGINT NOT NULL,
  status VARCHAR(15) NOT NULL DEFAULT 'ACTIVE',
  adherence_score INT UNSIGNED NOT NULL DEFAULT 0,
  override_notes LONGTEXT NOT NULL DEFAULT '',
  overridden_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY diet_recommendations_patient_id_idx (patient_id),
  KEY diet_recommendations_diet_plan_id_idx (diet_plan_id),
  KEY diet_recommendations_overridden_by_id_idx (overridden_by_id),
  KEY diet_recommendations_created_at_idx (created_at),
  CONSTRAINT diet_recommendations_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE CASCADE,
  CONSTRAINT diet_recommendations_diet_plan_fk
    FOREIGN KEY (diet_plan_id) REFERENCES diet_plans (id)
    ON DELETE CASCADE,
  CONSTRAINT diet_recommendations_overridden_by_fk
    FOREIGN KEY (overridden_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS weight_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  patient_id BIGINT NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  gestational_week INT UNSIGNED NULL,
  notes VARCHAR(200) NOT NULL DEFAULT '',
  recorded_by_id BIGINT NULL,
  recorded_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY weight_logs_patient_id_idx (patient_id),
  KEY weight_logs_recorded_by_id_idx (recorded_by_id),
  KEY weight_logs_recorded_at_idx (recorded_at),
  CONSTRAINT weight_logs_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE CASCADE,
  CONSTRAINT weight_logs_recorded_by_fk
    FOREIGN KEY (recorded_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nutrition_dietplan_categories (
  id BIGINT NOT NULL AUTO_INCREMENT,
  dietplan_id BIGINT NOT NULL,
  nutritioncategory_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY nutrition_dietplan_categories_uniq (dietplan_id, nutritioncategory_id),
  KEY nutrition_dietplan_categories_dietplan_id_idx (dietplan_id),
  KEY nutrition_dietplan_categories_nutritioncategory_id_idx (nutritioncategory_id),
  CONSTRAINT nutrition_dietplan_categories_dietplan_fk
    FOREIGN KEY (dietplan_id) REFERENCES diet_plans (id)
    ON DELETE CASCADE,
  CONSTRAINT nutrition_dietplan_categories_nutritioncategory_fk
    FOREIGN KEY (nutritioncategory_id) REFERENCES nutrition_categories (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Alerts and reminders
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clinical_alerts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  patient_id BIGINT NOT NULL,
  partograph_entry_id BIGINT NULL,
  alert_type VARCHAR(30) NOT NULL,
  severity VARCHAR(10) NOT NULL DEFAULT 'WARNING',
  value_triggered VARCHAR(50) NOT NULL DEFAULT '',
  threshold VARCHAR(50) NOT NULL DEFAULT '',
  message LONGTEXT NOT NULL DEFAULT '',
  acknowledged BOOLEAN NOT NULL DEFAULT 0,
  acknowledged_by_id BIGINT NULL,
  acknowledged_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY clinical_alerts_patient_alert_ack_idx (patient_id, alert_type, acknowledged),
  KEY clinical_alerts_ack_created_idx (acknowledged, created_at),
  KEY clinical_alerts_partograph_entry_id_idx (partograph_entry_id),
  KEY clinical_alerts_acknowledged_by_id_idx (acknowledged_by_id),
  CONSTRAINT clinical_alerts_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE CASCADE,
  CONSTRAINT clinical_alerts_partograph_entry_fk
    FOREIGN KEY (partograph_entry_id) REFERENCES partograph_entries (id)
    ON DELETE SET NULL,
  CONSTRAINT clinical_alerts_acknowledged_by_fk
    FOREIGN KEY (acknowledged_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reminder_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  appointment_id BIGINT NULL,
  patient_id BIGINT NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  message_body LONGTEXT NOT NULL,
  sent_at DATETIME(6) NOT NULL,
  delivery_status VARCHAR(10) NOT NULL DEFAULT 'PENDING',
  provider VARCHAR(20) NOT NULL DEFAULT 'AFRICAS_TALKING',
  error_message LONGTEXT NOT NULL DEFAULT '',
  sent_by_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY reminder_logs_appointment_id_idx (appointment_id),
  KEY reminder_logs_patient_id_idx (patient_id),
  KEY reminder_logs_sent_by_id_idx (sent_by_id),
  KEY reminder_logs_sent_at_idx (sent_at),
  CONSTRAINT reminder_logs_appointment_fk
    FOREIGN KEY (appointment_id) REFERENCES appointments (id)
    ON DELETE CASCADE,
  CONSTRAINT reminder_logs_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE CASCADE,
  CONSTRAINT reminder_logs_sent_by_fk
    FOREIGN KEY (sent_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Procedures and emergency protocols
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clinical_procedures (
  id BIGINT NOT NULL AUTO_INCREMENT,
  category VARCHAR(30) NOT NULL,
  title VARCHAR(200) NOT NULL,
  summary LONGTEXT NOT NULL,
  severity VARCHAR(15) NOT NULL DEFAULT 'ROUTINE',
  icon VARCHAR(10) NOT NULL DEFAULT '📋',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  created_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY clinical_procedures_category_sort_idx (category, sort_order),
  KEY clinical_procedures_created_by_id_idx (created_by_id),
  CONSTRAINT clinical_procedures_created_by_fk
    FOREIGN KEY (created_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS procedure_steps (
  id BIGINT NOT NULL AUTO_INCREMENT,
  procedure_id BIGINT NOT NULL,
  step_number INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  description LONGTEXT NOT NULL,
  warning_note LONGTEXT NOT NULL DEFAULT '',
  estimated_duration_min INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY procedure_steps_procedure_step_uniq (procedure_id, step_number),
  KEY procedure_steps_procedure_id_idx (procedure_id),
  CONSTRAINT procedure_steps_procedure_fk
    FOREIGN KEY (procedure_id) REFERENCES clinical_procedures (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS emergency_protocols (
  id BIGINT NOT NULL AUTO_INCREMENT,
  emergency_type VARCHAR(30) NOT NULL,
  title VARCHAR(200) NOT NULL,
  icon VARCHAR(10) NOT NULL DEFAULT '🚨',
  danger_signs LONGTEXT NOT NULL,
  immediate_response LONGTEXT NOT NULL,
  escalation_steps LONGTEXT NOT NULL,
  monitoring_requirements LONGTEXT NOT NULL DEFAULT '',
  referral_criteria LONGTEXT NOT NULL DEFAULT '',
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_by_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY emergency_protocols_emergency_type_uniq (emergency_type),
  KEY emergency_protocols_created_by_id_idx (created_by_id),
  KEY emergency_protocols_emergency_type_idx (emergency_type),
  CONSTRAINT emergency_protocols_created_by_fk
    FOREIGN KEY (created_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS emergency_drugs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  protocol_id BIGINT NOT NULL,
  drug_name VARCHAR(100) NOT NULL,
  dosage VARCHAR(200) NOT NULL,
  route VARCHAR(15) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  max_dose VARCHAR(100) NOT NULL DEFAULT '',
  contraindications LONGTEXT NOT NULL DEFAULT '',
  important_notes LONGTEXT NOT NULL DEFAULT '',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY emergency_drugs_protocol_id_idx (protocol_id),
  KEY emergency_drugs_sort_order_idx (sort_order),
  CONSTRAINT emergency_drugs_protocol_fk
    FOREIGN KEY (protocol_id) REFERENCES emergency_protocols (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS procedure_equipment (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  description VARCHAR(300) NOT NULL DEFAULT '',
  category VARCHAR(50) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  KEY procedure_equipment_category_name_idx (category, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS procedures_procedureequipment_procedures (
  id BIGINT NOT NULL AUTO_INCREMENT,
  procedureequipment_id BIGINT NOT NULL,
  clinicalprocedure_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY procedures_procedureequipment_procedures_uniq (procedureequipment_id, clinicalprocedure_id),
  KEY procedures_procedureequipment_procedures_equipment_id_idx (procedureequipment_id),
  KEY procedures_procedureequipment_procedures_procedure_id_idx (clinicalprocedure_id),
  CONSTRAINT procedures_procedureequipment_procedures_equipment_fk
    FOREIGN KEY (procedureequipment_id) REFERENCES procedure_equipment (id)
    ON DELETE CASCADE,
  CONSTRAINT procedures_procedureequipment_procedures_procedure_fk
    FOREIGN KEY (clinicalprocedure_id) REFERENCES clinical_procedures (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS procedures_procedureequipment_protocols (
  id BIGINT NOT NULL AUTO_INCREMENT,
  procedureequipment_id BIGINT NOT NULL,
  emergencyprotocol_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY procedures_procedureequipment_protocols_uniq (procedureequipment_id, emergencyprotocol_id),
  KEY procedures_procedureequipment_protocols_equipment_id_idx (procedureequipment_id),
  KEY procedures_procedureequipment_protocols_protocol_id_idx (emergencyprotocol_id),
  CONSTRAINT procedures_procedureequipment_protocols_equipment_fk
    FOREIGN KEY (procedureequipment_id) REFERENCES procedure_equipment (id)
    ON DELETE CASCADE,
  CONSTRAINT procedures_procedureequipment_protocols_protocol_fk
    FOREIGN KEY (emergencyprotocol_id) REFERENCES emergency_protocols (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clinical_checklists (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  procedure_id BIGINT NULL,
  protocol_id BIGINT NULL,
  items JSON NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY clinical_checklists_procedure_id_idx (procedure_id),
  KEY clinical_checklists_protocol_id_idx (protocol_id),
  CONSTRAINT clinical_checklists_procedure_fk
    FOREIGN KEY (procedure_id) REFERENCES clinical_procedures (id)
    ON DELETE CASCADE,
  CONSTRAINT clinical_checklists_protocol_fk
    FOREIGN KEY (protocol_id) REFERENCES emergency_protocols (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS protocol_access_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  protocol_id BIGINT NOT NULL,
  accessed_by_id BIGINT NULL,
  patient_id BIGINT NULL,
  accessed_at DATETIME(6) NOT NULL,
  notes VARCHAR(300) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  KEY protocol_access_logs_protocol_id_idx (protocol_id),
  KEY protocol_access_logs_accessed_by_id_idx (accessed_by_id),
  KEY protocol_access_logs_patient_id_idx (patient_id),
  KEY protocol_access_logs_accessed_at_idx (accessed_at),
  CONSTRAINT protocol_access_logs_protocol_fk
    FOREIGN KEY (protocol_id) REFERENCES emergency_protocols (id)
    ON DELETE CASCADE,
  CONSTRAINT protocol_access_logs_accessed_by_fk
    FOREIGN KEY (accessed_by_id) REFERENCES staff_users (id)
    ON DELETE SET NULL,
  CONSTRAINT protocol_access_logs_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Simple-history tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS patients_historicalpatient (
  history_id INT NOT NULL AUTO_INCREMENT,
  id BIGINT NOT NULL,
  patient_number VARCHAR(20) NOT NULL DEFAULT '',
  full_name VARCHAR(200) NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  next_of_kin_name VARCHAR(200) NOT NULL DEFAULT '',
  next_of_kin_phone VARCHAR(15) NOT NULL DEFAULT '',
  date_of_birth DATE NULL,
  lmp DATE NOT NULL,
  edd DATE NOT NULL,
  clinic_stage VARCHAR(20) NOT NULL,
  risk_level VARCHAR(10) NOT NULL,
  blood_group VARCHAR(5) NOT NULL,
  address LONGTEXT NOT NULL DEFAULT '',
  notes LONGTEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  registered_by_id BIGINT NULL,
  history_date DATETIME(6) NOT NULL,
  history_change_reason LONGTEXT NULL,
  history_type VARCHAR(1) NOT NULL,
  history_user_id BIGINT NULL,
  PRIMARY KEY (history_id),
  KEY patients_historicalpatient_id_idx (id),
  KEY patients_historicalpatient_history_date_idx (history_date),
  KEY patients_historicalpatient_history_user_id_idx (history_user_id),
  CONSTRAINT patients_historicalpatient_history_user_fk
    FOREIGN KEY (history_user_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patients_historicalpartographentry (
  history_id INT NOT NULL AUTO_INCREMENT,
  id BIGINT NOT NULL,
  hours_in_labour DECIMAL(4,1) NOT NULL,
  recorded_at DATETIME(6) NOT NULL,
  cervical_dilation_cm DECIMAL(3,1) NULL,
  descent_station INT NULL,
  fetal_heart_rate INT NULL,
  moulding VARCHAR(1) NOT NULL,
  liquor VARCHAR(1) NOT NULL,
  contractions_per_10min INT NULL,
  contraction_duration VARCHAR(5) NOT NULL DEFAULT '',
  bp_systolic INT NULL,
  bp_diastolic INT NULL,
  pulse_rate INT NULL,
  temperature_celsius DECIMAL(4,1) NULL,
  urine_volume_ml INT NULL,
  urine_protein VARCHAR(3) NOT NULL,
  oxytocin_units INT NULL,
  iv_fluids_ml INT NULL,
  drugs_given LONGTEXT NOT NULL DEFAULT '',
  notes LONGTEXT NOT NULL DEFAULT '',
  patient_id BIGINT NULL,
  recorded_by_id BIGINT NULL,
  history_date DATETIME(6) NOT NULL,
  history_change_reason LONGTEXT NULL,
  history_type VARCHAR(1) NOT NULL,
  history_user_id BIGINT NULL,
  PRIMARY KEY (history_id),
  KEY patients_historicalpartographentry_id_idx (id),
  KEY patients_historicalpartographentry_history_date_idx (history_date),
  KEY patients_historicalpartographentry_history_user_id_idx (history_user_id),
  CONSTRAINT patients_historicalpartographentry_history_user_fk
    FOREIGN KEY (history_user_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointments_historicalappointment (
  history_id INT NOT NULL AUTO_INCREMENT,
  id BIGINT NOT NULL,
  appointment_type VARCHAR(20) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NULL,
  attended_date DATE NULL,
  status VARCHAR(15) NOT NULL,
  notes LONGTEXT NOT NULL DEFAULT '',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  created_by_id BIGINT NULL,
  patient_id BIGINT NULL,
  history_date DATETIME(6) NOT NULL,
  history_change_reason LONGTEXT NULL,
  history_type VARCHAR(1) NOT NULL,
  history_user_id BIGINT NULL,
  PRIMARY KEY (history_id),
  KEY appointments_historicalappointment_id_idx (id),
  KEY appointments_historicalappointment_history_date_idx (history_date),
  KEY appointments_historicalappointment_history_user_id_idx (history_user_id),
  CONSTRAINT appointments_historicalappointment_history_user_fk
    FOREIGN KEY (history_user_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS postnatal_historicalpostnatalrecord (
  history_id INT NOT NULL AUTO_INCREMENT,
  id BIGINT NOT NULL,
  patient_id BIGINT NULL,
  pregnancy_number INT UNSIGNED NOT NULL DEFAULT 1,
  delivery_date DATE NOT NULL,
  delivery_type VARCHAR(15) NOT NULL,
  baby_weight_kg DECIMAL(4,2) NULL,
  baby_gender VARCHAR(10) NOT NULL,
  mother_condition VARCHAR(200) NOT NULL DEFAULT '',
  baby_condition VARCHAR(200) NOT NULL DEFAULT '',
  review_7day_date DATE NULL,
  review_7day_attended BOOLEAN NOT NULL,
  review_7day_notes LONGTEXT NOT NULL DEFAULT '',
  review_6week_date DATE NULL,
  review_6week_attended BOOLEAN NOT NULL,
  review_6week_notes LONGTEXT NOT NULL DEFAULT '',
  bcg_given BOOLEAN NOT NULL,
  bcg_date DATE NULL,
  opv0_given BOOLEAN NOT NULL,
  opv0_date DATE NULL,
  hep_b_given BOOLEAN NOT NULL,
  hep_b_date DATE NULL,
  notes LONGTEXT NOT NULL DEFAULT '',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  created_by_id BIGINT NULL,
  history_date DATETIME(6) NOT NULL,
  history_change_reason LONGTEXT NULL,
  history_type VARCHAR(1) NOT NULL,
  history_user_id BIGINT NULL,
  PRIMARY KEY (history_id),
  KEY postnatal_historicalpostnatalrecord_id_idx (id),
  KEY postnatal_historicalpostnatalrecord_history_date_idx (history_date),
  KEY postnatal_historicalpostnatalrecord_history_user_id_idx (history_user_id),
  CONSTRAINT postnatal_historicalpostnatalrecord_history_user_fk
    FOREIGN KEY (history_user_id) REFERENCES staff_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
