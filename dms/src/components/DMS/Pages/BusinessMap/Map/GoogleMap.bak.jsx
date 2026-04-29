import GoogleMapReact from "google-map-react";
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import useSupercluster from "use-supercluster";
import { apiGetMapInfo } from "../../../API";
import Cluster from "../Cluster/Cluster";
import "../Cluster/Cluster.css";
import MapMarker from "../Mark/MapMarker";
import { GGMapStyles } from "./GoogleMapStyle";

const Marker = ({ children }) => children;
const GoogleMap = () => {
  const [map, setMap] = useState(null);
  const googleMapRef = useRef();
  const [center, setCenter] = useState({
    lat: 20.99633582896531,
    lng: 105.80243370865026,
  });
  const [zoom, setZoom] = useState(10);
  const [bounds, setBounds] = useState(null);
  const [points, setPoints] = useState([]);

  const handleMapChange = ({ center, zoom, bounds }) => {
    setZoom(zoom);
    setBounds([bounds.nw.lng, bounds.se.lat, bounds.se.lng, bounds.nw.lat]);
  };

  const getdata = async () => {
    const data = _.first(await apiGetMapInfo());
    const fetchedPoints = data.map((crime) => ({
      type: "Feature",
      properties: {
        cluster: false,
        id: crime?.key,
      },
      geometry: {
        type: "Point",
        coordinates: crime?.latlong
          ?.split(",")
          ?.map((coor) => parseFloat(coor))
          .reverse(),
      },
    }));

    setPoints([...fetchedPoints]);
  };

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: {
      radius: 75,
      maxZoom: 20,
    },
  });

  useEffect(() => {
    getdata();
    return () => {};
  }, []);

  return (
    <GoogleMapReact
      bootstrapURLKeys={{
        key: process.env.REACT_APP_API_GOOGLE_KEY,
      }}
      onGoogleApiLoaded={({ map }) => {
        googleMapRef.current = map;
      }}
      center={center}
      zoom={zoom}
      defaultZoom={10}
      yesIWantToUseGoogleMapApiInternals
      onChange={handleMapChange}
      options={{
        disableDefaultUI: true,
        styles: GGMapStyles,
        clickableIcons: false,
      }}
    >
      {clusters.map((cluster, index) => {
        console.log(clusters);
        const [longitude, latitude] = cluster.geometry.coordinates;
        const {
          cluster: isCluster,
          point_count: pointCount,
          id,
        } = cluster.properties;

        console.log("cluster", cluster);
        if (isCluster) {
          return (
            <Marker lat={latitude} lng={longitude} key={`cluster-${index}`}>
              <Cluster
                onClick={() => {
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(cluster.id),
                    20
                  );
                  googleMapRef.current.setZoom(expansionZoom);
                  googleMapRef.current.panTo({ lat: latitude, lng: longitude });
                }}
                style={{
                  width: `${20 + (pointCount / points.length) * 60}px`,
                  height: `${20 + (pointCount / points.length) * 60}px`,
                  background: "red",
                }}
                value={pointCount}
              />
            </Marker>
          );
        }

        return (
          <MapMarker
            key={`cluster-${index}`}
            lat={latitude}
            lng={longitude}
            id={id}
          />
        );
      })}

      <div
        className="Hoang__Sa__Truong__Sa__belong_to_Viet_Nam"
        lat={16.703635356004945}
        lng={111.93847972415134}
      >
        Hoàng Sa, Trường Sa là của Việt Nam
      </div>
    </GoogleMapReact>
  );
};

export default GoogleMap;
