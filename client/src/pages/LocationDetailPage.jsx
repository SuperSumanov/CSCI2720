import React from "react";
import { useParams } from "react-router-dom";

const LocationDetailPage = () => {
  const { id } = useParams();
  return (
    <div>
      <h2>Location Details – {id}</h2>
      <p>📍 Map here + Details + Comments + Favourite button</p>
    </div>
  );
};

export default LocationDetailPage;