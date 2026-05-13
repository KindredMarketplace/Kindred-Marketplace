-- =============================================================================
-- 01_service_taxonomy.sql
-- Seed the service taxonomy. These are the tags CNAs select on signup, clients
-- filter Browse by, and businesses use to specify shift requirements.
--
-- Categories:
--   personal_care   — bathing, dressing, toileting
--   mobility        — transfers, ambulation, fall prevention
--   medical_support — meds reminders, vitals, wound care (CNA scope)
--   household       — cooking, light cleaning, errands
--   specialty       — dementia, hospice, post-op, pediatric
--   companionship   — companionship, transportation, social engagement
--   overnight       — overnight, live-in, on-call
-- =============================================================================

insert into public.service_taxonomy (key, label, category, description, requires_certification, display_order) values
-- Personal Care
('bathing', 'Bathing & Hygiene', 'personal_care', 'Bed baths, showers, oral care, grooming', false, 10),
('dressing', 'Dressing Assistance', 'personal_care', 'Help with dressing, choosing weather-appropriate clothing', false, 20),
('toileting', 'Toileting & Incontinence Care', 'personal_care', 'Bathroom assistance, brief changes, catheter care basics', false, 30),
('grooming', 'Grooming', 'personal_care', 'Hair, nails, shaving, oral hygiene', false, 40),
('skin_care', 'Skin Care', 'personal_care', 'Lotion application, pressure-injury prevention', false, 50),

-- Mobility
('transfers', 'Transfers', 'mobility', 'Bed-to-chair, chair-to-toilet, gait belts, Hoyer lifts', false, 110),
('ambulating', 'Walking & Ambulation', 'mobility', 'Walker, cane, fall prevention during movement', false, 120),
('range_of_motion', 'Range of Motion Exercises', 'mobility', 'Passive ROM, light therapy follow-up', false, 130),
('fall_prevention', 'Fall Prevention', 'mobility', 'Environment scan, assistance during high-risk movement', false, 140),

-- Medical Support (CNA scope, not nursing)
('meds_reminder', 'Medication Reminders', 'medical_support', 'Reminding to take meds as scheduled (no administration)', false, 210),
('vitals', 'Vitals Check', 'medical_support', 'Blood pressure, temp, pulse, O2 (basic monitoring)', false, 220),
('blood_glucose', 'Blood Glucose Monitoring', 'medical_support', 'Routine glucose checks for diabetic clients', false, 230),
('wound_care_basic', 'Basic Wound Care', 'medical_support', 'Clean dressings under care plan (non-complex)', false, 240),
('catheter_care', 'Catheter Care', 'medical_support', 'Indwelling and external catheter care', false, 250),
('ostomy_care', 'Ostomy Care', 'medical_support', 'Stoma and ostomy bag care', false, 260),
('oxygen_support', 'Oxygen Support', 'medical_support', 'Concentrator and tank care, cannula hygiene', false, 270),

-- Household
('meal_prep', 'Meal Preparation', 'household', 'Cooking, special diets, feeding assistance', false, 310),
('feeding', 'Feeding Assistance', 'household', 'Help eating, hand-over-hand, swallow precautions', false, 320),
('light_housekeeping', 'Light Housekeeping', 'household', 'Tidying, laundry, dishes — not deep cleaning', false, 330),
('laundry', 'Laundry', 'household', 'Wash, dry, fold, change linens', false, 340),
('errands', 'Errands', 'household', 'Pharmacy pickup, groceries, mail', false, 350),
('pet_care', 'Light Pet Care', 'household', 'Feeding, brief walks (not boarding)', false, 360),

-- Specialty
('dementia_care', 'Dementia & Alzheimer''s Care', 'specialty', 'Memory care, redirection, behavior support', true, 410),
('hospice_support', 'Hospice & End-of-Life Support', 'specialty', 'Comfort care, family support, hospice team coordination', true, 420),
('post_surgical', 'Post-Surgical Care', 'specialty', 'Recovery support, mobility return, wound watching', false, 430),
('parkinson_care', 'Parkinson''s Care', 'specialty', 'Mobility assistance, freezing-of-gait protocols', false, 440),
('stroke_recovery', 'Stroke Recovery Support', 'specialty', 'Affected-side care, communication patience', false, 450),
('cardiac_care', 'Cardiac Care', 'specialty', 'Activity pacing, edema monitoring', false, 460),
('respiratory_care', 'Respiratory Care', 'specialty', 'COPD support, pursed-lip breathing cues, O2', false, 470),
('pediatric_care', 'Pediatric Care', 'specialty', 'Child/teen with special needs (under physician guidance)', true, 480),
('bariatric_care', 'Bariatric Care', 'specialty', 'Higher-weight clients, specialized equipment', false, 490),

-- Companionship
('companionship', 'Companionship', 'companionship', 'Conversation, games, reading, social engagement', false, 510),
('transportation', 'Transportation', 'companionship', 'Drive to appointments, errands (driver''s license required)', false, 520),
('social_outings', 'Social Outings', 'companionship', 'Accompany to events, walks, family visits', false, 530),
('religious_support', 'Religious & Spiritual Support', 'companionship', 'Accompany to services, read scripture', false, 540),

-- Overnight
('overnight', 'Overnight Care', 'overnight', 'Awake or asleep overnight, varies by client need', false, 610),
('live_in', 'Live-In Care', 'overnight', 'Multi-day in-home stays', false, 620),
('on_call', 'On-Call Coverage', 'overnight', 'Backup or as-needed scheduling', false, 630),
('respite', 'Respite Care', 'overnight', 'Short-term relief for primary caregivers', false, 640)
on conflict (key) do nothing;
