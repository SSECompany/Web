function GetUniqueArray(arr, comp) {
  const unique = arr
    .map((e) => {
      return e[comp].trim();
    })
    // store the keys of the unique objects
    .map((e, i, final) => {
      return final.indexOf(e.trim()) === i && i;
    })
    // eliminate the dead keys & store unique objects
    .filter((e) => arr[e])
    .map((e) => arr[e]);
  return unique;
}

function FilterNullArray(arr, comp) {
  const unique = arr.filter((e) => {
    if (e[comp] !== "") {
      return e;
    }
  });
  return unique;
}

export { GetUniqueArray, FilterNullArray };
