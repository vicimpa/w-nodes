export const avgArray = (array: number[], count = 0): number[] => {
  if (count <= 0) return array;

  array = Array.from(
    { length: array.length + array.length - 1 },
    (_, i) => {
      if (i & 1) {
        return (
          (array[Math.floor(i / 2)] + array[Math.ceil(i / 2)]) / 2
        );
      }

      return array[Math.floor(i / 2)];
    }
  );

  return avgArray(array, count - 1);
};