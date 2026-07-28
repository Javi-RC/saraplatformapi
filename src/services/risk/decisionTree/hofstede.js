/**
 * Hofstede's 6 Cultural Dimensions by Country
 * Dimensions: Power Distance (PDI), Individualism (IDV), Masculinity (MAS),
 * Uncertainty Avoidance (UAI), Long Term Orientation (LTO), Indulgence (IND)
 */
const HOFSTEDE_DIMENSIONS = {
  'spain': { PDI: 57, IDV: 51, MAS: 42, UAI: 86, LTO: 48, IND: 44 },
  'españa': { PDI: 57, IDV: 51, MAS: 42, UAI: 86, LTO: 48, IND: 44 },
  'united states': { PDI: 40, IDV: 91, MAS: 62, UAI: 46, LTO: 26, IND: 68 },
  'usa': { PDI: 40, IDV: 91, MAS: 62, UAI: 46, LTO: 26, IND: 68 },
  'germany': { PDI: 35, IDV: 67, MAS: 66, UAI: 65, LTO: 83, IND: 40 },
  'alemania': { PDI: 35, IDV: 67, MAS: 66, UAI: 65, LTO: 83, IND: 40 },
  'france': { PDI: 68, IDV: 71, MAS: 43, UAI: 86, LTO: 63, IND: 48 },
  'francia': { PDI: 68, IDV: 71, MAS: 43, UAI: 86, LTO: 63, IND: 48 },
  'united kingdom': { PDI: 35, IDV: 89, MAS: 66, UAI: 35, LTO: 51, IND: 69 },
  'uk': { PDI: 35, IDV: 89, MAS: 66, UAI: 35, LTO: 51, IND: 69 },
  'reino unido': { PDI: 35, IDV: 89, MAS: 66, UAI: 35, LTO: 51, IND: 69 },
  'china': { PDI: 80, IDV: 20, MAS: 66, UAI: 30, LTO: 87, IND: 24 },
  'india': { PDI: 77, IDV: 48, MAS: 56, UAI: 40, LTO: 51, IND: 26 },
  'japan': { PDI: 54, IDV: 46, MAS: 95, UAI: 92, LTO: 88, IND: 42 },
  'japón': { PDI: 54, IDV: 46, MAS: 95, UAI: 92, LTO: 88, IND: 42 },
  'brazil': { PDI: 69, IDV: 38, MAS: 49, UAI: 76, LTO: 44, IND: 59 },
  'brasil': { PDI: 69, IDV: 38, MAS: 49, UAI: 76, LTO: 44, IND: 59 },
  'mexico': { PDI: 81, IDV: 30, MAS: 69, UAI: 82, LTO: 24, IND: 97 },
  'méxico': { PDI: 81, IDV: 30, MAS: 69, UAI: 82, LTO: 24, IND: 97 },
  'canada': { PDI: 39, IDV: 80, MAS: 52, UAI: 48, LTO: 36, IND: 68 },
  'canadá': { PDI: 39, IDV: 80, MAS: 52, UAI: 48, LTO: 36, IND: 68 },
  'australia': { PDI: 38, IDV: 90, MAS: 61, UAI: 51, LTO: 21, IND: 71 },
  'italy': { PDI: 50, IDV: 76, MAS: 70, UAI: 75, LTO: 61, IND: 30 },
  'italia': { PDI: 50, IDV: 76, MAS: 70, UAI: 75, LTO: 61, IND: 30 },
  'netherlands': { PDI: 38, IDV: 80, MAS: 14, UAI: 53, LTO: 67, IND: 68 },
  'países bajos': { PDI: 38, IDV: 80, MAS: 14, UAI: 53, LTO: 67, IND: 68 },
  'sweden': { PDI: 31, IDV: 71, MAS: 5, UAI: 29, LTO: 53, IND: 78 },
  'suecia': { PDI: 31, IDV: 71, MAS: 5, UAI: 29, LTO: 53, IND: 78 },
  'poland': { PDI: 68, IDV: 60, MAS: 64, UAI: 93, LTO: 38, IND: 29 },
  'polonia': { PDI: 68, IDV: 60, MAS: 64, UAI: 93, LTO: 38, IND: 29 },
  'portugal': { PDI: 63, IDV: 27, MAS: 31, UAI: 104, LTO: 28, IND: 33 },
  'argentina': { PDI: 49, IDV: 46, MAS: 56, UAI: 86, LTO: 20, IND: 62 },
  'chile': { PDI: 63, IDV: 23, MAS: 28, UAI: 86, LTO: 31, IND: 68 },
  'colombia': { PDI: 67, IDV: 13, MAS: 64, UAI: 80, LTO: 13, IND: 83 },
  'peru': { PDI: 64, IDV: 16, MAS: 42, UAI: 87, LTO: 25, IND: 46 },
  'perú': { PDI: 64, IDV: 16, MAS: 42, UAI: 87, LTO: 25, IND: 46 },
  'south korea': { PDI: 60, IDV: 18, MAS: 39, UAI: 85, LTO: 100, IND: 29 },
  'corea del sur': { PDI: 60, IDV: 18, MAS: 39, UAI: 85, LTO: 100, IND: 29 },
  'russia': { PDI: 93, IDV: 39, MAS: 36, UAI: 95, LTO: 81, IND: 20 },
  'rusia': { PDI: 93, IDV: 39, MAS: 36, UAI: 95, LTO: 81, IND: 20 }
};

