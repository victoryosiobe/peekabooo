function isNotAllowedUrl(url) {
  const urlO = new URL(url);
  //the url passed is raw text, we transformed to URL() object. it will not be invalid because external function will quit on invalid url before this fn is executed.
  const forbiddenSchemes = ["file:", "data:", "javascript:"];
  // .some() returns true if at least one scheme matches the protocol
  return forbiddenSchemes.some(s => url.protocol === s);
}

module.exports = { isNotAllowedUrl };
