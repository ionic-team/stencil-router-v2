const path = require('path');
const fs = require('fs');

const afterHydrate = async (doc, _url, filePath) => {
  let data = doc.querySelector(`script[data-staticstate]`);
  if (!data) {
    data = doc.createElement('script');
    doc.head.appendChild(data);
    data.type = 'json';
    data.setAttribute('data-staticstate', '');
  } else {
    const content = data.textContent;
    const jsonPath = path.resolve(filePath, '../data.json');
    setTimeout(() => {
      fs.writeFileSync(jsonPath, content, {
        encoding: 'utf-8'
      });
    });
  }
}

exports.afterHydrate = afterHydrate;


