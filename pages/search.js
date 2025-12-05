import { useState } from 'react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  async function onSearch(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const j = await r.json();
      setResults(j.results || []);
    } catch (err) {
      console.error(err);
      alert('Ошибка поиска');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth:800, margin:'40px auto', fontFamily:'sans-serif'}}>
      <h1>AI‑Репликатор Университета</h1>
      <form onSubmit={onSearch}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={"Например: "Хочу IT‑универ, чтобы был обмен в Корею, сильный ML, общежитие и спортзал""}
          style={{width:'100%', padding:12, minHeight:80}}
        />
        <div style={{marginTop:8}}>
          <button type="submit" disabled={loading} style={{padding:'8px 12px'}}>
            {loading ? 'Ищу...' : 'Найти'}
          </button>
        </div>
      </form>

      <div style={{marginTop:20}}>
        {results.length === 0 && <p>Нет результатов</p>}
        {results.map((r) => (
          <div key={r.id} style={{border:'1px solid #ddd', padding:12, borderRadius:6, marginBottom:12}}>
            <h3 style={{margin:'4px 0'}}>{r.name}</h3>
            <p style={{margin:'4px 0', color:'#333'}}>{r.reason}</p>
            <p style={{margin:'4px 0', color:'#666'}}>score: {Number(r.score).toFixed(3)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
