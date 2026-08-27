// scripts/utils.js

export function isNotAllowedUrl(url) {
  const urlO = new URL(url);
  const forbiddenSchemes = ["file:", "data:", "javascript:"];

  // Use urlO.protocol (the URL object), not url.protocol (the raw string)
  return forbiddenSchemes.some((s) => urlO.protocol === s);
}
