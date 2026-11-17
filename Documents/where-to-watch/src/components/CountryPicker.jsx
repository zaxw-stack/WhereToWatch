import './CountryPicker.css';

export default function CountryPicker({ country, regions, onChange }) {
  return (
    <label className="country-picker">
      <span>Country</span>
      <select value={country} onChange={(e) => onChange(e.target.value)}>
        {regions.length === 0 && <option value={country}>{country}</option>}
        {regions.map((r) => (
          <option key={r.iso_3166_1} value={r.iso_3166_1}>
            {r.english_name}
          </option>
        ))}
      </select>
    </label>
  );
}