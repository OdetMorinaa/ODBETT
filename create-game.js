import supabase from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { title, team1, team2, odds1, odds2 } = req.body;

  const { error } = await supabase
    .from('games')
    .insert([{ title, team1, team2, odds1, odds2, result: null }]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: 'Game created' });
}
