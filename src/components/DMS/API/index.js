import _ from "lodash";
import { encrypted } from "../../../app/hooks/enCrypted";
import store from "../../../store";
import https from "../../../utils/https";

export const ApiGetTaskList = async (payload) => {
  return await https.post(`User/get-sysevents`, payload).then((res) => {
    return res;
  });
};

export const ApiGetTaskMaster = async (payload) => {
  return await https.post(`User/get-dsysevents-master`, payload).then((res) => {
    return res.data;
  });
};

export const ApiGetTaskDetail = async (payload) => {
  return await https.post(`User/get-dsysevents-detail`, payload).then((res) => {
    return res.data;
  });
};

export const ApiWebLookup = async (payload) => {
  return await https.post(`User/look-up`, payload).then((res) => {
    return res.data;
  });
};

export const ApiGetTaskSchedule = async (payload) => {
  return await https.post(`User/get-vtaskschedule`, payload).then((res) => {
    return res;
  });
};

export const ApiGetTourList = async (payload) => {
  return await https.post(`User/get_dmtuyen`, payload).then((res) => {
    return res.data;
  });
};

export const ApiGetTourDetail = async (payload) => {
  return await https
    .post(`User/get_ddmtuyen?ma_tuyen=${payload.ma_tuyen}`)
    .then((res) => {
      return res.data;
    });
};

export const ApiGetTicketList = async (payload) => {
  return await https.post(`User/get_vticket`, payload).then((res) => {
    return res;
  });
};

export const ApiCreateTaskSchedule = async (payload) => {
  return await https
    .post(`Job/CreateUpdateTaskSchedule`, payload)
    .then((res) => {
      return res;
    });
};

export const SoFuckingUltimateApi = async (payload) => {
  return await https.post(`user/UltimateRequest`, payload).then((res) => {
    return res;
  });
};

export const SoFuckingUltimateGetApi = async (payload) => {
  return await https
    .post(`user/get_ultimate2`, { data: encrypted(payload) })
    .then((res) => {
      return res.data;
    });
};

export const SoFuckingUltimateGetApi2 = async (payload) => {
  return await https.post(`user/get_ultimate`, payload).then((res) => {
    return res?.data || {};
  });
};

export const UltimatePutDataApi = async (payload) => {
  return await https
    .post(`user/UltimateRequest_tables`, payload)
    .then((res) => {
      return res.data;
    });
};

export const UltimatePutDataApi2 = async (payload) => {
  return await https
    .post(`user/UltimateRequest_tables2`, payload)
    .then((res) => {
      return res.data;
    });
};

export const apiGetImagesByCode = async (payload) => {
  return await https
    .post(`User/AddData`, {
      store: "api_get_image_by_code",
      param: {
        keys: payload,
      },
      data: {},
    })
    .then((res) => {
      return _.first(res?.data?.listObject) || [];
    });
};

export const apiGetMapInfo = async (payload) => {
  const { id, unitId, storeId } = store.getState().claimsReducer.userInfo;

  return await https
    .post(`User/AddData`, {
      store: "api_get_geo_data_by_tour",
      param: {
        userId: id,
        unitId,
        storeId,
      },
      data: {},
    })
    .then((res) => {
      return res?.data?.listObject;
    });
};
