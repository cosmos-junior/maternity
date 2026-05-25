"""
Seed data for emergency protocols and procedures.

Call via:
    python manage.py shell -c "from procedures.seed_data import seed_all; seed_all()"
"""
import logging
from .models import (
    ClinicalProcedure, ProcedureStep, EmergencyProtocol,
    EmergencyDrug, ProcedureEquipment, ClinicalChecklist,
)

logger = logging.getLogger(__name__)


def seed_all():
    """Seed procedures, emergencies, drugs, equipment, and checklists."""
    seed_procedures()
    seed_emergencies()
    logger.info('All procedure and emergency data seeded.')


def seed_procedures():
    if ClinicalProcedure.objects.exists():
        logger.info('Procedures already seeded.')
        return

    procedures = [
        {
            'category': 'NORMAL_DELIVERY', 'title': 'Normal Vaginal Delivery', 'icon': '👶',
            'summary': 'Standard protocol for managing normal vaginal delivery including preparation, monitoring through labour stages, and immediate newborn care.',
            'severity': 'ROUTINE',
            'steps': [
                ('Preparation', 'Ensure delivery room is clean and equipped. Prepare delivery kit, sterile gloves, warm towels, and newborn resuscitation equipment. Check patient vitals.', ''),
                ('First Stage Monitoring', 'Monitor cervical dilation, FHR every 30 minutes, maternal BP hourly. Update partograph. Encourage hydration and mobility.', 'Escalate if FHR <110 or >160 bpm'),
                ('Second Stage — Delivery', 'Guide pushing efforts with contractions. Support perineum. Deliver head gently with flexion. Check for nuchal cord. Deliver shoulders and body.', 'Never pull on the baby\'s head'),
                ('Third Stage — Placenta', 'Administer 10 IU Oxytocin IM immediately after delivery. Apply controlled cord traction. Deliver placenta within 30 minutes. Inspect for completeness.', 'Retained placenta requires urgent intervention'),
                ('Immediate Newborn Care', 'Dry and stimulate baby. Clear airway if needed. Clamp and cut cord. Place skin-to-skin on mother. Initiate breastfeeding within 1 hour. APGAR at 1 and 5 minutes.', ''),
                ('Postpartum Monitoring', 'Monitor maternal BP, pulse, uterine tone, and vaginal bleeding every 15 minutes for 2 hours. Check perineum for tears requiring suturing.', 'Excessive bleeding = potential PPH — escalate immediately'),
            ],
        },
        {
            'category': 'CAESAREAN', 'title': 'Caesarean Section — Nurse Checklist', 'icon': '🏥',
            'summary': 'Pre-operative, intra-operative, and post-operative nursing support protocol for caesarean section deliveries.',
            'severity': 'URGENT',
            'steps': [
                ('Pre-operative', 'Consent obtained. NPO verified. IV line established. Cross-match blood. Urinary catheter inserted. Shave surgical site. Pre-op antibiotics administered. Transfer to theatre.', ''),
                ('Intra-operative', 'Assist anaesthetist. Monitor maternal vitals continuously. Count swabs/instruments before and after. Prepare newborn resuscitation equipment. Receive baby immediately.', 'Strict swab count is mandatory'),
                ('Immediate Post-op', 'Transfer to recovery. Monitor BP, pulse, SpO2 every 5 minutes for 30 min, then every 15 min for 2 hours. Monitor urine output. Pain management.', ''),
                ('Post-op Recovery', 'Encourage early ambulation (6-12 hours). Monitor wound site. Continue IV fluids. Resume oral intake when bowel sounds return. Ensure breastfeeding support.', 'Watch for signs of infection: fever, wound discharge'),
            ],
        },
        {
            'category': 'NEWBORN_CARE', 'title': 'Essential Newborn Care', 'icon': '🍼',
            'summary': 'WHO-recommended essential newborn care protocol for the first 24 hours of life.',
            'severity': 'ROUTINE',
            'steps': [
                ('Thermal Care', 'Dry baby immediately. Remove wet cloth. Wrap in warm dry towel. Place skin-to-skin on mother. Keep room temperature 25-28°C. Delay bathing for 24 hours.', 'Hypothermia is a leading cause of neonatal death'),
                ('Cord Care', 'Clamp cord at 1-3 cm from abdomen. Cut with sterile blade. Keep cord stump clean and dry. Do NOT apply any substances. Watch for bleeding or infection signs.', ''),
                ('Breastfeeding Initiation', 'Initiate within first hour. Position correctly: tummy-to-tummy. Ensure good latch. Feed on demand (8-12 times/24 hours). No prelacteal feeds.', 'Exclusive breastfeeding for first 6 months'),
                ('Eye Prophylaxis', 'Apply 1% tetracycline eye ointment to both eyes within 1 hour of birth to prevent gonococcal ophthalmia.', ''),
                ('Vitamin K', 'Administer Vitamin K 1mg IM to prevent hemorrhagic disease of newborn.', ''),
                ('APGAR Assessment', 'Assess at 1 minute and 5 minutes. Score: Appearance, Pulse, Grimace, Activity, Respiration. Score 7-10 = normal. Score <7 = needs intervention.', ''),
            ],
        },
    ]

    for p_data in procedures:
        steps_data = p_data.pop('steps')
        proc = ClinicalProcedure.objects.create(**p_data)
        for i, (title, desc, warning) in enumerate(steps_data, 1):
            ProcedureStep.objects.create(
                procedure=proc, step_number=i,
                title=title, description=desc, warning_note=warning,
            )

    logger.info('Seeded %d procedures.', len(procedures))


