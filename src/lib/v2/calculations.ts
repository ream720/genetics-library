export const toPercent = (
  numerator: number | null | undefined,
  denominator: number | null | undefined
): number | null => {
  if (
    numerator === null ||
    numerator === undefined ||
    denominator === null ||
    denominator === undefined ||
    denominator <= 0
  ) {
    return null;
  }

  return (numerator / denominator) * 100;
};

export const calculateGerminationRate = (
  germinatedCount: number,
  plantedCount: number
): number | null => toPercent(germinatedCount, plantedCount);

export const calculateSurvivalRate = (
  survivingCount: number,
  germinatedCount: number
): number | null => toPercent(survivingCount, germinatedCount);

export const calculateKeeperRate = (
  keeperPhenotypeCount: number,
  germinatedCount: number
): number | null => toPercent(keeperPhenotypeCount, germinatedCount);

export const calculateRthPercent = (
  dryHashWeightGrams: number | null | undefined,
  inputWeightGrams: number | null | undefined
): number | null => toPercent(dryHashWeightGrams, inputWeightGrams);

export const calculateRtrPercent = (
  rosinOutputWeightGrams: number | null | undefined,
  dryHashWeightPressedGrams: number | null | undefined
): number | null =>
  toPercent(rosinOutputWeightGrams, dryHashWeightPressedGrams);

export const calculateOverallRosinReturnPercent = (
  rosinOutputWeightGrams: number | null | undefined,
  inputWeightGrams: number | null | undefined
): number | null => toPercent(rosinOutputWeightGrams, inputWeightGrams);

export const sumWeights = (weights: Array<number | null | undefined>): number =>
  weights.reduce((total, weight) => total + (weight ?? 0), 0);

export const roundPercent = (value: number | null, decimals = 2) => {
  if (value === null) {
    return null;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
