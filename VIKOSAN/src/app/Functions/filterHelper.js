function filterKeyHelper(searchValue) {
  if (searchValue) {
    const searchArray = searchValue.split(" ");
    var searchQuery = "";
    searchArray.map((item, index) => {
      if (item !== "") {
        return index == 0
          ? (searchQuery += `{i} like N'%${item.replace("'", "''")}%'`)
          : (searchQuery += ` and {i} like N'%${item.replace("'", "''")}%'`);
      }
    });
    return searchQuery;
  }
  return "";
}

export { filterKeyHelper };
