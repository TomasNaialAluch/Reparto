import React from 'react';
import { IconFootball } from '../../../gestionSemanal/icons';
import { useMundialLiveData } from './useMundialLiveData';
import {
  formatMundialDate,
  formatMundialTime,
  matchStatusEs,
} from './mundialApi';

const TeamLogo = ({ src, name, size = 18 }) =>
  src ? (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ objectFit: 'contain', flexShrink: 0 }}
    />
  ) : (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#e9ecef',
        flexShrink: 0,
        display: 'inline-block',
      }}
      title={name}
    />
  );

const LiveDot = () => (
  <span
    aria-hidden
    style={{
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: '#dc3545',
      display: 'inline-block',
      animation: 'fab-mundial-pulse 1.2s ease-in-out infinite',
    }}
  />
);

const MatchRow = ({ match, accentColor }) => {
  const isLive = match.state === 'in';
  const isDone = match.state === 'post';

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: '10px',
        border: `1px solid ${isLive ? accentColor : '#e3e8ec'}`,
        background: isLive ? 'rgba(106,136,153,0.08)' : '#fafbfc',
        marginBottom: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '0.65rem', color: '#6c757d', fontWeight: 600 }}>
          {match.group || 'Mundial 2026'}
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: isLive ? '#dc3545' : isDone ? '#6c757d' : accentColor,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          {isLive && <LiveDot />}
          {isLive && match.clock ? `${match.clock} · ` : ''}
          {matchStatusEs(match.state, match.statusLabel)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <TeamLogo src={match.home.logo} name={match.home.name} />
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: match.home.name === 'Argentina' ? 700 : 500,
              color: '#212529',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {match.home.name}
          </span>
        </div>
        <div
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#212529',
            minWidth: '52px',
            textAlign: 'center',
          }}
        >
          {isDone || isLive ? `${match.home.score} - ${match.away.score}` : formatMundialTime(match.date)}
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px',
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: match.away.name === 'Argentina' ? 700 : 500,
              color: '#212529',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'right',
            }}
          >
            {match.away.name}
          </span>
          <TeamLogo src={match.away.logo} name={match.away.name} />
        </div>
      </div>

      {match.venue && (
        <div style={{ fontSize: '0.68rem', color: '#8a939c', marginTop: '6px' }}>{match.venue}</div>
      )}
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <div
    style={{
      fontSize: '0.65rem',
      fontWeight: 600,
      color: '#6c757d',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      margin: '14px 0 8px',
    }}
  >
    {children}
  </div>
);

const Skeleton = () => (
  <div aria-busy="true">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          height: 72,
          borderRadius: 10,
          background: 'linear-gradient(90deg,#eef1f3 25%,#f8f9fa 50%,#eef1f3 75%)',
          backgroundSize: '200% 100%',
          animation: 'fab-mundial-shimmer 1.2s infinite',
          marginBottom: 8,
        }}
      />
    ))}
  </div>
);

/**
 * Panel modal con datos en vivo del Mundial FIFA 2026 (ESPN).
 */
