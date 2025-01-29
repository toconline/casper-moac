/* 
 * Copyright (C) 2019 Cloudware S.A. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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
  EQUALS: 'EQUALS',
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
