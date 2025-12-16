const xml2js = require('xml2js');

async function parseXML(data) {
  const parser = new xml2js.Parser({ explicitArray: false });
  return parser.parseStringPromise(data);
}

module.exports = parseXML;
