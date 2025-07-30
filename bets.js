import supabase from '../../lib/supabase';

export default async function handler(req, res) {
  const { username } = req.query;

  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('username', username);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json(data);
}
