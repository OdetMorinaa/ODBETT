import supabase from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { gameId, winner } = req.body;

  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (!game) return res.status(404).json({ error: 'Game not found' });

  await supabase
    .from('games')
    .update({ result: winner })
    .eq('id', gameId);

  const { data: bets } = await supabase
    .from('bets')
    .select('*')
    .eq('gameId', gameId);

  for (const bet of bets) {
    const didWin = bet.team === winner;
    const newStatus = didWin ? 'won' : 'lost';

    if (didWin) {
      await supabase
        .from('users')
        .update({ points: bet.amount * bet.odds })
        .eq('username', bet.username)
        .increment('points', bet.amount * bet.odds);
    }

    await supabase
      .from('bets')
      .update({ status: newStatus })
      .eq('id', bet.id);
  }

  res.status(200).json({ message: 'Game resolved' });
}
