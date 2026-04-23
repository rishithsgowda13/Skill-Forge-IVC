import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdlqkorvuawljjzmkhms.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbHFrb3J2dWF3bGpqem1raG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM2OTE3MCwiZXhwIjoyMDkwOTQ1MTcwfQ.8iimn6YZHzGB_w7VM5FXqL4E74nCWOPDIYoTSMWQjcs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function run() {
    console.log("🚀 Starting Topic Assignment...");

    const { data: problems, error: pErr } = await supabase.from('problem_statements').select('text');
    if (pErr) {
        console.error("❌ Error fetching problems:", pErr);
        return;
    }
    
    console.log(`Found ${problems.length} problem statements in database.`);

    // Fetch ONLY candidates (exclude admin)
    const { data: profiles, error: prErr } = await supabase.from('profiles').select('id, email').eq('role', 'candidate');
    if (prErr) {
        console.error("❌ Error fetching profiles:", prErr);
        return;
    }

    console.log(`Found ${profiles.length} candidate profiles in database.`);

    const shuffledProblems = shuffle([...problems]);

    let i = 0;
    for (const profile of profiles) {
        const assigned_topic = shuffledProblems[i % shuffledProblems.length].text;
        
        const { error: updateErr } = await supabase
            .from('profiles')
            .update({ round2_topic: assigned_topic })
            .eq('id', profile.id);

        if (updateErr) {
            console.error(`❌ Failed to assign topic to ${profile.email}:`, updateErr.message);
        } else {
            console.log(`✅ Assigned unique topic to ${profile.email}`);
        }
        
        i++;
    }

    console.log("\n🎉 All candidate topics uniquely assigned successfully!");
}

run();
