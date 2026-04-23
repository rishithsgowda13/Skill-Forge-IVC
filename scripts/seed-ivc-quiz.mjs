/**
 * IVC Membership Drive — Quiz Seeder
 * Inserts 30 questions with shuffled options into Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jdlqkorvuawljjzmkhms.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbHFrb3J2dWF3bGpqem1raG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkxNzAsImV4cCI6MjA5MDk0NTE3MH0.18476P31Jz3QIpwjgVu6sV6rCXDeSWCLEyhzEp6QUgs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper: shuffle array and return mapping
function shuffleWithMapping(options, correctIdx) {
  const indices = options.map((_, i) => i);
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const shuffled = indices.map(i => options[i]);
  const newCorrectIdx = indices.indexOf(correctIdx);
  const labels = ['A', 'B', 'C', 'D'];
  return { shuffledOptions: shuffled, correctAnswer: labels[newCorrectIdx] };
}

// All 30 questions: [question_text, [optA, optB, optC, optD], correctIndex (0-based)]
const RAW_QUESTIONS = [
  // Section A — Design Thinking (Q1-Q8)
  [
    "A farmer tells you he is losing crops to monkeys. You are asked to design a solution. What is your FIRST step?",
    [
      "Start sketching a solar-powered monkey-repellent device immediately",
      "Spend a day with the farmer, observing his fields and routine",
      "Search online for existing anti-monkey products",
      "Call a senior and ask what they would build"
    ],
    1 // B
  ],
  [
    "You build a smart dustbin for your college. It works perfectly in the lab but nobody uses it on campus. What is the MOST likely reason?",
    [
      "The code has a bug",
      "Students do not care about cleanliness",
      "You solved a problem users did not feel they had",
      "The dustbin is too small"
    ],
    2 // C
  ],
  [
    "You have 5 ideas for a hackathon. Which is the BEST way to choose one?",
    [
      "Pick the idea that sounds most impressive to judges",
      "Pick the idea you can build in the time given, that solves a real pain",
      "Pick the idea using the most advanced technology",
      "Pick the idea your teammates vote for"
    ],
    1 // B
  ],
  [
    "During user testing of your app, a user holds the phone upside-down. What should you do?",
    [
      "Politely correct them and show the right way",
      "Note it down — your UI may not be intuitive",
      "Assume the user is not tech-savvy and ignore it",
      "Remove that user from your testing pool"
    ],
    1 // B
  ],
  [
    "You are designing a device for visually impaired users. Who should be on your testing panel?",
    [
      "Your classmates wearing blindfolds",
      "Actual visually impaired users from day one",
      "Your professor",
      "Only the team members who built it"
    ],
    1 // B
  ],
  [
    "Your prototype fails on demo day. What is the MATURE response?",
    [
      "Blame the hardware supplier",
      "Hide the failure and talk only about features",
      "Openly show what failed, why, and what you learned",
      "Refuse to demo until it is perfect"
    ],
    2 // C
  ],
  [
    "A teammate says, 'This idea will never work.' What is the BEST response?",
    [
      "'You are right, let us drop it.'",
      "'Let us build the cheapest version and test it in 2 days.'",
      "'You are being negative, stop discouraging the team.'",
      "'Let us ask the professor to decide.'"
    ],
    1 // B
  ],
  [
    "Which of these is NOT a good problem statement for a project?",
    [
      "College students skip breakfast because the canteen opens after their 8 AM class",
      "I want to make an AI app",
      "Elderly patients forget medicine timings, leading to missed doses",
      "Rainwater floods our parking lot every monsoon, damaging vehicles"
    ],
    1 // B
  ],

  // Section B — Communication (Q9-Q14)
  [
    "You have 60 seconds to pitch your project to a busy judge. What do you say FIRST?",
    [
      "A summary of the technology stack used",
      "The problem you solve and who feels it",
      "The team members and their roles",
      "The history of your college club"
    ],
    1 // B
  ],
  [
    "During a team meeting, your junior has a good idea but is too shy to speak. A good member would:",
    [
      "Ignore it — they should learn to speak up on their own",
      "Notice them, and say 'Ravi, you looked like you had a thought — go ahead'",
      "Speak on their behalf and take credit",
      "Tell them to email it later"
    ],
    1 // B
  ],
  [
    "You are presenting your IoT project. Your slide has 14 bullet points and 3 paragraphs. This is:",
    [
      "Perfect — it shows thorough research",
      "A red flag — the audience will read instead of listen to you",
      "Fine, if you read every point aloud",
      "Only a problem if the font is small"
    ],
    1 // B
  ],
  [
    "A judge asks a question you do not know the answer to. You should:",
    [
      "Make up a confident-sounding answer",
      "Say 'I do not know, but here is how I would find out'",
      "Change the subject to something you do know",
      "Blame a teammate for not handling that part"
    ],
    1 // B
  ],
  [
    "You have to explain your hardware project to a non-technical parent at an exhibition. You should:",
    [
      "Use the same technical terms — they can Google later",
      "Explain using an everyday analogy they can relate to",
      "Refuse to explain and ask them to read the poster",
      "Tell them 'it is complicated, you will not understand'"
    ],
    1 // B
  ],
  [
    "You made a mistake in a group chat and blamed someone publicly. The right next step is:",
    [
      "Delete the message quietly",
      "Apologize in the same group where the blame happened",
      "Apologize privately only",
      "Pretend it never happened"
    ],
    1 // B
  ],

  // Section C — Out-of-the-Box Thinking (Q15-Q22)
  [
    "You have a broken umbrella, a motor, a battery, and tape. Which project is the MOST creative?",
    [
      "Throw them away and buy new parts",
      "A hand-cranked phone charger using the motor as a generator",
      "A motorized automatic opening umbrella",
      "There is nothing you can build"
    ],
    1 // B
  ],
  [
    "Your college has frequent power cuts. Instead of complaining, a builder-mindset student would:",
    [
      "Start a petition to the management",
      "Design a low-cost solar backup for critical lab equipment",
      "Skip lab until power is restored",
      "Blame the electricity board"
    ],
    1 // B
  ],
  [
    "A line-following robot suddenly stops working on a glossy floor. The LEAST likely cause is:",
    [
      "IR sensor reflection from the glossy surface",
      "Ambient light interfering with the sensor",
      "The motor is tired",
      "The line-contrast threshold in code is wrong"
    ],
    2 // C
  ],
  [
    "You need to detect if a door is opened, but you have no door sensor. What is the MOST resourceful solution?",
    [
      "Order a door sensor and wait 7 days",
      "Use a tilt switch, a reed switch with a magnet, or a simple LDR with light change",
      "Abandon the project",
      "Ask someone to manually watch the door"
    ],
    1 // B
  ],
  [
    "Two teams present the SAME idea at an ideathon. The winning team will likely be the one that:",
    [
      "Spoke louder",
      "Had the cleanest slides",
      "Showed a working demo, even a small one",
      "Had more team members"
    ],
    2 // C
  ],
  [
    "You are given ₹500 to build something useful. The best strategy is:",
    [
      "Complain that the budget is too small",
      "Pick a problem where ₹500 is enough — constraints force creativity",
      "Add your own money to build something bigger",
      "Ask for a bigger budget before starting"
    ],
    1 // B
  ],
  [
    "A typical IoT device uses Wi-Fi, but your deployment area has no Wi-Fi. What is a good creative alternative?",
    [
      "Give up on the deployment",
      "Use LoRa, GSM, Bluetooth mesh, or even SD-card logging depending on the need",
      "Install Wi-Fi everywhere first",
      "Use only wired Ethernet"
    ],
    1 // B
  ],
  [
    "A classmate calls your idea 'too simple'. The best internal response is:",
    [
      "Abandon the idea",
      "Remember that simple + working + used > complex + broken + ignored",
      "Add unnecessary complexity to look impressive",
      "Argue with them for an hour"
    ],
    1 // B
  ],

  // Section D — Builder Mindset (Q23-Q30)
  [
    "Your Arduino code works on your laptop but not on a teammate's. The FIRST thing to check is:",
    [
      "The teammate's laptop brand",
      "Library versions and board selection in IDE",
      "The weather",
      "Whether the teammate is using a pirated OS"
    ],
    1 // B
  ],
  [
    "You are building a bot for a competition in 3 days. You have a choice between a FANCY new algorithm you do not fully understand and a SIMPLE one you know works. You should:",
    [
      "Pick the fancy one to look advanced",
      "Pick the simple one that you can debug at 2 AM",
      "Try both and pick whichever works first",
      "Ask Google which is better"
    ],
    1 // B
  ],
  [
    "Your sensor is giving noisy readings. BEFORE writing complex filtering code, you should:",
    [
      "Check wiring, power supply, and ground connections",
      "Add a Kalman filter immediately",
      "Replace the sensor",
      "Blame the sensor's datasheet"
    ],
    0 // A
  ],
  [
    "Your team's code is in 5 different files on 5 different laptops. The best fix is:",
    [
      "Email files back and forth",
      "Use Git and a shared repository from day one",
      "Use pen drives",
      "Let one person hold all the files"
    ],
    1 // B
  ],
  [
    "A software project has a working backend and a broken UI. A realistic user will think:",
    [
      "'The backend must be great, I love this app'",
      "'This app is broken'",
      "'Let me read the code to understand'",
      "'I should be patient and wait for updates'"
    ],
    1 // B
  ],
  [
    "You built a hardware device, but the enclosure looks like a mess of wires and tape. This matters because:",
    [
      "It does not matter, function is everything",
      "Presentation affects perception — a clean build signals a reliable builder",
      "Judges are biased",
      "It only matters for marketing students"
    ],
    1 // B
  ],
  [
    "You are asked to add feature X to a working project, but it might break feature Y. The safest path is:",
    [
      "Edit the live code and hope it works",
      "Create a new branch, test feature X, merge only when stable",
      "Delete feature Y first",
      "Ask the user to stop using feature Y"
    ],
    1 // B
  ],
  [
    "At the end of the day, which student is MOST likely to succeed in IVC?",
    [
      "The one with the highest marks",
      "The one who builds something, shows it, breaks it, and builds again",
      "The one with the best laptop",
      "The one who only joins for the certificate"
    ],
    1 // B
  ],
];

async function seed() {
  console.log("🚀 Creating IVC Membership Drive quiz...\n");

  // 1. Create the quiz
  const { data: quiz, error: quizErr } = await supabase
    .from("quizzes")
    .insert({
      title: "IVC Membership Drive",
      description: "Recruitment Quiz — Round 1: Quiz Yourself | 30 Questions • 4 Focus Areas • Builder's Mindset | Sections: Design Thinking, Communication, Out-of-the-Box Thinking, Builder Mindset (HW/SW/IoT)",
      access_code: "IVC2026",
      status: "lobby",
      current_question_index: 0
    })
    .select()
    .single();

  if (quizErr) {
    console.error("❌ Failed to create quiz:", quizErr.message);
    process.exit(1);
  }

  console.log(`✅ Quiz created: "${quiz.title}" (ID: ${quiz.id})`);
  console.log(`🔑 Access Code: ${quiz.access_code}\n`);

  // 2. Build questions with shuffled options
  const questions = RAW_QUESTIONS.map((q, idx) => {
    const [text, options, correctIdx] = q;
    const { shuffledOptions, correctAnswer } = shuffleWithMapping(options, correctIdx);

    return {
      quiz_id: quiz.id,
      question_text: text,
      options: shuffledOptions,
      correct_answer: correctAnswer,
      time_limit: 60,       // 1 minute per question
      points: 100,
      question_type: 'mcq',
      order_index: idx
    };
  });

  // 3. Insert all questions
  const { data: inserted, error: qErr } = await supabase
    .from("questions")
    .insert(questions)
    .select();

  if (qErr) {
    console.error("❌ Failed to insert questions:", qErr.message);
    process.exit(1);
  }

  console.log(`✅ ${inserted.length} questions inserted successfully!\n`);
  console.log("📋 Question Summary:");
  console.log("─".repeat(70));

  inserted.forEach((q, i) => {
    console.log(`  Q${i + 1}. ${q.question_text.substring(0, 65)}...`);
    q.options.forEach((opt, j) => {
      const label = String.fromCharCode(65 + j);
      const marker = label === q.correct_answer ? " ✅" : "";
      console.log(`      ${label}. ${opt.substring(0, 55)}${marker}`);
    });
    console.log();
  });

  console.log("─".repeat(70));
  console.log(`\n🎯 Protocol Ready!`);
  console.log(`   Quiz: ${quiz.title}`);
  console.log(`   Code: ${quiz.access_code}`);
  console.log(`   Questions: ${inserted.length}`);
  console.log(`   Timer: 60s per question`);
  console.log(`   Points: 100 per question (max 3000)`);
  console.log(`\n🔗 Host it at: http://localhost:9090/quiz/host/${quiz.access_code}`);
}

seed().catch(console.error);
