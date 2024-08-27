export const unique = <T>(array: T[]) => {
  var set = new Set(array);
  return [...set];
};