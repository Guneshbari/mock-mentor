// backend/scripts/test-supabase.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
    console.log('Testing Supabase Connection...');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
    console.log('Key:', supabaseKey ? 'Found' : 'Missing');

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase_url')) {
        console.error('❌ Error: Missing or default Supabase credentials in backend/.env');
        console.log('Please update backend/.env with your actual SUPABASE_URL and SUPABASE_SERVICE_KEY');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            // If table doesn't exist (42P01), connection is still good!
            if (error.code === '42P01') {
                console.log('✅ Connected to Supabase! (But "users" table missing - please run schema.sql)');
            } else {
                throw error;
            }
        } else {
            console.log('✅ Successfully connected to Supabase!');
            console.log('✅ "users" table found.');
        }
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
    }
}

testConnection();
