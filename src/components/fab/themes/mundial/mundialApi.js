const ESPN = 'https://site.api.espn.com/apis';
const ARGENTINA_ID = '202';
const WORLD_CUP_GAMES = 'https://worldcup26.ir/get/games';

const stat = (entry, name) =>
  entry.stats?.find((s) => s.name === name)?.displayValue ?? '—';

const parseEspnMatch = (event) => {
  const comp = event.competitions?.[0];
  if (!comp) return null;

  const home = comp.competitors?.find((c) => c.homeAway === 'home');
  const away = comp.competitors?.find((c) => c.homeAway === 'away');
  const status = comp.status?.type;

  return {
    id: event.id,
    home: {
      name: home?.team?.displayName ?? '—',
      score: home?.score ?? '-',
      logo: home?.team?.logos?.[0]?.href,
    },
    away: {
      name: away?.team?.displayName ?? '—',
      score: away?.score ?? '-',
      logo: away?.team?.logos?.[0]?.href,
    },
    state: status?.state ?? 'pre',
    statusLabel: status?.shortDetail || status?.description || 'Programado',
    clock: comp.status?.displayClock,
    venue: comp.venue?.fullName,
    group: comp.altGameNote || comp.notes?.[0]?.headline || '',
    date: event.date,
  };
};

const parseStandingRow = (entry) => ({
  id: entry.team?.id,
  name: entry.team?.displayName ?? '—',
  logo: entry.team?.logos?.[0]?.href,
  played: stat(entry, 'gamesPlayed'),
  gd: stat(entry, 'pointDifferential'),
  pts: stat(entry, 'points'),
  note: entry.note?.description,
});

const parseWorldcupDate = (localDate) => {
  const [datePart, timePart = '00:00'] = String(localDate).split(' ');
  const [mm, dd, yyyy] = datePart.split('/');
  return new Date(`${yyyy}-${mm}-${dd}T${timePart}:00`);
};

const parseWorldcup26Argentina = (games) => {
  const argGames = (games || []).filter(
    (g) => g.home_team_name_en === 'Argentina' || g.away_team_name_en === 'Argentina'
  );

  const upcoming = argGames
    .filter((g) => String(g.finished).toUpperCase() !== 'TRUE')
    .map((g) => ({
      id: g.id,
      home: { name: g.home_team_name_en, score: g.home_score },
      away: { name: g.away_team_name_en, score: g.away_score },
      state: 'pre',
      statusLabel: 'Programado',
      venue: null,
      group: g.group ? `Grupo ${g.group}` : '',
      date: parseWorldcupDate(g.local_date).toISOString(),
      dateLocal: g.local_date,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const played = argGames
    .filter((g) => String(g.finished).toUpperCase() === 'TRUE')
    .map((g) => ({
      id: g.id,
      home: { name: g.home_team_name_en, score: g.home_score },
      away: { name: g.away_team_name_en, score: g.away_score },
      state: 'post',
      statusLabel: 'Final',
      venue: null,
      group: g.group ? `Grupo ${g.group}` : '',
      date: parseWorldcupDate(g.local_date).toISOString(),
      dateLocal: g.local_date,
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    next: upcoming[0] ?? null,
    last: played[0] ?? null,
  };
};

const fetchJson = async (url, signal, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
};

export const fetchMundialLiveData = async (signal) => {
  const [scoreboard, standings] = await Promise.all([
    fetchJson(`${ESPN}/site/v2/sports/soccer/fifa.world/scoreboard`, signal, 8000),
    fetchJson(`${ESPN}/v2/sports/soccer/fifa.world/standings`, signal, 8000),
  ]);

  const matches = (scoreboard.events || []).map(parseEspnMatch).filter(Boolean);
  const liveCount = matches.filter((m) => m.state === 'in').length;

  const groups = standings.children || [];
  const argGroup = groups.find((g) =>
    g.standings?.entries?.some((e) => e.team?.id === ARGENTINA_ID)
  );

  const argentinaGroup = argGroup
    ? {
        name: argGroup.name,
        teams: (argGroup.standings?.entries || []).map(parseStandingRow),
      }
    : null;

  const argentinaLast =
    matches.find((m) => m.home.name === 'Argentina' || m.away.name === 'Argentina') ?? null;

  let argentinaNext = null;
  let argentinaLastPlayed = argentinaLast?.state === 'post' ? argentinaLast : null;

  try {
    const wc = await fetchJson(WORLD_CUP_GAMES, signal, 12000);
    const arg = parseWorldcup26Argentina(wc.games);
    argentinaNext = arg.next;
    if (!argentinaLastPlayed) argentinaLastPlayed = arg.last;
  } catch {
    argentinaNext = null;
  }

  const phase =
    scoreboard.leagues?.[0]?.season?.displayName ||
    scoreboard.season?.displayName ||
    'FIFA World Cup 2026';

  return {
    day: scoreboard.day?.date,
    phase,
    matches,
    liveCount,
    argentinaGroup,
    argentinaLast: argentinaLastPlayed,
    argentinaNext,
    updatedAt: new Date().toISOString(),
  };
};

export const formatMundialTime = (isoDate) => {
  if (!isoDate) return '—';
  try {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date(isoDate));
  } catch {
    return '—';
  }
};

export const formatMundialDate = (isoDate) => {
  if (!isoDate) return '—';
  try {
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date(isoDate));
  } catch {
    return '—';
  }
};

export const matchStatusEs = (state, statusLabel) => {
  if (state === 'in') return 'En vivo';
  if (state === 'post') return statusLabel === 'FT' ? 'Final' : statusLabel || 'Final';
  return 'Programado';
};
