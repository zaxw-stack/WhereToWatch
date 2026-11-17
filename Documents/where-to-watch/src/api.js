const BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';
const KEY = (import.meta.env.VITE_TMDB_KEY || '').trim();

export const hasKey = KEY.length > 0;

async function get(path, params = {}) {
  const url = new URL(BASE + path);
  const headers = { accept: 'application/json' };

  // A v4 token is very long; a v3 key is short (32 characters)
  if (KEY.length > 40) {
    headers.Authorization = `Bearer ${KEY}`;
  } else {
    url.searchParams.set('api_key', KEY);
  }

  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`TMDB error ${res.status}`);
  }
  return res.json();
}

// Works for posters, backdrops and provider logos
export function posterUrl(path, size = 'w342') {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

// Some TMDB lists don't say if an item is a movie or a series, so we add it
function tag(items, mediaType) {
  return items.map((item) => ({ ...item, media_type: mediaType }));
}

// The lists shown on the home page, one per tab
export async function getBrowse(tab) {
  if (tab === 'movies') {
    const data = await get('/trending/movie/week');
    return tag(data.results, 'movie');
  }

  if (tab === 'series') {
    const data = await get('/trending/tv/week');
    return tag(data.results, 'tv');
  }

  if (tab === 'anime') {
    // Anime = animation (genre 16) made in Japan, both series and films
    const params = {
      with_genres: '16',
      with_origin_country: 'JP',
      sort_by: 'popularity.desc',
      'vote_count.gte': '30',
      include_adult: 'false',
    };
    const [series, films] = await Promise.all([
      get('/discover/tv', params),
      get('/discover/movie', params),
    ]);
    return [...tag(series.results, 'tv'), ...tag(films.results, 'movie')].sort(
      (a, b) => b.popularity - a.popularity
    );
  }

  // Default tab: movies and series mixed
  const data = await get('/trending/all/week');
  return data.results.filter(
    (item) => item.media_type === 'movie' || item.media_type === 'tv'
  );
}

// Searches movies and TV (anime is listed under TV) in one request
export async function searchTitles(query) {
  const data = await get('/search/multi', { query, include_adult: 'false' });
  return data.results.filter(
    (item) => item.media_type === 'movie' || item.media_type === 'tv'
  );
}

// One request returns the details, trailers and streaming platforms together
export function getDetails(type, id) {
  return get(`/${type}/${id}`, { append_to_response: 'videos,watch/providers' });
}

// Every country TMDB has streaming data for, sorted A to Z
export async function getRegions() {
  const data = await get('/watch/providers/regions');
  return data.results.sort((a, b) => a.english_name.localeCompare(b.english_name));
}