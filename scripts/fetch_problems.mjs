import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdlqkorvuawljjzmkhms.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbHFrb3J2dWF3bGpqem1raG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM2OTE3MCwiZXhwIjoyMDkwOTQ1MTcwfQ.8iimn6YZHzGB_w7VM5FXqL4E74nCWOPDIYoTSMWQjcs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
    const { data, error } = await supabase.from('problem_statements').select('*');
    if (error) {
        console.error("Error fetching problem_statements:", error);
    } else {
        console.log("Found", data.length, "problem statements.");
        console.log(data);
    }
}

run();
