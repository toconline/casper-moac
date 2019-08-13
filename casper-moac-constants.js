export const CasperMoacTypes = {
  GRID: 'GRID',
  GRID_EPAPER: 'GRID_EPAPER',
  GRID_SIDEBAR: 'GRID_SIDEBAR',
  GRID_EPAPER_SIDEBAR: 'GRID_EPAPER_SIDEBAR'
};

export const CasperMoacFilterTypes = {
  PAPER_INPUT: 'PAPER_INPUT',
  CASPER_SELECT: 'CASPER_SELECT',
  CASPER_DATE_PICKER: 'CASPER_DATE_PICKER',
};

export const CasperMoacOperators = {
  // Array comparisons.
  IN: 'IN',
  NOT_IN: 'NOT_IN',
  // String comparisons.
  CONTAINS: 'CONTAINS',
  ENDS_WITH: 'ENDS_WITH',
  STARTS_WITH: 'STARTS_WITH',
  EXACT_MATCH: 'EXACT_MATCH',
  DOES_NOT_CONTAIN: 'DOES_NOT_CONTAIN',
  // Numeric comparisons.
  LESS_THAN: 'LESS_THAN',
  GREATER_THAN: 'GREATER_THAN',
  LESS_THAN_OR_EQUAL_TO: 'LESS_THAN_OR_EQUAL_TO',
  GREATER_THAN_OR_EQUAL_TO: 'GREATER_THAN_OR_EQUAL_TO',
  // Custom comparisons.
  CUSTOM: 'CUSTOM'
};

export const CasperMoacSort = {
  ASCENDING: 'asc',
  DESCENDING: 'desc'
};