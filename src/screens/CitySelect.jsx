import { useEffect, useState } from "react";
import { searchCities } from "../api/cities";
import { updateMe } from "../api/users";

export function CitySelect({ currentCityId, onSaved }) {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      searchCities(query)
        .then(setCities)
        .catch(() => setCities([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  async function handlePick(city) {
    setSaving(true);
    setError(null);
    try {
      await updateMe({ city_id: city.id });
      onSaved(city);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "24px 18px" }}>
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: "#F5F5F7",
          marginBottom: 14,
        }}
      >
        Укажи свой город
      </div>
      <input
        placeholder="Например, Мытищи"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "13px 14px",
          borderRadius: 14,
          background: "#141418",
          border: "1px solid #232329",
          color: "#F5F5F7",
          fontSize: 14.5,
          outline: "none",
          marginBottom: 12,
        }}
      />
      {error && (
        <div style={{ color: "#FF5D7A", fontSize: 13, marginBottom: 8 }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {cities.map((c) => (
          <div
            key={c.id}
            onClick={() => !saving && handlePick(c)}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              cursor: "pointer",
              background: c.id === currentCityId ? "#1D1D23" : "#141418",
              border: "1px solid #232329",
              color: "#F5F5F7",
              fontSize: 14,
            }}
          >
            {c.name}{" "}
            <span style={{ color: "#8C8C97", fontSize: 12.5 }}>
              · {c.region}
            </span>
          </div>
        ))}
        {query && cities.length === 0 && (
          <div style={{ color: "#8C8C97", fontSize: 13, padding: "8px 4px" }}>
            Город не найден
          </div>
        )}
      </div>
    </div>
  );
}
