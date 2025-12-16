function extractLocations(parsed) {
  const raw = parsed?.venues?.venue;
  if (!raw) throw new Error("No venue data found");

  const venues = Array.isArray(raw) ? raw : [raw];

  return venues
    .map(loc => {
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
      if (isNaN(lat) || isNaN(lng)) return null;

      return {
        id: loc.$.id,
        name: loc.venuee?.trim(),
        latitude: lat,
        longitude: lng,
        Area: 0,
        EventNum: 0,
      };
    })
    .filter(Boolean);
}

function extractEvents(parsed) {
  const raw = parsed.events.event;
  if (!raw) throw new Error("No event data found");

  const events = Array.isArray(raw) ? raw : [raw];

  return events.map(e => ({
    id: e.$.id,
    name: e.titlee.trim(),
    locId: e.venueid,
    time: e.predateE.trim(),
    description: e.desce.trim(),
    presenter: e.presenterorge.trim(),
  }));
}

module.exports = { extractLocations, extractEvents };
