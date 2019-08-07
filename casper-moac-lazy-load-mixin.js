import { CasperMoacOperators, CasperMoacSort } from './casper-moac-constants.js';

export const CasperMoacLazyLoadMixin = superClass => {
  return class extends superClass {

    static get properties () {
      return {
        /**
         * Number of results that will be displayed per page.
         * @type {Number}
         */
        resourcePageSize: {
          type: Number,
          value: 250
        },
        /**
         * The JSON API resource name that will be used to build the URL.
         * @type {String}
         */
        resourceName: String,
        /**
         * List of attributes that should be fetch via JSON API.
         * @type {Array}
         */
        resourceListAttributes: Array,
        /**
         * Number of milliseconds the UI must wait after the user stopped typing
         * so that it can fire a new request to the JSONAPI.
         * @type {Number}
         */
        resourceFilterDebounceMs: {
          type: Number,
          value: 250
        },
        /**
         * Function used to format the items that are returned from the JSON API.
         * @type {Function}
         */
        resourceFormatter: {
          type: Function
        },
        /**
         * URL parameter that will contain the number of results per page.
         * @type {String}
         */
        resourcePageSizeParam: {
          type: String,
          value: 'page[size]'
        },
        /**
         * URL parameter that will contain the current page.
         * @type {String}
         */
        resourcePageParam: {
          type: String,
          value: 'page[number]'
        },
        /**
         * URL parameter to obtain the total number of results for the current query.
         * @type {String}
         */
        resourceTotalsMetaParam: {
          type: String,
          value: 'totals=1'
        },
        /**
         * URL parameter to sort the results by a specific attribute.
         * @type {String}
        */
        resourceSortParam: {
          type: String,
          value: 'sort'
        },
        /**
         * URL parameter to filter the results by matching a substring with a specific attribute.
         * @type {String}
        */
        resourceFilterParam: {
          type: String,
          value: 'filter'
        },
        /**
         * The JSON API resource timeout value in ms.
         * @type {Number}
         */
        resourceTimeoutMs: {
          type: Number,
          value: 5000
        }
      };
    }

    __initializeLazyLoad () {
      const missingProperties = [
        'resourceName',
        'resourceSortParam',
        'resourcePageParam',
        'resourcePageSizeParam',
        'resourceTotalsMetaParam',
      ].filter(property => !this[property]);

      // Check if all the required parameters were provided.
      if (missingProperties.length > 0) {
        throw new Error(`The following properties are missing to activate the lazy-load mode: ${missingProperties.join(', ')}.`);
      }

      this.$.grid.dataProvider = (parameters, callback) => this.__fetchResourceItems(parameters, callback);
    }

    filterLazyLoadItems () {
      this.$.grid.clearCache();
    }

    async __fetchResourceItems (parameters, callback) {
      try {
        const socketResponse = await app.socket.jget(this.__buildResourceUrl(parameters), this.resourceTimeoutMs);

        if (socketResponse.errors) return;

        // Format the elements returned by the JSON API.
        if (this.resourceFormatter) {
          socketResponse.data.forEach((item, itemIndex, items) => {
            items[itemIndex] = this.resourceFormatter(item);
          });
        }

        callback(socketResponse.data, parseInt(socketResponse.meta.total));
        this.__numberOfResults =  socketResponse.meta.total === socketResponse.meta['grand-total']
          ? `${this.$.grid.items.length} resultado(s)`
          : `${this.$.grid.items.length} de ${socketResponse.meta['grand-total']} resultado(s)`
      } catch (_exception) {
        this.app.openToast({
          text: 'Ocorreu um erro ao obter os dados.',
          backgroundColor: 'red'
        });
      }
    }

    __buildResourceUrl (parameters) {
      let resourceUrlParams = [
        this.resourceTotalsMetaParam,
        `${this.resourcePageParam}=${parameters.page + 1}`,
        `${this.resourcePageSizeParam}=${parameters.pageSize}`
      ];

      // Limit the fields that are request to the JSON API.
      if (this.resourceListAttributes && this.resourceListAttributes.length > 0) {
        resourceUrlParams = [...resourceUrlParams, `fields[${this.resourceName}]=${this.resourceListAttributes.join(',')}`];
      }

      // Sort by ascending or descending.
      if (parameters.sortOrders.length > 0) {
        const sortSettings = parameters.sortOrders[0];
        resourceUrlParams = sortSettings.direction === CasperMoacSort.ASCENDING
          ? [...resourceUrlParams, `${this.resourceSortParam}=${sortSettings.path}`]
          : [...resourceUrlParams, `${this.resourceSortParam}=-${sortSettings.path}`];
      }

      // Check if there are attributes that should be filtered and if the input has already been initialized.
      let freeTextFilters;
      const fixedFilters = this.__applyFilters().join(' AND ');

      if (this.$.filterInput
        && this.$.filterInput.value
        && this.resourceFilterAttributes
        && this.resourceFilterAttributes.length > 0) {
          freeTextFilters = this.resourceFilterAttributes.map(filterAttribute => {
            if (filterAttribute.constructor === Object) {
              switch (filterAttribute.operator) {
                case CasperMoacOperators.CONTAINS: return `${filterAttribute.field}::TEXT ILIKE '%${this.__sanitizeValue(this.$.filterInput.value)}%'`;
                case CasperMoacOperators.ENDS_WITH: return `${filterAttribute.field}::TEXT ILIKE '%${this.__sanitizeValue(this.$.filterInput.value)}'`;
                case CasperMoacOperators.STARTS_WITH: return `${filterAttribute.field}::TEXT ILIKE '${this.__sanitizeValue(this.$.filterInput.value)}%'`;
                case CasperMoacOperators.EXACT_MATCH: return `${filterAttribute.field}::TEXT ILIKE '${this.__sanitizeValue(this.$.filterInput.value)}'`;
              }
            }

            // Encapsulate the free filters in parenthesis to not mess with the AND clause.
            return `${filterAttribute}::TEXT ILIKE '%${this.__sanitizeValue(this.$.filterInput.value)}%'`;
          });
          freeTextFilters = `(${freeTextFilters.join(' OR ')})`;
      }

      const filterResourceUrlParams = [fixedFilters, freeTextFilters].filter(urlParam => !!urlParam).join(' AND ');

      if (filterResourceUrlParams) {
        resourceUrlParams = [...resourceUrlParams, `${this.resourceFilterParam}="${filterResourceUrlParams}"`];
      }

      // Check if there is already existing filters in the resource name.
      return this.resourceName.includes('?')
        ? `${this.resourceName}&${resourceUrlParams.join('&')}`
        : `${this.resourceName}?${resourceUrlParams.join('&')}`;
    }

    __applyFilters () {
      if (!this.__filters) return [];

      return this.__filters
        .filter(filterItem => {
          return this._valueIsNotEmpty(filterItem.filter.value)
            && filterItem.filter.lazyLoad
            && filterItem.filter.lazyLoad.field
            && filterItem.filter.lazyLoad.operator
        })
        .map(filterItem => {
          const filter = filterItem.filter;
          const filterValue = filter.value.constructor !== Array ? filter.value : filter.value.join(',');

          switch (filter.lazyLoad.operator) {
            // Array comparisons.
            case CasperMoacOperators.IN: return `${filter.lazyLoad.field} IN (${filterValue})`;
            case CasperMoacOperators.NOT_IN: return `${filter.lazyLoad.field} NOT IN (${filterValue})`;
            // String comparisons.
            case CasperMoacOperators.ENDS_WITH: return `${filter.lazyLoad.field}::TEXT ILIKE '%${this.__sanitizeValue(filterValue)}'`;
            case CasperMoacOperators.CONTAINS: return `${filter.lazyLoad.field}::TEXT ILIKE '%${this.__sanitizeValue(filterValue)}%'`;
            case CasperMoacOperators.EXACT_MATCH: return `${filter.lazyLoad.field}::TEXT ILIKE '${this.__sanitizeValue(filterValue)}'`;
            case CasperMoacOperators.STARTS_WITH: return `${filter.lazyLoad.field}::TEXT ILIKE '${this.__sanitizeValue(filterValue)}%'`;
            case CasperMoacOperators.DOES_NOT_CONTAIN: return `${filter.lazyLoad.field}::TEXT NOT ILIKE '%${this.__sanitizeValue(filterValue)}%'`;
            // Numeric comparisons.
            case CasperMoacOperators.LESS_THAN: return `${filter.lazyLoad.field} < ${filterValue}`;
            case CasperMoacOperators.GREATER_THAN: return `${filter.lazyLoad.field} > ${filterValue}`;
            case CasperMoacOperators.LESS_THAN_OR_EQUAL_TO: return `${filter.lazyLoad.field} <= ${filterValue}`;
            case CasperMoacOperators.GREATER_THAN_OR_EQUAL_TO: return `${filter.lazyLoad.field} >= ${filterValue}`;
            // Custom comparisons.
            case CasperMoacOperators.CUSTOM: return filter.lazyLoad.field.replace(new RegExp(`%{${filterItem.filterKey}}`, 'g'), filterValue);
          }
      });
    }

    __sanitizeValue (value) {
      // Escape special characters that might break the ILIKE clause or the JSONAPI url parsing.
      const escapedValue = value.toString().replace(/[%\\]/g, '\\$&');
      return escapedValue.replace(/[&]/g, '_');
    }
  }
}