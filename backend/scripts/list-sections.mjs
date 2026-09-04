import https from 'https';

https.get('https://mygbu.in/schd/index.php?name=SOICT&dept=CSE&section=0', { headers: { 'User-Agent': 'test' } }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
        const re = /<a class="dropdown-item" href="\?name=SOICT&dept=CSE&section=(\d+)">([^<]+)<\/a>/g;
        const m = [...d.matchAll(re)];
        console.log('All ' + m.length + ' CSE sections on mygbu.in:');
        m.forEach(x => console.log('  ' + x[1] + '  ' + x[2]));
    });
});
