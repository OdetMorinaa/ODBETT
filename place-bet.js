import supabase from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, gameId, team, amount, odds } = req.body;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (!user || user.points < amount) {
    return res.status(400).json({ error: 'Insufficient points' });
  }

  await supabase
    .from('users')
    .update({ points: user.points - amount })
    .eq('username', username);

  const { error } = await supabase
    .from('bets')
    .insert([{ username, gameId, team, amount, odds, status: 'pending' }]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: 'Bet placed' });
}
