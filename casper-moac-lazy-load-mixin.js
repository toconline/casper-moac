import { CasperMoacOperators, CasperMoacSort, CasperMoacFilterTypes } from './casper-moac-constants.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

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
        resourceName: {
          type: String,
          observer: '__resourceNameChanged'
        },
        /**
         * List of attributes that should be fetch via JSON API.
         * @type {Array}
         */
        resourceListAttributes: {
          type: Array
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
        },
        /**
         * Filters that should be always applied to the JSON API resource regardless of the current filters.
         */
        resourceDefaultFilters: {
          type: String
        },
        resourceFetchChildrenQuery: {
          type: String,
        }
      };
    }

    /**
     * Public method that allows the casper-moac users to re-fetch the items.
     */
    refreshItems () {
      // Scroll to the top of the grid to reset the current page being displayed.
      this.$.grid.$.outerscroller.scrollTop = 0;
      this.$.grid.clearCache();
    }

    /**
     * This observer gets fired as soon as the JSON API resource changes and the
     * method is responsible for refreshing or initializing the vaadin-grid lazy load.
     */
    __resourceNameChanged () {
      if (this.__lazyLoadInitialized) {
        this.refreshItems();
      } else {
        this.__initializeLazyLoad();
      }
    }

    /**
     * This method initializes the vaadin-grid lazy load behavior by provinding the function
     * that interacts with the JSON API.
     */
    __initializeLazyLoad () {
      const missingProperties = [
        'resourceName',
        'resourceSortParam',
        'resourcePageParam',
        'resourcePageSizeParam',
        'resourceTotalsMetaParam',
      ].filter(property => !this[property]);

      // Check if all the required parameters were provided.
      if (missingProperties.length > 0) return;

      this.$.grid.dataProvider = (parameters, callback) => this.__debounceFetchResourceItems(parameters, callback);

      if (!this.disableSelection) {
        afterNextRender(this, () => {
          // Replace the vaadin-checkbox since the default one has event listeners not compatible with the lazy-load mode.
          this.__selectAllCheckbox = document.createElement('vaadin-checkbox');
          this.__selectAllCheckbox.addEventListener('checked-changed', event => {
            this.__allItemsSelected = event.detail.value;

            // This means the checked observer was fired internally.
            if (this.__selectAllCheckboxObserverLock) return;

            this.selectedItems = this.__allItemsSelected ? [...this.__internalItems] : [];
          });

          this.$.grid.shadowRoot.querySelectorAll('thead tr th slot').forEach(headerSlot => {
            const headerSlotElement = headerSlot.assignedElements().shift();
            if (headerSlotElement.firstElementChild && headerSlotElement.firstElementChild.nodeName.toLowerCase() === 'vaadin-checkbox') {
              headerSlotElement.removeChild(headerSlotElement.firstElementChild);
              headerSlotElement.appendChild(this.__selectAllCheckbox);
            }
          });
        });
      }

      this.__lazyLoadInitialized = true;
    }

    /**
     * Internal method that will force the vaadin-grid items to be re-fetched.
     */
    __filterLazyLoadItems () {
      this.refreshItems();
    }

    __debounceFetchResourceItems (parameters, callback) {
      this.__debounce('__fetchResourceItemsDebouncer', () => {
        !parameters.parentItem
          ? this.__fetchResourceItems(parameters, callback)
          : this.__fetchChildrenResourceItems(parameters, callback);
      });
    }

    /**
     * Function that is invoked by the vaadin-grid to fetch items from the remote source which is
     * the JSON API in this case.
     * @param {Object} parameters Object that contains the number of items per page, the current page number and sort settings.
     * @param {Function} callback Callback that will be called as soon as the items are returned from the JSON API. 
     */
    async __fetchResourceItems (parameters, callback) {
      try {
        const socketResponse = await app.socket.jget(this.__buildResourceUrl(parameters), this.resourceTimeoutMs);

        if (socketResponse.errors) return;

        // Format the elements returned by the JSON API.
        if (this.resourceFormatter) {
          socketResponse.data.forEach(item => this.resourceFormatter(item));
        }

        callback(socketResponse.data, parseInt(socketResponse.meta.total));
        this.__numberOfResults =  socketResponse.meta.total === socketResponse.meta['grand-total']
          ? `${this.$.grid.items.length} ${this.multiSelectionLabel}`
          : `${this.$.grid.items.length} de ${socketResponse.meta['grand-total']} ${this.multiSelectionLabel}`;

        this.__updateInternalItems(parameters.page, socketResponse.data);
        this.__activateFirstItem();
      } catch (exception) {
        console.error(exception);

        this.app.openToast({
          text: 'Ocorreu um erro ao obter os dados.',
          backgroundColor: 'red'
        });
      }
    }

    /**
     * Function that is invoked by the vaadin-grid to fetch children items from the remote source which is
     * the JSON API in this case.
     * @param {Object} parameters Object that contains the parent item which we are fetching children from.
     * @param {Function} callback Callback that will be called as soon as the items are returned from the JSON API. 
     */
    async __fetchChildrenResourceItems (parameters, callback) {
      try {
        const fetchChildrenQuery = this.resourceFetchChildrenQuery.replace('%{parentId}', parameters.parentItem[this.idProperty]);
        const socketResponse = await app.socket.jget(fetchChildrenQuery, this.resourceTimeoutMs);

        callback(socketResponse.data);
      } catch (exception) {
        console.error(exception);

        this.app.openToast({
          text: 'Ocorreu um erro ao obter os dados.',
          backgroundColor: 'red'
        });
      }
    }

    /**
     * This method is responsible for selecting all the new items if the user is scrolling with that option active
     * or wiping all selected items if the filters have changed.
     * @param {Number} currentPage The current vaadin-grid's page.
     * @param {Array} socketResponse The newly fetched data from the JSON API.
     */
    __updateInternalItems (currentPage, socketResponseData) {
      // This means the filters were re-applied so clear all the selected items and reset the internal items.
      if (currentPage === 0) {
        this.selectedItems = [];
        this.__internalItems = this.displayedItems = socketResponseData;

        // When the component is still initializing the __selectAllCheckbox might still be undefined.
        if (this.__selectAllCheckbox) this.__selectAllCheckbox.checked = false;
        return;
      }

      // Append the new items and select all of them if that's the case.
      this.__internalItems = this.displayedItems = [...this.__internalItems, ...socketResponseData];
      if (this.__allItemsSelected) {
        this.selectedItems = [...this.__internalItems];
      }
    }

    /**
     * This method will build the JSON API resource url with all the required parameters and filters.
     * @param {Object} parameters Object that contains the number of items per page, the current page number and sort settings.
     */
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

      const filterResourceUrlParams = [
        this.resourceDefaultFilters,
        this.__buildResourceUrlFreeFilters(),
        this.__buildResourceUrlFixedFilters(),
      ].filter(filterUrlParam => !!filterUrlParam).join(' AND ');

      if (filterResourceUrlParams) {
        resourceUrlParams = [...resourceUrlParams, `${this.resourceFilterParam}="${filterResourceUrlParams}"`];
      }

      // Check if there is already existing filters in the resource name.
      return this.resourceName.includes('?')
        ? `${this.resourceName}&${resourceUrlParams.join('&')}`
        : `${this.resourceName}?${resourceUrlParams.join('&')}`;
    }

    /**
     * This method is responsible for building the filter url parameter taking into account the search
     * input's value and the resourceFilterAttributes property.
     */
    __buildResourceUrlFreeFilters () {
      let freeFilters;

      // Check if there are attributes that should be filtered and if the input has already been initialized.
      if (this.$.filterInput
        && this.$.filterInput.value
        && this.resourceFilterAttributes
        && this.resourceFilterAttributes.length > 0) {

        freeFilters = this.resourceFilterAttributes.map(filterAttribute => {
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

        freeFilters = `(${freeFilters.join(' OR ')})`;
      }

      return freeFilters;
    }

    /**
     * This method is responsible for building the filter url parameter taking into account the current
     * active filters (casper-select, paper-input, etc).
     */
    __buildResourceUrlFixedFilters () {
      if (!this.__filters) return;

      return this.__filters
        .filter(filterItem => {
          return this.__valueIsNotEmpty(filterItem.filter.value)
            && filterItem.filter.lazyLoad
            && filterItem.filter.lazyLoad.field
            && filterItem.filter.lazyLoad.operator
        })
        .map(filterItem => {
          const filter = filterItem.filter;

          switch (filter.lazyLoad.operator) {
            // Array comparisons.
            case CasperMoacOperators.IN:
            case CasperMoacOperators.NOT_IN:
              const escapeFilterValue = filterValue => isNaN(filterValue) ? `'${filterValue}'` : filterValue;

              // For those cases when you have something along the lines of IN ('draft','pending').
              const escapedFilterValue = filter.type === CasperMoacFilterTypes.CASPER_SELECT && filter.inputOptions.multiSelection
                ? filter.value.split(',').map(filterValue => escapeFilterValue(filterValue)).join(',')
                : escapeFilterValue(filter.value);

              return filter.lazyLoad.operator === CasperMoacOperators.IN
                ? `${filter.lazyLoad.field} IN (${escapedFilterValue})`
                : `${filter.lazyLoad.field} NOT IN (${escapedFilterValue})`;
            // String comparisons.
            case CasperMoacOperators.ENDS_WITH: return `${filter.lazyLoad.field}::TEXT ILIKE '%${this.__sanitizeValue(filter.value)}'`;
            case CasperMoacOperators.CONTAINS: return `${filter.lazyLoad.field}::TEXT ILIKE '%${this.__sanitizeValue(filter.value)}%'`;
            case CasperMoacOperators.EXACT_MATCH: return `${filter.lazyLoad.field}::TEXT ILIKE '${this.__sanitizeValue(filter.value)}'`;
            case CasperMoacOperators.STARTS_WITH: return `${filter.lazyLoad.field}::TEXT ILIKE '${this.__sanitizeValue(filter.value)}%'`;
            case CasperMoacOperators.DOES_NOT_CONTAIN: return `${filter.lazyLoad.field}::TEXT NOT ILIKE '%${this.__sanitizeValue(filter.value)}%'`;
            // Numeric comparisons.
            case CasperMoacOperators.LESS_THAN: return `${filter.lazyLoad.field} < ${filter.value}`;
            case CasperMoacOperators.GREATER_THAN: return `${filter.lazyLoad.field} > ${filter.value}`;
            case CasperMoacOperators.LESS_THAN_OR_EQUAL_TO: return `${filter.lazyLoad.field} <= ${filter.value}`;
            case CasperMoacOperators.GREATER_THAN_OR_EQUAL_TO: return `${filter.lazyLoad.field} >= ${filter.value}`;
            // Custom comparisons.
            case CasperMoacOperators.CUSTOM: return filter.lazyLoad.field.replace(new RegExp(`%{${filterItem.filterKey}}`, 'g'), filter.value);
          }
      }).join(' AND ');
    }

    /**
     * Method used to escape special characters that might break the ILIKE clause or the JSONAPI url parsing.
     * @param {String} value
     */
    __sanitizeValue (value) {
      return value
        .toString()
        .trim()
        .replace(/[%\\]/g, '\\$&')
        .replace(/[&]/g, '_');
    }
  }
}