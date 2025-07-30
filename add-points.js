import supabase from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, amount } = req.body;

  const { data: user, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (findError || !user) return res.status(404).json({ error: 'User not found' });

  const newPoints = user.points + parseInt(amount);

  const { error } = await supabase
    .from('users')
    .update({ points: newPoints })
    .eq('username', username);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: 'Points added' });
}