def seed_emergencies():
    if EmergencyProtocol.objects.exists():
        logger.info('Emergency protocols already seeded.')
        return

    emergencies = [
        {
            'emergency_type': 'PPH',
            'title': 'Postpartum Hemorrhage (PPH) Management',
            'icon': '🩸',
            'danger_signs': '• Blood loss >500ml (vaginal) or >1000ml (C-section)\n• Rapid pulse >100 bpm\n• Falling BP <90/60\n• Pale, cold, clammy skin\n• Boggy/soft uterus\n• Continuous trickling of blood',
            'immediate_response': '1. CALL FOR HELP — activate emergency team\n2. Rub uterine fundus vigorously (bimanual compression)\n3. Start 2 large-bore IV lines (16G or 18G)\n4. Give Oxytocin 40 IU in 1L Ringer\'s Lactate, run fast\n5. Give Misoprostol 800mcg sublingual if oxytocin unavailable\n6. Empty bladder — insert urinary catheter\n7. Type and crossmatch blood — order 2-4 units\n8. Give Tranexamic Acid 1g IV over 10 minutes\n9. If bleeding continues — bimanual uterine compression\n10. Prepare for theatre if medical management fails',
            'escalation_steps': '• If no response in 30 minutes → surgical intervention\n• Contact surgical team for exploration\n• Consider uterine balloon tamponade\n• Arrange blood transfusion\n• Transfer to higher facility if cannot manage',
            'monitoring_requirements': '• BP every 5 minutes during active bleeding\n• Pulse oximetry continuous\n• Urine output hourly (>30ml/hr target)\n• Ongoing blood loss measurement\n• Hb check every 4 hours',
            'drugs': [
                ('Oxytocin', '10 IU IM stat, then 40 IU in 1L IV', 'IV/IM', 'Continuous infusion', '60 IU total', 'Do not give rapid IV bolus'),
                ('Misoprostol', '800 mcg', 'SUBLINGUAL', 'Single dose', '800 mcg', 'Alternative if oxytocin unavailable'),
                ('Tranexamic Acid', '1g in 10ml (100mg/ml)', 'IV', 'Over 10 minutes, may repeat once', '2g total', 'Give within 3 hours of bleeding onset'),
                ('Ergometrine', '0.2mg', 'IM', 'May repeat after 15 minutes', '0.4mg', 'CONTRAINDICATED in hypertension/pre-eclampsia'),
            ],
        },
        {
            'emergency_type': 'ECLAMPSIA',
            'title': 'Eclampsia / Pre-eclampsia Management',
            'icon': '⚡',
            'danger_signs': '• Severe headache unresponsive to paracetamol\n• Visual disturbances (blurring, scotoma)\n• Epigastric/RUQ pain\n• BP ≥160/110 mmHg\n• Proteinuria ≥2+\n• Seizures\n• Altered consciousness',
            'immediate_response': '1. Protect airway — recovery position during seizure\n2. Do NOT restrain patient during seizure\n3. Give Magnesium Sulphate LOADING dose: 4g IV over 15-20 minutes\n4. PLUS MgSO4 5g IM in each buttock (10g total loading)\n5. Give antihypertensive: Nifedipine 10mg oral OR Hydralazine 5mg slow IV\n6. Monitor BP every 15 minutes\n7. Insert urinary catheter — monitor output\n8. Prepare for emergency delivery within 12-24 hours',
            'escalation_steps': '• Recurrent seizures: repeat MgSO4 2g IV over 5 min\n• Uncontrolled BP: escalate antihypertensive\n• Plan delivery — eclampsia is only cured by delivery\n• If >34 weeks: immediate delivery\n• If <34 weeks: stabilize, give steroids, deliver within 24-48h',
            'monitoring_requirements': '• BP every 15 minutes\n• Urine output hourly (>25ml/hr)\n• Respiratory rate (>16/min before next MgSO4)\n• Patellar reflexes before each MgSO4 dose\n• Fetal monitoring — continuous CTG\n• Keep calcium gluconate at bedside (MgSO4 antidote)',
            'drugs': [
                ('Magnesium Sulphate', 'Loading: 4g IV + 10g IM. Maintenance: 5g IM every 4h', 'IV/IM', 'Every 4 hours maintenance', '40g in 24h', 'Monitor respiratory rate and reflexes. Stop if RR<16'),
                ('Nifedipine', '10mg', 'ORAL', 'Every 30 min if BP still high, max 4 doses', '40mg', 'Do not give sublingual. Monitor for hypotension'),
                ('Hydralazine', '5mg slow IV', 'IV', 'Every 20 min if BP >160/110', '20mg', 'Have IV fluids ready for hypotension'),
                ('Calcium Gluconate', '1g (10ml of 10%)', 'IV', 'Over 10 min — MgSO4 antidote', '1g', 'ONLY give if MgSO4 toxicity suspected'),
            ],
        },
        {
            'emergency_type': 'NEONATAL_RESUS',
            'title': 'Neonatal Resuscitation',
            'icon': '👶',
            'danger_signs': '• No breathing or gasping at birth\n• Heart rate <100 bpm\n• Central cyanosis persisting >5 min\n• Floppy/limp baby\n• APGAR <7 at 1 minute',
            'immediate_response': '1. DRY the baby thoroughly\n2. POSITION — neutral head position, slight extension\n3. CLEAR airway — suction mouth first, then nose\n4. STIMULATE — rub back, flick soles of feet\n5. If no breathing after 30 seconds: START bag-mask ventilation\n6. Ventilate at 40 breaths/minute for 1 minute\n7. Reassess: if HR <60 bpm → start chest compressions\n8. Ratio: 3 compressions : 1 ventilation\n9. Reassess every 60 seconds\n10. If no improvement after 10 minutes — consider stopping',
            'escalation_steps': '• Call for pediatric/neonatal team\n• Prepare for intubation if bag-mask ineffective\n• Prepare UVC for medication administration\n• Consider epinephrine if HR remains <60 bpm',
            'monitoring_requirements': '• Heart rate: auscultate or palpate umbilical pulse\n• Breathing effort\n• Colour (central vs peripheral cyanosis)\n• APGAR at 1, 5, and 10 minutes\n• Temperature — prevent hypothermia',
            'drugs': [
                ('Epinephrine', '0.1-0.3 ml/kg of 1:10,000', 'IV', 'May repeat every 3-5 min', '', 'Give via UVC if available'),
                ('Normal Saline', '10 ml/kg', 'IV', 'Over 5-10 minutes', '', 'For volume expansion if blood loss suspected'),
            ],
        },
        {
            'emergency_type': 'SEPSIS',
            'title': 'Maternal/Puerperal Sepsis Management',
            'icon': '🦠',
            'danger_signs': '• Temperature >38°C or <36°C\n• Heart rate >100 bpm\n• Respiratory rate >20\n• Foul-smelling lochia\n• Uterine tenderness\n• Altered consciousness\n• Hypotension <90/60',
            'immediate_response': '1. Take blood cultures BEFORE starting antibiotics\n2. Start IV broad-spectrum antibiotics within 1 hour:\n   - Ampicillin 2g IV 6-hourly + Gentamicin 5mg/kg IV daily + Metronidazole 500mg IV 8-hourly\n3. IV fluid resuscitation: 1L Normal Saline over 1 hour\n4. Monitor urine output — insert catheter\n5. Source control — examine for retained products, wound infection\n6. Oxygen if SpO2 <94%',
            'escalation_steps': '• If no improvement in 6 hours → review antibiotics\n• If retained products suspected → evacuate\n• If wound infection → open and drain\n• Septic shock: vasopressor support → ICU transfer',
            'monitoring_requirements': '• Vital signs every 30 minutes\n• Urine output hourly\n• Lactate if available\n• Temperature chart\n• White cell count daily',
            'drugs': [
                ('Ampicillin', '2g', 'IV', 'Every 6 hours', '', 'First-line sepsis antibiotic'),
                ('Gentamicin', '5mg/kg', 'IV', 'Once daily', '', 'Monitor renal function'),
                ('Metronidazole', '500mg', 'IV', 'Every 8 hours', '', 'Covers anaerobic organisms'),
            ],
        },
    ]

    for e_data in emergencies:
        drugs_data = e_data.pop('drugs')
        proto = EmergencyProtocol.objects.create(**e_data)
        for i, (name, dose, route, freq, max_d, notes) in enumerate(drugs_data):
            EmergencyDrug.objects.create(
                protocol=proto, drug_name=name, dosage=dose,
                route=route, frequency=freq, max_dose=max_d,
                important_notes=notes, sort_order=i,
            )

    logger.info('Seeded %d emergency protocols.', len(emergencies))
