import { useEffect, useState } from 'react';
import { getDetails, posterUrl } from '../api.js';
import CountryPicker from './CountryPicker.jsx';

const GROUPS = [
  { key: 'flatrate', label: 'Stream' },
  { key: 'free', label: 'Free' },
  { key: 'ads', label: 'Free with ads' },
  { key: 'rent', label: 'Rent' },
  { key: 'buy', label: 'Buy' },
];

function metaLine(data, type) {
  const date = data.release_date || data.first_air_date || '';
  const parts = [date.slice(0, 4)];

  if (type === 'movie' && data.runtime) {
    parts.push(`${data.runtime} min`);
  }
  if (type === 'tv' && data.number_of_seasons) {
    const n = data.number_of_seasons;
    parts.push(`${n} season${n > 1 ? 's' : ''}`);
  }
  if (data.vote_average) {
    parts.push(`★ ${data.vote_average.toFixed(1)}`);
  }
  return parts.filter(Boolean).join(' · ');
}

export default function Detail({ type, id, country, regions, onCountryChange }) {
  const key = `${type}-${id}`;
  const [state, setState] = useState({ key: '', data: null, error: '' });

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;

    getDetails(type, id)
      .then((data) => {
        if (!cancelled) setState({ key, data, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState({ key, data: null, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [type, id, key]);

  const back = (
    <a className="back" href="#/">
      ← Back to browse
    </a>
  );

  if (state.key !== key) {
    return (
      <main className="container">
        {back}
        <p className="notice">Loading…</p>
      </main>
    );
  }

  if (state.error) {
    return (
      <main className="container">
        {back}
        <p className="notice">Could not load this title: {state.error}</p>
      </main>
    );
  }

  const { data } = state;
  const name = data.title || data.name;
  const backdrop = posterUrl(data.backdrop_path, 'w780');
  const poster = posterUrl(data.poster_path, 'w342');
  const trailer = data.videos?.results?.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  );

  // TMDB sends every country at once, so changing country needs no new request
  const countryName =
    regions.find((r) => r.iso_3166_1 === country)?.english_name || country;
  const info = data['watch/providers']?.results?.[country];
  const groups = info ? GROUPS.filter((g) => info[g.key]?.length > 0) : [];

  return (
    <main className="detail">
      {backdrop && (
        <div
          className="detail-backdrop"
          style={{ backgroundImage: `url(${backdrop})` }}
        />
      )}

      <div className="container detail-body">
        {back}

        <div className="detail-layout">
          {poster ? (
            <img className="detail-poster" src={poster} alt={`${name} poster`} />
          ) : (
            <div className="detail-poster card-noposter">No poster</div>
          )}

          <div className="detail-info">
            <h2 className="detail-title">{name}</h2>
            <p className="detail-meta">{metaLine(data, type)}</p>

            {data.genres?.length > 0 && (
              <div className="chips">
                {data.genres.map((g) => (
                  <span key={g.id} className="chip">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {data.tagline && <p className="detail-tagline">{data.tagline}</p>}
            <p className="detail-overview">
              {data.overview || 'No description available.'}
            </p>

            {trailer && (
              <a
                className="btn"
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                ▶ Watch trailer
              </a>
            )}
          </div>
        </div>

        <section className="where">
          <h3 className="where-title">Where to watch in {countryName}</h3>

          <CountryPicker
            country={country}
            regions={regions}
            onChange={onCountryChange}
          />

          {groups.length === 0 && (
            <p className="notice">
              Not listed on any streaming platform in {countryName} right now.
              Try another country above.
            </p>
          )}

          {groups.map((g) => (
            <div key={g.key} className="where-row">
              <span className="where-label">{g.label}</span>
              <div className="providers">
                {info[g.key].map((p) => (
                  <div key={p.provider_id} className="provider">
                    {p.logo_path && (
                      <img src={posterUrl(p.logo_path, 'w92')} alt="" />
                    )}
                    <span>{p.provider_name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {info?.link && (
            <a
              className="where-more"
              href={info.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              See full listing →
            </a>
          )}
          <p className="credit">Streaming data by JustWatch</p>
        </section>
      </div>
    </main>
  );
}