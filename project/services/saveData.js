const Event = require('../models/Event');
const Location = require('../models/Location');

const { fetchLocationXML, fetchEventXML } = require('./fetchXML');
const parseXML = require('./parseXML');
const { extractLocations, extractEvents } = require('./extract');

async function saveLocation(data) {
  const ops = data.map(v => ({
    updateOne: { filter: { id: v.id }, update: { $set: v }, upsert: true }
  }));
  await Location.bulkWrite(ops);
}

async function saveEvent(data) {
  const ops = data.map(v => ({
    updateOne: { filter: { id: v.id }, update: { $set: v }, upsert: true }
  }));
  await Event.bulkWrite(ops);
}

async function fetchAndStoreData() {
  const xmlLocation = await fetchLocationXML();
  const parsedLocation = await parseXML(xmlLocation);
  await saveLocation(extractLocations(parsedLocation));

  const xmlEvent = await fetchEventXML();
  const parsedEvent = await parseXML(xmlEvent);
  await saveEvent(extractEvents(parsedEvent));
}

module.exports = { fetchAndStoreData };
