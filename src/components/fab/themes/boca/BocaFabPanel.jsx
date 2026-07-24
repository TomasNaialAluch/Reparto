import React from 'react';
import { useBocaLiveData } from './useBocaLiveData';
import { formatBocaDate, formatBocaTime, matchStatusEs } from './bocaApi';

const BOCA_LOGO = 'https://a.espncdn.com/i/teamlogos/soccer/500/5.png';
const BOCA_NAME = 'Boca Juniors';

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
      animation: 'fab-boca-pulse 1.2s ease-in-out infinite',
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
        background: isLive ? `${accentColor}14` : '#fafbfc',
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
          {matchStatusEs(match.state, match.statusLabel)}
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
          {isLive && match.clock ? `${match.clock}` : ''}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <TeamLogo src={match.home.logo} name={match.home.name} />
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: match.home.name === BOCA_NAME ? 700 : 500,
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
          {isDone || isLive ? `${match.home.score} - ${match.away.score}` : formatBocaTime(match.date)}
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
              fontWeight: match.away.name === BOCA_NAME ? 700 : 500,
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
          animation: 'fab-boca-shimmer 1.2s infinite',
          marginBottom: 8,
        }}
      />
    ))}
  </div>
);

/**
 * Panel modal con datos en vivo de Boca Juniors — Liga Profesional Argentina (ESPN).
 */
const BocaFabPanel = ({ accentColor = '#0b3d8c' }) => {
  const { data, loading, error, refreshing, reload } = useBocaLiveData();

  return (
    <>
      <style>{`
        @keyframes fab-boca-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes fab-boca-shimmer {
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
          background: `${accentColor}1a`,
          marginBottom: '14px',
          borderLeft: `3px solid ${accentColor}`,
        }}
      >
        <TeamLogo src={BOCA_LOGO} name={BOCA_NAME} size={26} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.78rem', color: '#3a5060', lineHeight: 1.4 }}>
            <strong>{data?.live ? 'En vivo' : BOCA_NAME}</strong>
            {data?.phase ? ` · ${data.phase}` : ''}
          </div>
          {data?.updatedAt && (
            <div style={{ fontSize: '0.68rem', color: '#8a939c', marginTop: 2 }}>
              Actualizado {formatBocaTime(data.updatedAt)}
              {refreshing ? '…' : ''}
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
          {data.live && (
            <>
              <SectionTitle>En vivo ahora</SectionTitle>
              <MatchRow match={data.live} accentColor={accentColor} />
            </>
          )}

          {data.last && (
            <>
              <SectionTitle>Último resultado</SectionTitle>
              <MatchRow match={data.last} accentColor={accentColor} />
            </>
          )}

          {data.next && (
            <>
              <SectionTitle>
                Próximo partido · {formatBocaDate(data.next.date)} {formatBocaTime(data.next.date)}
              </SectionTitle>
              <MatchRow match={data.next} accentColor={accentColor} />
            </>
          )}

          {!data.live && !data.last && !data.next && (
            <p style={{ fontSize: '0.8rem', color: '#6c757d', margin: '0 0 12px' }}>
              No hay partidos de Boca para mostrar.
            </p>
          )}

          {data.bocaGroup && (
            <>
              <SectionTitle>{data.bocaGroup.name}</SectionTitle>
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
                {data.bocaGroup.teams.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 28px 36px 32px',
                      gap: 4,
                      padding: '7px 10px',
                      borderTop: '1px solid #eef1f3',
                      background: t.name === BOCA_NAME ? `${accentColor}1a` : 'white',
                      fontWeight: t.name === BOCA_NAME ? 700 : 400,
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

export default BocaFabPanel;