const MundialFabPanel = ({ accentColor = '#6A8899' }) => {
  const { data, loading, error, refreshing, reload } = useMundialLiveData();

  const sortedMatches = [...(data?.matches ?? [])].sort((a, b) => {
    const order = { in: 0, pre: 1, post: 2 };
    return (order[a.state] ?? 9) - (order[b.state] ?? 9);
  });

  const liveMatches = sortedMatches.filter((m) => m.state === 'in');
  const todayMatches = sortedMatches;

  return (
    <>
      <style>{`
        @keyframes fab-mundial-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes fab-mundial-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '10px',
          background: 'rgba(106,136,153,0.1)',
          marginBottom: '14px',
          borderLeft: `3px solid ${accentColor}`,
        }}
      >
        <span style={{ color: '#3a5060' }}>
          <IconFootball size={22} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.78rem', color: '#3a5060', lineHeight: 1.4 }}>
            <strong>
              {data?.liveCount ? `${data.liveCount} en vivo` : 'Mundial 2026'}
            </strong>
            {data?.phase ? ` · ${data.phase}` : ''}
          </div>
          {data?.day && (
            <div style={{ fontSize: '0.68rem', color: '#8a939c', marginTop: 2 }}>
              {formatMundialDate(`${data.day}T12:00:00`)}
              {data.updatedAt && (
                <>
                  {' '}
                  · Actualizado {formatMundialTime(data.updatedAt)}
                  {refreshing ? '…' : ''}
                </>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={refreshing}
          style={{
            border: '1px solid #d3d9de',
            background: 'white',
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: '0.68rem',
            color: '#6c757d',
            cursor: refreshing ? 'wait' : 'pointer',
            flexShrink: 0,
          }}
        >
          ↻
        </button>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <div
          style={{
            padding: '12px',
            borderRadius: 10,
            background: '#fff5f5',
            border: '1px solid #f5c2c7',
            fontSize: '0.8rem',
            color: '#842029',
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {liveMatches.length > 0 && (
            <>
              <SectionTitle>En vivo ahora</SectionTitle>
              {liveMatches.map((m) => (
                <MatchRow key={m.id} match={m} accentColor={accentColor} />
              ))}
            </>
          )}

          {todayMatches.length > 0 && (
            <>
              <SectionTitle>Partidos de hoy</SectionTitle>
              {todayMatches.map((m) => (
                <MatchRow key={`today-${m.id}`} match={m} accentColor={accentColor} />
              ))}
            </>
          )}

          {todayMatches.length === 0 && (
            <p style={{ fontSize: '0.8rem', color: '#6c757d', margin: '0 0 12px' }}>
              No hay partidos programados para hoy.
            </p>
          )}

          {(data.argentinaNext || data.argentinaLast) && (
            <>
              <SectionTitle>Argentina</SectionTitle>
              {data.argentinaLast && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: '0.72rem', color: '#6c757d', marginBottom: 6 }}>
                    Último resultado
                    {data.argentinaLast.dateLocal ? ` · ${data.argentinaLast.dateLocal}` : ''}
                  </div>
                  <MatchRow match={data.argentinaLast} accentColor={accentColor} />
                </div>
              )}
              {data.argentinaNext && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: '0.72rem', color: '#6c757d', marginBottom: 6 }}>
                    Próximo partido
                    {data.argentinaNext.dateLocal
                      ? ` · ${data.argentinaNext.dateLocal}`
                      : ` · ${formatMundialDate(data.argentinaNext.date)} ${formatMundialTime(data.argentinaNext.date)}`}
                  </div>
                  <MatchRow match={data.argentinaNext} accentColor={accentColor} />
                </div>
              )}
            </>
          )}

          {data.argentinaGroup && (
            <>
              <SectionTitle>{data.argentinaGroup.name}</SectionTitle>
              <div
                style={{
                  borderRadius: 10,
                  border: '1px solid #e3e8ec',
                  overflow: 'hidden',
                  fontSize: '0.75rem',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 28px 36px 32px',
                    gap: 4,
                    padding: '6px 10px',
                    background: '#f1f3f5',
                    color: '#6c757d',
                    fontWeight: 600,
                    fontSize: '0.62rem',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>Equipo</span>
                  <span>PJ</span>
                  <span>DG</span>
                  <span>Pts</span>
                </div>
                {data.argentinaGroup.teams.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 28px 36px 32px',
                      gap: 4,
                      padding: '7px 10px',
                      borderTop: '1px solid #eef1f3',
                      background: t.name === 'Argentina' ? 'rgba(106,136,153,0.1)' : 'white',
                      fontWeight: t.name === 'Argentina' ? 700 : 400,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <TeamLogo src={t.logo} name={t.name} size={16} />
                      {t.name}
                    </span>
                    <span>{t.played}</span>
                    <span>{t.gd}</span>
                    <span>{t.pts}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <p style={{ fontSize: '0.68rem', color: '#8a939c', margin: '14px 0 0', lineHeight: 1.4 }}>
            Datos en vivo vía ESPN · caché local y Firestore · cada 15 min.
          </p>
        </>
      )}
    </>
  );
};

export default MundialFabPanel;
