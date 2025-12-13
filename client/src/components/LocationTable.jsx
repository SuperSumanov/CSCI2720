import React from "react";

const sampleLocations = [
  { id: 1, name: "City Museum", events: 3, distance: 1.2 },
  { id: 2, name: "Opera Hall", events: 5, distance: 3.5 },
  { id: 3, name: "Cultural Center", events: 4, distance: 0.8 },
];

const LocationTable = () => (
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Events</th>
        <th>Distance (km)</th>
      </tr>
    </thead>
    <tbody>
      {sampleLocations.map((loc) => (
        <tr key={loc.id}>
          <td>{loc.name}</td>
          <td>{loc.events}</td>
          <td>{loc.distance}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default LocationTable;