// Genera dist/hierro.html: la app completa en un solo archivo (vista previa sin instalar).
// Uso: node build.js
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const read = f => fs.readFileSync(path.join(dir, f), 'utf8');
const html = read('index.html');
const body = html.split('<!--BODY-->')[1].split('<!--/BODY-->')[0].trim();
const fonts = html.match(/<link rel="stylesheet" href="(https:\/\/fonts[^"]+)">/)[1];

const out = `<title>Hierro</title>
<meta name="theme-color" content="#101216">
<link rel="stylesheet" href="${fonts}">
<style>
${read('app.css')}
</style>
${body}
<script>
${read('app.js')}
</script>
`;
fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
fs.writeFileSync(path.join(dir, 'dist', 'hierro.html'), out);
console.log('dist/hierro.html', Math.round(out.length / 1024) + ' KB');
