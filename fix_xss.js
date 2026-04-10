const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace('${game.title}</h2>',
                    '${game.title.replace(/&/g, \'&amp;\').replace(/</g, \'&lt;\').replace(/>/g, \'&gt;\').replace(/\\"/g, \'&quot;\')}</h2>');

fs.writeFileSync('index.html', html);
console.log('Fixed HTML escaping in index.html');
