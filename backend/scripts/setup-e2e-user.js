require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestUser() {
  const email = 'e2e_tester@example.com';
  const password = 'Password123!';
  const fullName = 'E2E Tester';

  console.log(`Setting up E2E test user: ${email}...`);

  try {
    // Check if user already exists
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) throw usersError;

    const existingUser = usersData.users.find(u => u.email === email);
    
    if (existingUser) {
      console.log(`User already exists (ID: ${existingUser.id}). Deleting to ensure a clean state...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (deleteError) throw deleteError;
      console.log('Old user deleted.');
    }

    // Create user with confirmed email
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        name: fullName,
      }
    });

    if (error) throw error;
    
    console.log(`✅ Test user created successfully: ${data.user.id}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error setting up test user:', error.message || error);
    process.exit(1);
  }
}

setupTestUser();
