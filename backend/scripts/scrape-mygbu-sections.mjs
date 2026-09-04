import https from 'https';

const url = 'https://mygbu.in/schd/index.php?name=SOICT&dept=CSE';
https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
        console.log('HTML length:', html.length);
        // Find dropdowns or select elements or links
        const selects = html.match(/<select[\s\S]*?<\/select>/gi) || [];
        console.log('Select elements found:', selects.length);
        for (const sel of selects) {
            console.log('Select snippet:', sel.slice(0, 300));
        }
        
        // Check for links with section=
        const sectionLinks = [...html.matchAll(/href=["']([^"']*section=[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];
        console.log('Section links found:', sectionLinks.length);
        for (const link of sectionLinks) {
            console.log('  ', link[1], '-->', link[2].trim());
        }
    });
});
