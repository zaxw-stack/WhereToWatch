import { posterUrl } from '../api.js';

export default function TitleCard({ title }) {
  const type = title.media_type === 'tv' ? 'tv' : 'movie';
  const name = title.title || title.name;
  const poster = posterUrl(title.poster_path);
  const year = (title.release_date || title.first_air_date || '').slice(0, 4);
  const rating = title.vote_average ? title.vote_average.toFixed(1) : null;

  return (
    <a className="card" href={`#/${type}/${title.id}`}>
      <div className="card-poster">
        {poster ? (
          <img src={poster} alt={`${name} poster`} loading="lazy" />
        ) : (
          <div className="card-noposter">No poster</div>
        )}
        {type === 'tv' && <span className="card-type">TV</span>}
        {rating && <span className="card-rating">★ {rating}</span>}
      </div>
      <h3 className="card-title">{name}</h3>
      <p className="card-year">{year}</p>
    </a>
  );
}