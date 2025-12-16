const axios = require('axios');

async function fetchLocationXML() {
  const url = "https://www.lcsd.gov.hk/datagovhk/event/venues.xml";
  return (await axios.get(url)).data;
}

async function fetchEventXML() {
  const url = "https://www.lcsd.gov.hk/datagovhk/event/events.xml";
  return (await axios.get(url)).data;
}

module.exports = { fetchLocationXML, fetchEventXML };
