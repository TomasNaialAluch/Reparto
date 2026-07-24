const ESPN = 'https://site.api.espn.com/apis';
const BOCA_ID = '5';
const LEAGUE = 'arg.1';

const stat = (entry, name) =>
  entry.stats?.find((s) => s.name === name)?.displayValue ?? '—';

const scoreValue = (competitor) => {
  const score = competitor?.score;
  if (score == null) return '-';
  return typeof score === 'object' ? score.displayValue ?? '-' : score;
};

const parseBocaEvent = (event) => {
  const comp = event.competitions?.[0];
  if (!comp) return null;

  const home = comp.competitors?.find((c) => c.homeAway === 'home');
  const away = comp.competitors?.find((c) => c.homeAway === 'away');
  const status = comp.status?.type;

  return {
    id: event.id,
    home: {
      name: home?.team?.displayName ?? '—',
      score: scoreValue(home),
      logo: home?.team?.logos?.[0]?.href,
    },
    away: {
      name: away?.team?.displayName ?? '—',
      score: scoreValue(away),
      logo: away?.team?.logos?.[0]?.href,
    },
    state: status?.state ?? 'pre',
    statusLabel: status?.shortDetail || status?.description || 'Programado',
    clock: comp.status?.displayClock,
    venue: comp.venue?.fullName,
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
});

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

export const fetchBocaLiveData = async (signal) => {
  const [schedule, standings, team] = await Promise.all([
    fetchJson(`${ESPN}/site/v2/sports/soccer/${LEAGUE}/teams/${BOCA_ID}/schedule`, signal, 8000),
    fetchJson(`${ESPN}/v2/sports/soccer/${LEAGUE}/standings`, signal, 8000),
    fetchJson(`${ESPN}/site/v2/sports/soccer/${LEAGUE}/teams/${BOCA_ID}`, signal, 8000),
  ]);

  const events = (schedule.events || [])
    .map(parseBocaEvent)
    .filter(Boolean)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const live = events.find((e) => e.state === 'in') ?? null;
  const past = events.filter((e) => e.state === 'post');
  const upcoming = events.filter((e) => e.state === 'pre');

  const last = past.length ? past[past.length - 1] : null;
  // El endpoint de schedule solo trae el torneo ya jugado (ej. Apertura) — el próximo
  // partido suele estar en otro torneo (ej. Clausura) que aparece en team.nextEvent.
  const next = upcoming.length
    ? upcoming[0]
    : parseBocaEvent(team.team?.nextEvent?.[0]) ?? null;

  const groups = standings.children || [];
  const bocaGroupRaw = groups.find((g) =>
    g.standings?.entries?.some((e) => e.team?.id === BOCA_ID)
  );

  const bocaGroup = bocaGroupRaw
    ? {
        name: bocaGroupRaw.name,
        teams: (bocaGroupRaw.standings?.entries || []).map(parseStandingRow),
      }
    : null;

  const phase = schedule.season?.displayName || schedule.season?.name || 'Liga Profesional Argentina';

  return {
    phase,
    live,
    last,
    next,
    bocaGroup,
    updatedAt: new Date().toISOString(),
  };
};

export const formatBocaTime = (isoDate) => {
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

export const formatBocaDate = (isoDate) => {
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
