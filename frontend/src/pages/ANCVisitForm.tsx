import axios, { AxiosError } from 'axios';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Heart, 
  Baby, 
  TestTube, 
  Pill, 
  ClipboardList,
  AlertCircle,
  CheckCircle,
  Download
} from 'lucide-react';
import { clinicalApi, patientsApi, appointmentsApi } from '../api';
import { Patient, Appointment } from '../types';
import { formatDate } from '../utils';

interface ANCVisitFormProps {
  appointmentId?: number;
  patientId?: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

interface FormData {
  patient: number;
  visit_number: number;
  visit_date: string;
  weight_kg: string;
  bp_systolic: string;
  bp_diastolic: string;
  pulse_rate: string;
  temperature_c: string;
  muac_cm: string;
  fundal_height_cm: string;
  fetal_heart_rate: string;
  fetal_presentation: string;
  blood_group_confirmed: string;
  hemoglobin_gdl: string;
  anemia_severity: string;
  blood_sugar_mgdl: string;
  blood_sugar_type: string;
  urine_protein: string;
  urine_glucose: string;
  urine_ketones: string;
  hiv_status: string;
  syphilis_status: string;
  hepatitis_b_surface_ag: string;
  rubella_igg: string;
  ultrasound_results: string;
  complications_noted: string;
  medication_prescribed: string;
  supplements_given: string;
  health_education_given: string;
  general_notes: string;
  remarks: string;
  next_appointment_date: string;
  appointment: number | null;
  [key: string]: string | number | null;
}

const initialFormData: FormData = {
  patient: 0,
  visit_number: 1,
  visit_date: new Date().toISOString().split('T')[0],
  weight_kg: '',
  bp_systolic: '',
  bp_diastolic: '',
  pulse_rate: '',
  temperature_c: '',
  muac_cm: '',
  fundal_height_cm: '',
  fetal_heart_rate: '',
  fetal_presentation: '',
  blood_group_confirmed: '',
  hemoglobin_gdl: '',
  anemia_severity: '',
  blood_sugar_mgdl: '',
  blood_sugar_type: '',
  urine_protein: 'NIL',
  urine_glucose: 'NIL',
  urine_ketones: 'NIL',
  hiv_status: '',
  syphilis_status: '',
  hepatitis_b_surface_ag: '',
  rubella_igg: '',
  ultrasound_results: '',
  complications_noted: '',
  medication_prescribed: '',
  supplements_given: '',
  health_education_given: '',
  general_notes: '',
  remarks: '',
  next_appointment_date: '',
  appointment: null,
};

export default function ANCVisitForm({ appointmentId, patientId, onSuccess, onClose }: ANCVisitFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [appointmentId, patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load patients list
      const patientsRes = await patientsApi.list();
      setPatients(patientsRes.data.results ?? patientsRes.data);
      
      // If appointmentId provided, load appointment details
      if (appointmentId) {
        const apptRes = await appointmentsApi.get(appointmentId);
        const apptData = apptRes.data;
        setAppointment(apptData);
        setFormData(prev => ({
          ...prev,
          patient: apptData.patient,
          appointment: appointmentId,
          visit_number: apptData.appointment_type === 'ANC1' ? 1 : 
                        apptData.appointment_type === 'ANC2' ? 2 :
                        apptData.appointment_type === 'ANC3' ? 3 :
                        apptData.appointment_type === 'ANC4' ? 4 : 1,
        }));
      }
      
      // If patientId provided, pre-fill patient and load their data
      if (patientId && !appointmentId) {
        const patientRes = await patientsApi.get(patientId);
        const patientData = patientRes.data;
        setFormData(prev => ({
          ...prev,
          patient: patientId,
          blood_group_confirmed: patientData.blood_group || '',
        }));
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow empty string or valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData((prev: FormData) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        patient: typeof formData.patient === 'number' ? formData.patient : parseInt(formData.patient as any),
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        bp_systolic: formData.bp_systolic ? parseInt(formData.bp_systolic) : null,
        bp_diastolic: formData.bp_diastolic ? parseInt(formData.bp_diastolic) : null,
        pulse_rate: formData.pulse_rate ? parseInt(formData.pulse_rate) : null,
        temperature_c: formData.temperature_c ? parseFloat(formData.temperature_c) : null,
        muac_cm: formData.muac_cm ? parseFloat(formData.muac_cm) : null,
        fundal_height_cm: formData.fundal_height_cm ? parseInt(formData.fundal_height_cm) : null,
        fetal_heart_rate: formData.fetal_heart_rate ? parseInt(formData.fetal_heart_rate) : null,
        hemoglobin_gdl: formData.hemoglobin_gdl ? parseFloat(formData.hemoglobin_gdl) : null,
        blood_sugar_mgdl: formData.blood_sugar_mgdl ? parseFloat(formData.blood_sugar_mgdl) : null,
        appointment: formData.appointment,
      };

      // Remove empty/null fields
      Object.keys(submitData).forEach((key) => {
        const typedKey = key as keyof typeof submitData;
        const value = submitData[typedKey];

        if (value == null || String(value).trim() === '' || value === 'null') {
          delete submitData[typedKey];
        }
      });

      await clinicalApi.createAncVisit(submitData);
      setSuccess('ANC visit recorded successfully!');
      onSuccess?.();

    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            'Failed to save ANC visit. Please check all required fields.'
        );
      } else {
        setError('Unexpected error occurred.');
      }

    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="alert alert-danger flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success flex items-center gap-2">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Patient Selection (only if not pre-filled) */}
      {!patientId && !appointmentId && (
        <div className="form-group">
          <label className="form-label">Patient *</label>
          <select 
            className="form-select" 
            name="patient" 
            value={formData.patient} 
            onChange={handleInputChange}
            required
          >
            <option value="">— Select Patient —</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.patient_number} — {p.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Visit Info */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <ClipboardList size={20} className="text-primary" />
            Visit Information
          </h3>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Visit Number *</label>
              <select 
                className="form-select" 
                name="visit_number" 
                value={formData.visit_number} 
                onChange={handleInputChange}
                required
              >
                <option value="1">ANC 1</option>
                <option value="2">ANC 2</option>
                <option value="3">ANC 3</option>
                <option value="4">ANC 4</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Visit Date *</label>
              <input 
                className="form-input" 
                type="date" 
                name="visit_date" 
                value={formData.visit_date} 
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Next Appointment</label>
              <input 
                className="form-input" 
                type="date" 
                name="next_appointment_date" 
                value={formData.next_appointment_date} 
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vital Signs */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <Heart size={20} className="text-danger" />
            Vital Signs & Measurements
          </h3>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input 
                className="form-input" 
                type="text" 
                name="weight_kg" 
                value={formData.weight_kg} 
                onChange={handleNumberChange}
                placeholder="e.g., 65.5"
              />
            </div>
            <div className="form-group">
              <label className="form-label">BP Systolic (mmHg)</label>
              <input 
                className="form-input" 
                type="text" 
                name="bp_systolic" 
                value={formData.bp_systolic} 
                onChange={handleNumberChange}
                placeholder="e.g., 120"
              />
            </div>
            <div className="form-group">
              <label className="form-label">BP Diastolic (mmHg)</label>
              <input 
                className="form-input" 
                type="text" 
                name="bp_diastolic" 
                value={formData.bp_diastolic} 
                onChange={handleNumberChange}
                placeholder="e.g., 80"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pulse Rate (bpm)</label>
              <input 
                className="form-input" 
                type="text" 
                name="pulse_rate" 
                value={formData.pulse_rate} 
                onChange={handleNumberChange}
                placeholder="e.g., 72"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Temperature (°C)</label>
              <input 
                className="form-input" 
                type="text" 
                name="temperature_c" 
                value={formData.temperature_c} 
                onChange={handleNumberChange}
                placeholder="e.g., 36.5"
              />
            </div>
            <div className="form-group">
              <label className="form-label">MUAC (cm)</label>
              <input 
                className="form-input" 
                type="text" 
                name="muac_cm" 
                value={formData.muac_cm} 
                onChange={handleNumberChange}
                placeholder="e.g., 25.0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pregnancy Assessment */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <Baby size={20} className="text-info" />
            Pregnancy Assessment
          </h3>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Fundal Height (cm)</label>
              <input 
                className="form-input" 
                type="text" 
                name="fundal_height_cm" 
                value={formData.fundal_height_cm} 
                onChange={handleNumberChange}
                placeholder="e.g., 28"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fetal Heart Rate (bpm)</label>
              <input 
                className="form-input" 
                type="text" 
                name="fetal_heart_rate" 
                value={formData.fetal_heart_rate} 
                onChange={handleNumberChange}
                placeholder="e.g., 140"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fetal Presentation</label>
              <select 
                className="form-select" 
                name="fetal_presentation" 
                value={formData.fetal_presentation} 
                onChange={handleInputChange}
              >
                <option value="">— Not assessed —</option>
                <option value="CEPHALIC">Cephalic</option>
                <option value="BREECH">Breech</option>
                <option value="TRANSVERSE">Transverse</option>
              </select>
            </div>
            <div className="form-group col-span-full">
              <label className="form-label">Ultrasound Results</label>
              <textarea 
                className="form-textarea" 
                name="ultrasound_results" 
                value={formData.ultrasound_results} 
                onChange={handleInputChange}
                rows={2}
                placeholder="Ultrasound findings if performed..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Laboratory Results */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <TestTube size={20} className="text-success" />
            Laboratory Results
          </h3>
        </div>
        <div className="card-body">
          <h4 className="text-sm font-semibold text-muted mb-3">Blood Tests</h4>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select 
                className="form-select" 
                name="blood_group_confirmed" 
                value={formData.blood_group_confirmed} 
                onChange={handleInputChange}
              >
                <option value="">— Not tested —</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hemoglobin (g/dL)</label>
              <input 
                className="form-input" 
                type="text" 
                name="hemoglobin_gdl" 
                value={formData.hemoglobin_gdl} 
                onChange={handleNumberChange}
                placeholder="e.g., 12.5"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Anemia Severity</label>
              <select 
                className="form-select" 
                name="anemia_severity" 
                value={formData.anemia_severity} 
                onChange={handleInputChange}
              >
                <option value="">— Not assessed —</option>
                <option value="NORMAL">Normal</option>
                <option value="MILD">Mild (10.0-10.9 g/dL)</option>
                <option value="MODERATE">Moderate (7.0-9.9 g/dL)</option>
                <option value="SEVERE">Severe (Below 7.0 g/dL)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Blood Sugar (mg/dL)</label>
              <input 
                className="form-input" 
                type="text" 
                name="blood_sugar_mgdl" 
                value={formData.blood_sugar_mgdl} 
                onChange={handleNumberChange}
                placeholder="e.g., 95"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Sugar Type</label>
              <select 
                className="form-select" 
                name="blood_sugar_type" 
                value={formData.blood_sugar_type} 
                onChange={handleInputChange}
              >
                <option value="">— Not specified —</option>
                <option value="FASTING">Fasting</option>
                <option value="RANDOM">Random</option>
                <option value="POSTPRANDIAL">Postprandial</option>
                <option value="OGTT">OGTT</option>
              </select>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-muted mb-3 mt-6">Urine Analysis</h4>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Urine Protein</label>
              <select 
                className="form-select" 
                name="urine_protein" 
                value={formData.urine_protein} 
                onChange={handleInputChange}
              >
                <option value="NIL">Nil</option>
                <option value="+">+</option>
                <option value="++">++</option>
                <option value="+++">+++</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Urine Glucose</label>
              <select 
                className="form-select" 
                name="urine_glucose" 
                value={formData.urine_glucose} 
                onChange={handleInputChange}
              >
                <option value="NIL">Nil</option>
                <option value="+">+</option>
                <option value="++">++</option>
                <option value="+++">+++</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Urine Ketones</label>
              <select 
                className="form-select" 
                name="urine_ketones" 
                value={formData.urine_ketones} 
                onChange={handleInputChange}
              >
                <option value="NIL">Nil</option>
                <option value="+">+</option>
                <option value="++">++</option>
                <option value="+++">+++</option>
              </select>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-muted mb-3 mt-6">Infection Screenings</h4>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">HIV Status</label>
              <select 
                className="form-select" 
                name="hiv_status" 
                value={formData.hiv_status} 
                onChange={handleInputChange}
              >
                <option value="">— Not tested —</option>
                <option value="NEGATIVE">Negative</option>
                <option value="POSITIVE">Positive</option>
                <option value="UNKNOWN">Unknown</option>
                <option value="NOT_TESTED">Not Tested</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Syphilis Status</label>
              <select 
                className="form-select" 
                name="syphilis_status" 
                value={formData.syphilis_status} 
                onChange={handleInputChange}
              >
                <option value="">— Not tested —</option>
                <option value="NON-REACTIVE">Non-Reactive</option>
                <option value="REACTIVE">Reactive</option>
                <option value="NOT_TESTED">Not Tested</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hepatitis B Surface Ag</label>
              <select 
                className="form-select" 
                name="hepatitis_b_surface_ag" 
                value={formData.hepatitis_b_surface_ag} 
                onChange={handleInputChange}
              >
                <option value="">— Not tested —</option>
                <option value="NEGATIVE">Negative</option>
                <option value="POSITIVE">Positive</option>
                <option value="NOT_TESTED">Not Tested</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Rubella IgG</label>
              <select 
                className="form-select" 
                name="rubella_igg" 
                value={formData.rubella_igg} 
                onChange={handleInputChange}
              >
                <option value="">— Not tested —</option>
                <option value="IMMUNE">Immune</option>
                <option value="NON-IMMUNE">Non-Immune</option>
                <option value="NOT_TESTED">Not Tested</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Management */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <Pill size={20} className="text-warning" />
            Clinical Management
          </h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Medications Prescribed</label>
            <textarea 
              className="form-textarea" 
              name="medication_prescribed" 
              value={formData.medication_prescribed} 
              onChange={handleInputChange}
              rows={2}
              placeholder="List medications prescribed during this visit..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Supplements Given</label>
            <textarea 
              className="form-textarea" 
              name="supplements_given" 
              value={formData.supplements_given} 
              onChange={handleInputChange}
              rows={2}
              placeholder="e.g., Iron tablets, Folic acid, Calcium..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Health Education Given</label>
            <textarea 
              className="form-textarea" 
              name="health_education_given" 
              value={formData.health_education_given} 
              onChange={handleInputChange}
              rows={2}
              placeholder="Topics covered during health education session..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Complications Noted</label>
            <textarea 
              className="form-textarea" 
              name="complications_noted" 
              value={formData.complications_noted} 
              onChange={handleInputChange}
              rows={2}
              placeholder="Any high-risk complications observed..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">General Notes</label>
            <textarea 
              className="form-textarea" 
              name="general_notes" 
              value={formData.general_notes} 
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional clinical notes..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea 
              className="form-textarea" 
              name="remarks" 
              value={formData.remarks} 
              onChange={handleInputChange}
              rows={2}
              placeholder="Additional remarks..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onClose && (
          <button
            type="button"
            className="btn btn-ghost flex items-center gap-2"
            onClick={onClose}
          >
            <X size={18} />
            Cancel
          </button>
        )}

        <button
          type="submit"
          className="btn btn-primary flex items-center gap-2"
          disabled={saving}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save ANC Visit
            </>
          )}
        </button>
      </div>
    </form>
  );
}