/**
 * Official languages by country
 */
const COUNTRY_LANGUAGES = {
  'spain': ['spanish', 'español', 'catalan', 'catalán', 'basque', 'vasco', 'galician', 'gallego'],
  'españa': ['spanish', 'español', 'catalan', 'catalán', 'basque', 'vasco', 'galician', 'gallego'],
  'united states': ['english', 'inglés'],
  'usa': ['english', 'inglés'],
  'germany': ['german', 'alemán'],
  'alemania': ['german', 'alemán'],
  'france': ['french', 'francés'],
  'francia': ['french', 'francés'],
  'united kingdom': ['english', 'inglés'],
  'uk': ['english', 'inglés'],
  'reino unido': ['english', 'inglés'],
  'china': ['chinese', 'chino', 'mandarin', 'mandarín'],
  'india': ['hindi', 'english', 'inglés'],
  'japan': ['japanese', 'japonés'],
  'japón': ['japanese', 'japonés'],
  'brazil': ['portuguese', 'portugués'],
  'brasil': ['portuguese', 'portugués'],
  'mexico': ['spanish', 'español'],
  'méxico': ['spanish', 'español'],
  'canada': ['english', 'inglés', 'french', 'francés'],
  'canadá': ['english', 'inglés', 'french', 'francés'],
  'australia': ['english', 'inglés'],
  'italy': ['italian', 'italiano'],
  'italia': ['italian', 'italiano'],
  'netherlands': ['dutch', 'holandés'],
  'países bajos': ['dutch', 'holandés'],
  'sweden': ['swedish', 'sueco'],
  'suecia': ['swedish', 'sueco'],
  'poland': ['polish', 'polaco'],
  'polonia': ['polish', 'polaco'],
  'portugal': ['portuguese', 'portugués'],
  'argentina': ['spanish', 'español'],
  'chile': ['spanish', 'español'],
  'colombia': ['spanish', 'español'],
  'peru': ['spanish', 'español'],
  'perú': ['spanish', 'español'],
  'south korea': ['korean', 'coreano'],
  'corea del sur': ['korean', 'coreano'],
  'russia': ['russian', 'ruso'],
  'rusia': ['russian', 'ruso']
};

/**
 * Standard timezone offsets by country/region (simplified, UTC hours)
 */
const TIMEZONE_OFFSETS = {
  'spain': 1, 'españa': 1,
  'united states': -5, 'usa': -5,  // Eastern (average)
  'germany': 1, 'alemania': 1,
  'france': 1, 'francia': 1,
  'united kingdom': 0, 'uk': 0, 'reino unido': 0,
  'china': 8,
  'india': 5.5,
  'japan': 9, 'japón': 9,
  'brazil': -3, 'brasil': -3,
  'mexico': -6, 'méxico': -6,
  'canada': -5, 'canadá': -5,
  'australia': 10,
  'italy': 1, 'italia': 1,
  'netherlands': 1, 'países bajos': 1,
  'sweden': 1, 'suecia': 1,
  'poland': 1, 'polonia': 1,
  'portugal': 0,
  'argentina': -3,
  'chile': -4,
  'colombia': -5,
  'peru': -5, 'perú': -5,
  'south korea': 9, 'corea del sur': 9,
  'russia': 3, 'rusia': 3
};

/**
 * Helper: Calculate time overlap in hours between two countries
 */
function calculateTimeOverlap(country1, country2) {
  const offset1 = TIMEZONE_OFFSETS[country1?.toLowerCase()] || 0;
  const offset2 = TIMEZONE_OFFSETS[country2?.toLowerCase()] || 0;
  const difference = Math.abs(offset1 - offset2);
  
  // Standard work hours are 8 hours (9am to 5pm)
  // Overlap = 8 - difference (but minimum 0, maximum 8)
  const overlap = Math.max(0, Math.min(8, 8 - difference));
  return overlap;
}

/**
 * Helper: Calculate cultural distance between two countries using Hofstede dimensions
 */
function calculateCulturalDistance(country1, country2) {
  const dims1 = HOFSTEDE_DIMENSIONS[country1?.toLowerCase()];
  const dims2 = HOFSTEDE_DIMENSIONS[country2?.toLowerCase()];
  
  if (!dims1 || !dims2) return null;
  
  // Calculate Euclidean distance across 6 dimensions
  const distance = Math.sqrt(
    Math.pow(dims1.PDI - dims2.PDI, 2) +
    Math.pow(dims1.IDV - dims2.IDV, 2) +
    Math.pow(dims1.MAS - dims2.MAS, 2) +
    Math.pow(dims1.UAI - dims2.UAI, 2) +
    Math.pow(dims1.LTO - dims2.LTO, 2) +
    Math.pow(dims1.IND - dims2.IND, 2)
  );
  
  return distance;
}

/**
 * Helper: Calculate binomial coefficient (nCr)
 */
function binomialCoefficient(n, r) {
  if (r > n) return 0;
  if (r === 0 || r === n) return 1;
  
  let result = 1;
  for (let i = 0; i < r; i++) {
    result *= (n - i);
    result /= (i + 1);
  }
  return Math.round(result);
}

module.exports = {
  HOFSTEDE_DIMENSIONS,
  COUNTRY_LANGUAGES,
  TIMEZONE_OFFSETS,
  calculateTimeOverlap,
  calculateCulturalDistance,
  binomialCoefficient
};
