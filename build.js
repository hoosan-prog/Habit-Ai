const fs = require('fs');
const path = require('path');

const dir = __dirname;
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');

html = html.replace(
    '<link rel="stylesheet" href="styles.css">',
    '<style>\n' + css + '\n</style>'
);

html = html.replace(
    '<script src="app.js"></script>',
    '<script>\n' + js + '\n</script>'
);

fs.writeFileSync(path.join(dir, 'deploy.html'), html, 'utf8');
const size = fs.statSync(path.join(dir, 'deploy.html')).size;
console.log('deploy.html yaratildi! Hajmi: ' + (size / 1024).toFixed(1) + ' KB');
