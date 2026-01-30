const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use Service Role Key for backend admin tasks

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing. Database features will be disabled.');
}

// Create a single supabase client for interacting with your database
const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

module.exports = supabase;
