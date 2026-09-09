import fs from 'fs';

async function probe() {
  const urls = [
    { name: 'db_index', url: 'https://mygbu.in/db/index.php' },
    { name: 'db_browse', url: 'https://mygbu.in/db/browse.php' },
    { name: 'schd_load', url: 'https://mygbu.in/schd/load.php?school=SOICT&dept=CSE+++++++' },
    { name: 'schd_index', url: 'https://mygbu.in/schd/index.php?name=SOICT&dept=CSE' }
  ];

  for (const item of urls) {
    console.log(`\n================== ${item.name} (${item.url}) ==================`);
    try {
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const html = await res.text();
      console.log('Status:', res.status, 'Length:', html.length);

      // Search for forms, selects, tables, links
      const forms = html.match(/<form[\s\S]*?<\/form>/gi) || [];
      console.log('Forms:', forms.length);
      for (const f of forms) {
        const action = f.match(/action=["']([^"']*)["']/i)?.[1] || '';
        const method = f.match(/method=["']([^"']*)["']/i)?.[1] || 'GET';
        console.log(`  Form: method=${method}, action=${action}`);
        const inputs = [...f.matchAll(/<input[^>]*name=["']([^"']*)["'][^>]*>/gi)].map(m => m[1]);
        const selects = [...f.matchAll(/<select[^>]*name=["']([^"']*)["'][^>]*>/gi)].map(m => m[1]);
        console.log(`    Inputs:`, inputs);
        console.log(`    Selects:`, selects);
      }

      const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
      console.log('Tables:', tables.length);
      for (const [idx, t] of tables.entries()) {
        const trCount = (t.match(/<tr/gi) || []).length;
        const ths = [...t.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
        console.log(`  Table ${idx}: ${trCount} rows. Headers:`, ths.slice(0, 10));
      }

      const links = [...html.matchAll(/href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
      console.log('Links count:', links.length);
      const sampleLinks = links.filter(l => !l[1].startsWith('#') && !l[1].startsWith('javascript')).slice(0, 15);
      for (const l of sampleLinks) {
        console.log(`  Link: ${l[1]}  -->  ${l[2].replace(/<[^>]+>/g, '').trim()}`);
      }

    } catch (err) {
      console.error('Error fetching', item.name, err.message);
    }
  }
}

probe();
