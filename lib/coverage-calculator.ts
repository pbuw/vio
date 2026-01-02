interface CoverageRule {
  insuranceType: 'basic' | 'supplementary';
  percentage: number | null;
  maxAmount: number | null;
}

interface CalculationResult {
  basicCoverage: number;
  supplementaryCoverage: number;
  userPays: number;
}

/**
 * Calculates insurance coverage for an expense.
 * Basic insurance is calculated first, then supplementary insurance covers the remaining amount.
 */
export function calculateCoverage(
  expenseAmount: number,
  basicRule: CoverageRule | null,
  supplementaryRule: CoverageRule | null
): CalculationResult {
  let basicCoverage = 0;
  let supplementaryCoverage = 0;
  let remainingAmount = expenseAmount;

  // Calculate basic insurance coverage
  if (basicRule) {
    if (basicRule.percentage !== null) {
      const percentageCoverage = (expenseAmount * basicRule.percentage) / 100;
      
      if (basicRule.maxAmount !== null) {
        basicCoverage = Math.min(percentageCoverage, basicRule.maxAmount);
      } else {
        basicCoverage = percentageCoverage;
      }
    } else if (basicRule.maxAmount !== null) {
      basicCoverage = Math.min(expenseAmount, basicRule.maxAmount);
    }
    
    remainingAmount = expenseAmount - basicCoverage;
  }

  // Calculate supplementary insurance coverage on remaining amount
  if (supplementaryRule && remainingAmount > 0) {
    if (supplementaryRule.percentage !== null) {
      const percentageCoverage = (remainingAmount * supplementaryRule.percentage) / 100;
      
      if (supplementaryRule.maxAmount !== null) {
        supplementaryCoverage = Math.min(percentageCoverage, supplementaryRule.maxAmount);
      } else {
        supplementaryCoverage = percentageCoverage;
      }
    } else if (supplementaryRule.maxAmount !== null) {
      supplementaryCoverage = Math.min(remainingAmount, supplementaryRule.maxAmount);
    } else {
      // No limit specified - covers 100% of remaining
      supplementaryCoverage = remainingAmount;
    }
    
    remainingAmount = remainingAmount - supplementaryCoverage;
  }

  const userPays = Math.max(0, remainingAmount);

  return {
    basicCoverage: Math.round(basicCoverage * 100) / 100,
    supplementaryCoverage: Math.round(supplementaryCoverage * 100) / 100,
    userPays: Math.round(userPays * 100) / 100,
  };
}

