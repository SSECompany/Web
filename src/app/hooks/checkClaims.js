import store from "../../store";

const checkClaims = (claim) => {
  const infoData = store.getState().claimsReducer.claims;

  const infoDataKeys = Object.keys(infoData);
  const userClaims = infoDataKeys.filter((currKey) => {
    if (currKey.includes("Permissions.")) return infoData[currKey];
  });

  if (userClaims.includes(claim)) {
    return true;
  }
  return false;
};

export default checkClaims;
