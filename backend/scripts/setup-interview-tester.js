require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupInterviewUser() {
  const email = 'interview_tester@example.com';
  const password = 'Password123!';
  
  console.log(`Setting up E2E interview test user: ${email}...`);

  // 1. Delete existing user if exists
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Failed to list users:", listError);
    process.exit(1);
  }

  const existingUser = usersData.users.find(u => u.email === email);
  if (existingUser) {
    console.log(`User already exists (ID: ${existingUser.id}). Deleting to ensure a clean state...`);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
    if (deleteError) {
      console.error("Failed to delete old user:", deleteError);
      process.exit(1);
    }
    console.log("Old user deleted.");
  }

  // 2. Create new confirmed user with onboarding completed
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Interview Tester',
      onboarding_completed: true // Skip onboarding for this test
    }
  });

  if (error) {
    console.error("Failed to create test user:", error);
    process.exit(1);
  }

  console.log(`✅ Interview test user created successfully: ${data.user.id}`);
}

setupInterviewUser();
