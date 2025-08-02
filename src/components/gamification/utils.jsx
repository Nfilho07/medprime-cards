/**
 * Calculates the total XP required to reach a specific level.
 * The progression is non-linear: each level requires more XP than the last.
 * Level 1: 0 XP
 * Level 2: 100 XP
 * Level 3: 300 XP
 * Level 4: 600 XP
 * etc.
 * @param {number} level The target level.
 * @returns {number} The total cumulative XP required to reach that level.
 */
export const getXpForLevel = (level) => {
  if (level <= 1) return 0;
  // The XP required for the jump from (L-1) to L is 100 * (L-1).
  // The total XP for level L is the sum of these jumps.
  // Formula: 100 * ( (L-1)*L / 2 )
  return 50 * (level - 1) * level;
};

/**
 * Calculates the user's current level based on their total XP.
 * This is the inverse of getXpForLevel.
 * @param {number} xp The user's total XP.
 * @returns {number} The user's current level.
 */
export const getLevelForXp = (xp) => {
  if (xp < 100) return 1;
  // Solved from the quadratic equation for L in: xp = 50 * (L-1) * L
  // 50L^2 - 50L - xp = 0
  const level = (50 + Math.sqrt(2500 + 200 * xp)) / 100;
  return Math.floor(level);
};