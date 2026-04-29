import { AdvancedMarker, APIProvider, Map } from "@vis.gl/react-google-maps";
import _ from "lodash";
import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { fetchTourPoints } from "../../../Store/Sagas/BusinessMapActions";
import { getBusinessMapState } from "../../../Store/Selector/Selectors";
import Cluster from "../Cluster/Cluster";
const position = { lat: 16.612861269489162, lng: 109.33640127191714 };

const GoogleMap = () => {
  const { currentPoints } = useSelector(getBusinessMapState);

  const points = useMemo(() => {
    if (_.isEmpty(currentPoints)) return null;

    const data = currentPoints.map((cur) => {
      const location = cur.latlong.split(",");
      return {
        key: cur.key,
        ten_kh: cur.ten_kh,
        position: {
          lat: parseFloat(location[0]),
          lng: parseFloat(location[1]),
        },
      };
    });

    return data;
  }, [currentPoints]);

  useEffect(() => {
    fetchTourPoints();
  }, []);

  return (
    <APIProvider apiKey={process.env.REACT_APP_API_GOOGLE_KEY}>
      <Map
        mapId={"bf51a910020fa25a"}
        defaultCenter={position}
        defaultZoom={5.8}
        // styles={GGMapStyles}
        disableDefaultUI
      >
        {points && <Cluster points={points} />}
        <AdvancedMarker
          position={{ lat: 16.703635356004945, lng: 111.93847972415134 }}
        >
          <div className="Hoang__Sa__Truong__Sa__belong_to_Viet_Nam">
            Hoàng Sa, Trường Sa là của Việt Nam
          </div>
        </AdvancedMarker>

        <AdvancedMarker
          position={{ lat: 10.824517682032573, lng: 114.30516468335472 }}
        >
          <div className="Hoang__Sa__Truong__Sa__belong_to_Viet_Nam">
            Hoang Sa, Truong Sa belong to VietNam
          </div>
        </AdvancedMarker>
      </Map>
    </APIProvider>
  );
};

export default GoogleMap;
