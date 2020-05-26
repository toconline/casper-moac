export const CasperMoacFilterTypes = {
  PAPER_INPUT: 'PAPER_INPUT',
  PAPER_CHECKBOX: 'PAPER_CHECKBOX',
  CASPER_SELECT: 'CASPER_SELECT',
  CASPER_DATE_RANGE: 'CASPER_DATE_RANGE',
  CASPER_DATE_PICKER: 'CASPER_DATE_PICKER',
  COMPONENTLESS_FILTER: 'COMPONENTLESS_FILTER'
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
  CUSTOM: 'CUSTOM',
  // Date comparisons.
  DATE_RANGE: 'DATE_RANGE'
};

export const CasperMoacSortTypes = {
  STRING: 'string',
  NUMBER: 'number'
};

export const CasperMoacSortDirections = {
  ASCENDING: 'asc',
  DESCENDING: 'desc'
};