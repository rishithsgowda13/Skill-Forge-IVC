
const emails = [
  "vvce25ec0089@vvce.ac.in",
  "vvce25cse0005@vvce.ac.in",
  "7anikets555@gmail.com",
  "vvce25cse0129@vvce.ac.in",
  "vvce25cse0342@vvce.ac.in",
  "vvce25cse0296@vvce.ac.in",
  "anureddyb20@gmail.com",
  "ardhraraj23@gmail.com",
  "biddappamb@gmail.com",
  "vvce25ec0210@vvce.ac.in",
  "zeyonchris@gmail.com",
  "vvce25me0007@vvce.ac.in",
  "darshandandi07@gmail.com",
  "bhuredeepak321@gmail.com",
  "harshithamd15@gmail.com",
  "kripasingh202007@gmail.com",
  "vvce25cseaiml0076@vvce.ac.in",
  "mehak.ramdeo@gmail.com",
  "vvce25ec0048@vvce.ac.in",
  "vvce25ec0081@vvce.ac.in",
  "vvce25ec0164@vvce.ac.in",
  "vvce25ec0217@vvce.ac.in",
  "vvce25ec0224@vvce.ac.in",
  "pragnavasishta@gmail.com",
  "pranavpr2007@gmail.com",
  "vvce25ec0004@vvce.ac.in",
  "puttashankarprasadyn11@gmail.com",
  "rakeshshreekanth.m.m@gmail.com",
  "sauravanantkar2007@gmail.com",
  "shalini2682007@gmail.com",
  "vvce25cse0491@vvce.ac.in",
  "vvce25cse0388@vvce.ac.in",
  "vvce25cseaiml0182@vvce.ac.in",
  "vvce25cse0191@vvce.ac.in",
  "ushahusha2007@gmail.com",
  "vvce25cse0247@vvce.ac.in",
  "vvce25cseaiml0149@vvce.ac.in",
  "varshanandann18@gmail.com",
  "manohari1009@gmail.com"
];

let sql = `-- 1. Delete all existing data (WARNING: DANGEROUS)
-- Clear submissions and other related tables first to avoid FK issues
TRUNCATE public.submissions CASCADE;
TRUNCATE public.profiles CASCADE;

-- Delete all users from auth.users (except admins if you want to keep them)
-- To keep admins, add: WHERE email NOT IN ('admin_email_here')
DELETE FROM auth.users WHERE email NOT IN ('123@skillforge.io'); -- Example to keep your admin

-- 2. Insert new users
DO $$
DECLARE
    user_id UUID;
    email_text TEXT;
    pass_text TEXT;
BEGIN
`;

emails.forEach(email => {
    const password = email.substring(0, 6).toLowerCase();
    sql += `
    -- Creating account for ${email}
    email_text := '${email}';
    pass_text := '${password}';
    user_id := gen_random_uuid();

    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, recovery_sent_at, last_sign_in_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated', email_text, 
        crypt(pass_text, gen_salt('bf')), 
        now(), NULL, NULL, 
        '{"provider":"email","providers":["email"]}', 
        jsonb_build_object('full_name', split_part(email_text, '@', 1)), 
        now(), now(), '', '', '', ''
    );

    INSERT INTO public.profiles (id, full_name, email, role, created_at)
    VALUES (user_id, split_part(email_text, '@', 1), email_text, 'candidate', now());
`;
});

sql += `
END $$;
`;

console.log(sql);
