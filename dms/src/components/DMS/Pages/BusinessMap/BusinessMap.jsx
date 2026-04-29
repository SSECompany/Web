import React from "react";
import "./BusinessMap.css";
import GoogleMap from "./Map/GoogleMap";
import MapFooter from "./MapFooter/MapFooter";
import TourSelector from "./TourSelector/TourSelector";

const BusinessMap = () => {
  return (
    <div className="h-full flex">
      <TourSelector />

      <div className="flex flex-column w-full min-w-0 overflow-hidden">
        <div className="h-full min-h-0">
          <GoogleMap />
        </div>

        <MapFooter />
      </div>
    </div>
  );
};

export default BusinessMap;
