/**
 * 產生指定長度的隨機數字字串
 * @param {number} length 長度，預設 8
 * @returns {string} 隨機數字字串
 */
export function generateRandomNumber(length = 8) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
}