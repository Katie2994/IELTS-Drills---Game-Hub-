import * as fs from 'fs';
import * as https from 'https';

const url = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/sounds/376737_Skullbeatz___Bad_Cat_Macaque.mp3';
const dest = './bgm.mp3';

https.get(url, (res) => {
  if (res.statusCode === 200) {
    fs.mkdirSync('./public', { recursive: true });
    const file = fs.createWriteStream('./public/bgm.mp3');
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Success');
    });
  } else {
    // try another one
    console.log('Failed:', res.statusCode);
  }
}).on('error', (err) => {
  console.log('Error:', err.message);
});
