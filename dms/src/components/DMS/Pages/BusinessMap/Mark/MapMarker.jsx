import { ShopOutlined } from "@ant-design/icons";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React, { useCallback } from "react";
import { setCustomerSelected } from "../../../Store/Sagas/BusinessMapActions";
import "./MapMarker.css";

const MapMarker = ({ id, position, setMarkerRef, children }) => {
  const handleMarkerClick = () => {
    setCustomerSelected(id, position);
  };

  const ref = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement) =>
      setMarkerRef(marker, id),
    [setMarkerRef, id]
  );

  return (
    <AdvancedMarker position={position} ref={ref} onClick={handleMarkerClick}>
      <div className="cursor-pointer map__marker shadow-4">
        {children ? (
          children
        ) : (
          <div>
            <ShopOutlined style={{ fontSize: "20px" }} />
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
};

export default MapMarker;
