import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./Cluster.css";

import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useMap } from "@vis.gl/react-google-maps";
import { useSelector } from "react-redux";
import { getBusinessMapState } from "../../../Store/Selector/Selectors";
import MapMarker from "../Mark/MapMarker";

const Cluster = ({ points = [] }) => {
  const { customerSelected, positionSelected } =
    useSelector(getBusinessMapState);
  const [markers, setMarkers] = useState({});
  const map = useMap();

  const setMarkerRef = useCallback((marker = null, key = "") => {
    setMarkers((markers) => {
      if ((marker && markers[key]) || (!marker && !markers[key]))
        return markers;

      if (marker) {
        return { ...markers, [key]: marker };
      } else {
        const { [key]: _, ...newMarkers } = markers;

        return newMarkers;
      }
    });
  }, []);

  const clusterer = useMemo(() => {
    if (!map) return null;

    return new MarkerClusterer({
      map,
      algorithmOptions: { maxZoom: 20 },
    });
  }, [map]);

  useEffect(() => {
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [clusterer, markers]);

  useEffect(() => {
    if (customerSelected) {
      console.log("positionSelected", positionSelected);
      map.panTo(positionSelected);
      map.setZoom(20);
    }
  }, [customerSelected]);

  return (
    <>
      {points.map((point, index) => (
        <MapMarker
          id={point.key}
          position={point.position}
          key={index}
          setMarkerRef={setMarkerRef}
        />
      ))}
    </>
  );
};

export default Cluster;
