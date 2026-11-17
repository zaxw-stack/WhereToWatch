import { useEffect, useState } from 'react';
import { getBrowse, searchTitles, getRegions, hasKey } from './api.js';
import TitleCard from './components/TitleCard.jsx';
import Detail from './components/Detail.jsx';
import Tabs from './components/Tabs.jsx';

const DEFAULT_COUNTRY = 'KE';

const TABS = [
  { id: 'trending', label: 'Trending', heading: 'Trending this week' },
  { id: 'movies', label: 'Movies', heading: 'Trending movies this week' },
  { id: 'series', label: 'Series', heading: 'Trending series this week' },
  { id: 'anime', label: 'Anime', heading: 'Popular anime' },
];

// "#/movie/123" becomes { type: 'movie', id: 123 }. Anything else is the home page.
function parseRoute() {
  const match = window.location.hash.match(/^#\/(movie|tv)\/(\d+)$/);
  return match ? { type: match[1], id: Number(match[2]) } : null;
}

function loadSavedCountry() {
  try {
    return localStorage.getItem('country') || DEFAULT_COUNTRY;
  } catch {
    return DEFAULT_COUNTRY;
  }
}

export default function App() {
  const [route, setRoute] = useState(parseRoute);

  const [country, setCountry] = useState(loadSavedCountry);
  const [regions, setRegions] = useState([]);

  const [tab, setTab] = useState('trending');
  const [browse, setBrowse] = useState({ tab: '', items: [] });
  const [error, setError] = useState(
    hasKey ? '' : 'No API key found. Check your .env file and restart npm run dev.'
  );

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ q: '', items: [] });

  const q = query.trim();
  const isSearching = q.length >= 2;
  const resultsReady = isSearching && results.q === q;
  const browseReady = browse.tab === tab;

  // Switch pages when the address bar's #part changes
  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Load the country list once
  useEffect(() => {
    if (!hasKey) return;

    // If this fails, the picker still works with the saved country
    getRegions()
      .then(setRegions)
      .catch(() => {});
  }, []);

  // Load the list for the active tab
  useEffect(() => {
    if (!hasKey) return;

    let cancelled = false;
    getBrowse(tab)
      .then((items) => {
        if (!cancelled) setBrowse({ tab, items });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [tab]);

  // Search 0.3s after the user stops typing
  useEffect(() => {
    if (!hasKey || q.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      setError('');
      searchTitles(q)
        .then((items) => {
          if (!cancelled) setResults({ q, items });
        })
        .catch((err) => {
          if (!cancelled) setError(err.message);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  function handleSearchChange(e) {
    setQuery(e.target.value);
    if (route) window.location.hash = '#/';
  }

  function handleTabChange(id) {
    setTab(id);
    setQuery('');
    if (hasKey) setError('');
    if (route) window.location.hash = '#/';
  }

  function handleCountryChange(code) {
    setCountry(code);
    try {
      localStorage.setItem('country', code);
    } catch {
      // Saving is optional, so ignore storage errors
    }
  }

  const activeTab = TABS.find((t) => t.id === tab);
  const list = isSearching ? (resultsReady ? results.items : []) : browse.items;
  const busy = !error && (isSearching ? !resultsReady : !browseReady);
  const heading = isSearching ? `Results for “${q}”` : activeTab.heading;

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <h1 className="logo">
            <a href="#/" onClick={() => setQuery('')}>
              Where<span>To</span>Watch
            </a>
          </h1>
          <input
            className="search"
            type="search"
            placeholder="Search movies, series, anime…"
            value={query}
            onChange={handleSearchChange}
          />
        </div>
      </header>

      {route ? (
        <Detail
          type={route.type}
          id={route.id}
          country={country}
          regions={regions}
          onCountryChange={handleCountryChange}
        />
      ) : (
        <main className="container">
          <Tabs tabs={TABS} active={isSearching ? '' : tab} onChange={handleTabChange} />

          <h2 className="section-title">{heading}</h2>

          {error && <p className="notice">{error}</p>}
          {busy && <p className="notice">Loading…</p>}
          {resultsReady && list.length === 0 && (
            <p className="notice">No results found. Try another spelling.</p>
          )}

          <div className="grid">
            {list.map((item) => (
              <TitleCard key={`${item.media_type}-${item.id}`} title={item} />
            ))}
          </div>
        </main>
      )}

      <footer className="site-footer">
        <p>
          This product uses the TMDB API but is not endorsed or certified by TMDB.
          Streaming availability data provided by JustWatch.
        </p>
      </footer>
    </>
  );
}