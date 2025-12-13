import React from "react";
import "../styles/main.css";

const mockLocations = [
  { id: 1, name: "City Museum", events: 3, description: "Art & Cultural exhibitions" },
  { id: 2, name: "Opera Hall", events: 5, description: "Live performances and shows" },
  { id: 3, name: "Cultural Center", events: 4, description: "Workshops and lectures" },
];

const LocationsPage = () => {
  return (
    <main className="main-container">
      <h2>Available Programme Venues</h2>
      <p className="subtitle">
        Here are 10 venues (at least 3 events each) — click a venue to learn more.
      </p>

      <div className="venue-list">
        {mockLocations.map((loc) => (
          <div key={loc.id} className="venue-card">
            <h3>{loc.name}</h3>
            <p>{loc.description}</p>
            <p>
              <strong>Events:</strong> {loc.events}
            </p>
            <button className="details-btn">View Details</button>
          </div>
        ))}
      </div>
    </main>
  );
};

export default LocationsPage;