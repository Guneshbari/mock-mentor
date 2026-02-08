const supabase = require('../src/services/supabase');

(async function(){
  try {
    console.log('Querying latest 10 sessions...');
    const { data, error } = await supabase
      .from('sessions')
      .select('id, status, final_report, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase error:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('No sessions found');
      return;
    }

    data.forEach(s => {
      console.log(`- ${s.id}: status=${s.status} final_report=${s.final_report ? 'YES' : 'NO'} created_at=${s.created_at}`);
    });
  } catch (err) {
    console.error('Error querying sessions:', err);
    process.exit(1);
  }
})();
