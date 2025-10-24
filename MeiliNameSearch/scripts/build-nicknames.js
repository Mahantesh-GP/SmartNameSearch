// scripts/build-nicknames.js
// Node 18+ required (uses global fetch)

const fs = require('fs');
const path = require('path');

// Simple CSV parser (no dependency needed)
const parseCSV = (text) => {
  return text
    .split(/\r?\n/)
    .map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')))
    .filter(row => row.length >= 2 && row[0] && row[1]);
};

// Feel free to add more sources here:
const sources = [
  // carltonnorthern / nicknames (CSV)
  'https://raw.githubusercontent.com/carltonnorthern/nicknames/main/names.csv',
  // onyxrev / common_nickname_csv (CSV)
  'https://raw.githubusercontent.com/onyxrev/common_nickname_csv/main/nicknames.csv'
  // You can append more GitHub raw files if you like
];

(async () => {
  const graph = {}; // canonical -> Set(nicknames)

  const addLink = (a, b) => {
    a = (a || '').trim().toLowerCase();
    b = (b || '').trim().toLowerCase();
    if (!a || !b) return;
    graph[a] = graph[a] || new Set();
    graph[a].add(b);
  };

  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('Skipping', url, res.status);
        continue;
      }
      const text = await res.text();

      // Parse CSV
      const rows = parseCSV(text);

      for (const r of rows) {
        // Most files are [canonical, nickname]
        // Add bidirectional links so lookups work either way.
        const a = r[0];
        const b = r[1];
        addLink(a, b);
        addLink(b, a);
      }
    } catch (e) {
      console.error('Error fetching', url, e.message);
    }
  }

  // Convert to plain object arrays and ensure self-inclusion
  const out = {};
  for (const k of Object.keys(graph)) {
    const set = graph[k];
    set.add(k); // include canonical itself
    out[k] = Array.from(set).sort();
  }
  

  const outDir = path.join('tools', 'dictionaries');
  const outPath = path.join(outDir, 'nicknames.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');

  console.log(`✅ Wrote ${Object.keys(out).length} keys to ${outPath}`);
})();
