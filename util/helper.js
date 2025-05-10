function getAlphaID(count) {
  let alpha = "";
  let n = count - 1;
  while (n >= 0) {
    alpha = String.fromCharCode((n % 26) + 65) + alpha;
    n = Math.floor(n / 26) - 1;
  }
  return alpha;
}

module.exports = {
  getAlphaID
}