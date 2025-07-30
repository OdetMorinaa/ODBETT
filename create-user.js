import supabase from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('username', username);

  if (existingUser.length > 0) {
    return res.status(409).json({ error: 'Username already exists.' });
  }

  const { error } = await supabase
    .from('users')
    .insert([{ username, password, points: 0 }]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: 'User created successfully.' });
}
