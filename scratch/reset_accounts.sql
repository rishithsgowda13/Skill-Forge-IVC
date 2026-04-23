-- ==========================================
-- SKILL FORGE: FIXED MASTER RESET v8
-- ==========================================

-- 0. PRE-REQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- FIX 1: Ensure columns exist in profiles (including research topics)
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS round2_topic TEXT,
ADD COLUMN IF NOT EXISTS round2_status TEXT,
ADD COLUMN IF NOT EXISTS round2_content JSONB;

-- FIX 2: Ensure all required columns exist in submissions before creating views
ALTER TABLE IF EXISTS public.submissions 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_taken FLOAT DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 1. CLEANUP PHASE
TRUNCATE public.submissions CASCADE;
TRUNCATE public.profiles CASCADE;

DELETE FROM auth.users 
WHERE email NOT IN ('admin@skillforge.io', '123@skillforge.io'); 

-- Also clean identities for the deleted users to prevent conflicts
DELETE FROM auth.identities 
WHERE provider = 'email' 
AND email NOT IN ('admin@skillforge.io', '123@skillforge.io');

-- 2. SCHEMA DEFINITION (Submissions & Views)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    points INTEGER DEFAULT 0,
    time_taken FLOAT DEFAULT 0.0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Real-time
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'submissions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
    END IF;
EXCEPTION WHEN OTHERS THEN 
    NULL; -- Skip if publication logic is restricted
END $$;

-- Leaderboard View
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
    sub.quiz_id,
    sub.user_id,
    p.full_name,
    p.email,
    SUM(sub.points) as total_score,
    COUNT(sub.id) as total_questions_answered,
    AVG(sub.time_taken) as avg_response_time,
    MAX(sub.submitted_at) as last_activity
FROM public.submissions sub
JOIN public.profiles p ON sub.user_id = p.id
GROUP BY sub.quiz_id, sub.user_id, p.full_name, p.email
ORDER BY total_score DESC;

-- Detailed Report View
CREATE OR REPLACE VIEW public.participant_detailed_report AS
SELECT 
    s.quiz_id,
    p.full_name,
    q.question_text,
    s.answer as selected_option,
    q.correct_answer,
    s.is_correct,
    s.points as points_awarded,
    s.time_taken,
    s.submitted_at
FROM public.submissions s
JOIN public.profiles p ON s.user_id = p.id
JOIN public.questions q ON s.question_id = q.id;

-- 3. PROVISIONING PHASE (43 Users)
DO $$
DECLARE
    u_id UUID;
    i INTEGER := 0;
    
    -- Array of 43 users
    emails TEXT[] := ARRAY[
        'vvce25ec0089@vvce.ac.in', 'vvce25cse0005@vvce.ac.in', '7anikets555@gmail.com',
        'vvce25cse0129@vvce.ac.in', 'vvce25cse0342@vvce.ac.in', 'vvce25cse0296@vvce.ac.in',
        'anureddyb20@gmail.com', 'ardhraraj23@gmail.com', 'biddappamb@gmail.com',
        'vvce25ec0210@vvce.ac.in', 'zeyonchris@gmail.com', 'vvce25me0007@vvce.ac.in',
        'darshandandi07@gmail.com', 'bhuredeepak321@gmail.com', 'harshithamd15@gmail.com',
        'kripasingh202007@gmail.com', 'vvce25cseaiml0076@vvce.ac.in', 'mehak.ramdeo@gmail.com',
        'vvce25ec0048@vvce.ac.in', 'vvce25ec0081@vvce.ac.in', 'vvce25ec0164@vvce.ac.in',
        'vvce25ec0217@vvce.ac.in', 'vvce25ec0224@vvce.ac.in', 'pragnavasishta@gmail.com',
        'pranavpr2007@gmail.com', 'vvce25ec0004@vvce.ac.in', 'puttashankarprasadyn11@gmail.com',
        'rakeshshreekanth.m.m@gmail.com', 'sauravanantkar2007@gmail.com', 'shalini2682007@gmail.com',
        'vvce25cse0491@vvce.ac.in', 'vvce25cse0388@vvce.ac.in', 'vvce25cseaiml0182@vvce.ac.in',
        'vvce25cse0191@vvce.ac.in', 'ushahusha2007@gmail.com', 'vvce25cse0247@vvce.ac.in',
        'vvce25cseaiml0149@vvce.ac.in', 'varshanandann18@gmail.com', 'manohari1009@gmail.com',
        'bharathece2006@gmail.com', 'vvce25cse0639@vvce.ac.in', 'rishithsgowda22@gmail.com',
        'sathwik.shetty@inunity.in'
    ];
    
    -- Array of problem statements to allocate
    topics TEXT[] := ARRAY[
        'Design a localized mesh-network communication system for disaster-struck areas without cellular coverage.',
        'Develop a predictive maintenance model for industrial IoT sensors using edge-computed machine learning.',
        'Architect a scalable, offline-first educational platform for low-bandwidth rural regions.',
        'Create a decentralized identity verification system using cryptography for remote healthcare access.',
        'Design an automated, drone-based inventory management system for large-scale warehouse operations.',
        'Develop a real-time, AI-driven traffic optimization system that integrates with existing smart city infrastructure.',
        'Build a privacy-preserving biometric authentication system that does not store raw biometric data.',
        'Design a smart agriculture system that optimizes water usage based on hyper-local weather forecasting and soil sensors.',
        'Create a wearable device architecture that monitors localized air quality and syncs via Bluetooth LE.',
        'Architect an energy-efficient consensus mechanism for a lightweight blockchain network.'
    ];
    
    e TEXT;
    p TEXT;
    assigned_topic TEXT;
    assigned_role TEXT;
BEGIN
    FOREACH e IN ARRAY emails
    LOOP
        u_id := gen_random_uuid();
        
        -- Password is exactly the email address
        p := e; 
        
        assigned_topic := topics[(i % array_length(topics, 1)) + 1];
        i := i + 1;

        -- Role assignment logic (make sathwik an admin)
        IF e = 'sathwik.shetty@inunity.in' THEN
            assigned_role := 'admin';
        ELSE
            assigned_role := 'candidate';
        END IF;
        
        -- 1. Insert into auth.users
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000', u_id, 'authenticated', 'authenticated', e, 
            crypt(p, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', 
            jsonb_build_object('full_name', SPLIT_PART(e, '@', 1)), now(), now()
        );

        -- 2. CRITICAL FIX: Insert into auth.identities
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        )
        VALUES (
            gen_random_uuid(), u_id, 
            jsonb_build_object('sub', u_id::text, 'email', e, 'email_verified', true), 
            'email', u_id::text, now(), now(), now()
        );
        
        -- 3. Insert/Update into public.profiles
        INSERT INTO public.profiles (id, full_name, email, role, created_at, round2_topic, round2_status) 
        VALUES (u_id, SPLIT_PART(e, '@', 1), e, assigned_role, now(), assigned_topic, 'pending')
        ON CONFLICT (id) DO UPDATE SET 
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            role = EXCLUDED.role,
            round2_topic = EXCLUDED.round2_topic,
            round2_status = EXCLUDED.round2_status;
            
    END LOOP;
END $$;
