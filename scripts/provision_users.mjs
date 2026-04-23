import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdlqkorvuawljjzmkhms.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbHFrb3J2dWF3bGpqem1raG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM2OTE3MCwiZXhwIjoyMDkwOTQ1MTcwfQ.8iimn6YZHzGB_w7VM5FXqL4E74nCWOPDIYoTSMWQjcs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const emails = [
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

const topics = [
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

async function run() {
    console.log("🚀 Starting clean provisioning via Supabase API...");

    // 1. Fetch and delete existing users (except admin)
    console.log("🧹 Cleaning up broken users...");
    const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    
    if (listData?.users) {
        for (const u of listData.users) {
            if (u.email !== 'admin@skillforge.io' && u.email !== '123@skillforge.io') {
                await supabase.auth.admin.deleteUser(u.id);
            }
        }
    }

    // 2. Provision new users properly
    console.log(`\n⏳ Provisioning ${emails.length} users...`);
    let i = 0;
    
    for (const e of emails) {
        const assigned_topic = topics[i % topics.length];
        i++;
        
        const role = (e === 'sathwik.shetty@inunity.in') ? 'admin' : 'candidate';

        // Use the Admin API to correctly setup identities, passwords, and triggers
        const { data: userObj, error: createErr } = await supabase.auth.admin.createUser({
            email: e,
            password: e, // Password is the exact email
            email_confirm: true,
            user_metadata: { full_name: e.split('@')[0] }
        });

        if (createErr) {
            console.error(`❌ Failed to create ${e}:`, createErr.message);
            continue;
        }

        const userId = userObj.user.id;

        // Since we dropped the database trigger, we must UPSERT the profile
        const { error: profileErr } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                full_name: e.split('@')[0],
                email: e,
                role: role,
                round2_topic: assigned_topic,
                round2_status: 'pending'
            });

        if (profileErr) {
            console.error(`⚠️ Failed to update profile for ${e}:`, profileErr.message);
        } else {
            console.log(`✅ Provisioned: ${e}`);
        }
    }

    console.log("\n🎉 All 43 users fully provisioned! They can log in immediately.");
}

run().catch(console.error);
