function getIndexRow(index) {
  index = index + 1;
  var sttrec0 = "" + index;
  return "000".substring(0, 3 - sttrec0.length) + sttrec0;
}

export { getIndexRow };
