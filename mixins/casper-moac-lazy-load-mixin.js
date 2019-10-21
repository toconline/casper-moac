import { CasperMoacOperators, CasperMoacSortDirections, CasperMoacFilterTypes } from '../casper-moac-constants.js';

export const CasperMoacLazyLoadMixin = superClass => {
  return class extends superClass {

    static get properties () {
      return {
        /**
         * Number of results that will be displayed per page.
         *
         * @type {Number}
         */
        resourcePageSize: {
          type: Number,
          value: 100
        },
        /**
         * The JSON API resource name that will be used to build the URL.
         *
         * @type {String}
         */
        resourceName: {
          type: String,
          observer: '__debounceFetchResourceItems'
        },
        /**
         * List of attributes that should be fetch via JSON API.
         *
         * @type {Array}
         */
        resourceListAttributes: {
          type: Array
        },
        /**
         * Function used to format the items that are returned from the JSON API.
         *
         * @type {Function}
         */
        resourceFormatter: {
          type: Function
        },
        /**
         * URL parameter that will contain the number of results per page.
         *
         * @type {String}
         */
        resourcePageSizeParam: {
          type: String,
          value: 'page[size]'
        },
        /**
         * URL parameter that will contain the current page.
         *
         * @type {String}
         */
        resourcePageParam: {
          type: String,
          value: 'page[number]'
        },
        /**
         * URL parameter to obtain the total number of results for the current query.
         *
         * @type {String}
         */
        resourceTotalsMetaParam: {
          type: String,
          value: 'totals=1'
        },
        /**
         * URL parameter to sort the results by a specific attribute.
         *
         * @type {String}
        */
        resourceSortParam: {
          type: String,
          value: 'sort'
        },
        /**
         * URL parameter to filter the results by matching a substring with a specific attribute.
         *
         * @type {String}
         */
        resourceFilterParam: {
          type: String,
          value: 'filter'
        },
        /**
         * The JSON API resource timeout value in milliseconds.
         *
         * @type {Number}
         */
        resourceTimeoutMs: {
          type: Number,
          value: 5000
        },
        /**
         * Number of milliseconds, during which, we should not re-fetch children items and use their locally cached version.
         *
         * @type {Number}
         */
        resourceChildrenCacheDuration: {
          type: Number,
          value: 10000
        },
        /**
         * Filters that should be always applied to the JSON API resource regardless of the current filters.
         *
         * @type {String}
         */
        resourceDefaultFilters: {
          type: String
        },
        /**
         * Query that will be used to fetch the expanded / children items.
         *
         * @type {String}
         */
        resourceFetchChildrenQuery: {
          type: String,
        },
        /**
         * This property states the current page.
         *
         * @type {Number}
         */
        __currentPage: {
          type: Number,
          value: 0
        },
        __resourceChildrenCache: {
          type: Object,
          value: {}
        }
      };
    }

    /**
     * Public method that allows the casper-moac users to re-fetch the items.
     */
    refreshItems () {
      // Scroll to the top of the grid to reset the current page being displayed.
      if (this.gridScroller) this.gridScroller.scrollTop = 0;

      this.selectedItems = [];
      this.__currentPage = 0;
      this.__staleDataset = false;
      this.__ignoreScrollEvents = false;
      this.__debounceFetchResourceItems();
    }

    /**
     * This method initializes the vaadin-grid lazy load behavior by provinding the function
     * that interacts with the JSON API.
     */
    __initializeLazyLoad () {
      this.gridScroller.addEventListener('scroll', () => {
        if (this.__ignoreScrollEvents) return;

        const gridScrollerHeight = this.gridScroller.scrollHeight;
        const gridScrollerPosition = this.gridScroller.scrollTop + this.gridScroller.clientHeight;

        // Re-fetch new items when the users scrolls past the 200px threshold.
        if (gridScrollerHeight - gridScrollerPosition <= 500) {
          this.__debounceFetchResourceItems();
        }
      });

      this.__debounceFetchResourceItems();
    }

    /**
     * Internal method that will force the vaadin-grid items to be re-fetched.
     */
    __filterLazyLoadItems () {
      this.refreshItems();
    }

    /**
     * Method that will remotely fetch the resource items via JSON API. This method call suffers
     * debounce to avoid spamming the database.
     */
    __debounceFetchResourceItems () {
      this.__debounce('__fetchResourceItemsDebouncer', () => {
        const missingProperties = [
          'resourceName',
          'resourceSortParam',
          'resourcePageParam',
          'resourcePageSizeParam',
          'resourceTotalsMetaParam',
        ].filter(property => !this[property]);

        // Check if all the required parameters were provided.
        if (missingProperties.length > 0) return;

        this.__currentPage++;

        const parameters = {
          page: this.__currentPage,
          pageSize: this.resourcePageSize,
          sorters: this.__activeSorters
        };

        this.__fetchResourceItems(parameters);
      });
    }

    /**
     * Function that is invoked to fetch items from the remote source which is the JSON API in this case.
     *
     * @param {Object} parameters Object that contains the number of items per page, the current page number and sort settings.
     */
    async __fetchResourceItems (parameters) {
      const socketResponse = await this.__fetchRequest(this.__buildResourceUrl(parameters));

      if (!socketResponse) return;

      // Format the elements returned by the JSON API.
      if (this.resourceFormatter) socketResponse.data.forEach(item => this.resourceFormatter(item));

      if (this.__currentPage !== 1) {
        this.__filteredItems = this.displayedItems = [...this.__filteredItems, ...socketResponse.data];

        // Select all the new items if the existing ones are all selected.
        if (this.__selectAllCheckbox.checked && !this.__selectAllCheckbox.indeterminate) {
          this.selectedItems = [...this.__filteredItems];
        }
      } else {
        // Reset the totals when requesting the first page.
        this.__resourceTotal = undefined;
        this.__resourceGrandTotal = undefined;

        this.__filteredItems = this.displayedItems = socketResponse.data;
        this.grid._scrollToIndex(0);
        this.__activateItemAtIndex();
      }

      // Check if the totals are different which means something changed in the server's dataset.
      if (!this.__staleDataset && (
        (this.__resourceTotal && this.__resourceTotal !== socketResponse.meta.total) ||
        (this.__resourceGrandTotal && this.__resourceGrandTotal !== socketResponse.meta['grand-total'])
      )) {
        this.__staleDataset = true;
      }

      this.__resourceTotal = socketResponse.meta.total;
      this.__resourceGrandTotal = socketResponse.meta['grand-total'];

      // Disable the scroll event listeners when there are no more items.
      this.__ignoreScrollEvents = this.__filteredItems.length === parseInt(socketResponse.meta.total);

      // Update the paging information.
      this.__numberOfResults =  socketResponse.meta.total === socketResponse.meta['grand-total']
        ? `${socketResponse.meta.total} ${this.multiSelectionLabel}`
        : `${socketResponse.meta.total} de ${socketResponse.meta['grand-total']} ${this.multiSelectionLabel}`;
    }

    /**
     * Function that is invoked to fetch children items from the remote source which is the JSON API in this case.
     *
     * @param {Object} parentItem Object that contains the parent item which we are fetching children from.
     */
    async __fetchChildrenResourceItems (parentItem) {
      const parentId = parentItem[this.idProperty];

      // First do a cleanup to the cache object to lower the memory footprint.
      const currentTimestamp = new Date().getTime();
      Object.keys(this.__resourceChildrenCache).forEach(parentId => {
        if (this.__resourceChildrenCache[parentId].expiresAfter <= currentTimestamp) {
          delete this.__resourceChildrenCache[parentId];
        }
      });

      // If the key still exists, it means that the information is not stale yet.
      if (this.__resourceChildrenCache.hasOwnProperty(parentId)) {
        return this.__resourceChildrenCache[parentId].children;
      }

      const socketResponse = await this.__fetchRequest(this.resourceFetchChildrenQuery.replace('%{parentId}', parentItem[this.idProperty]));

      if (!socketResponse) return;

      // Format the elements returned by the JSON API.
      if (this.resourceFormatter) socketResponse.data.forEach(item => this.resourceFormatter(item));

      this.__resourceChildrenCache[parentId] = {
        children: socketResponse.data,
        expiresAfter: new Date().getTime() + this.resourceChildrenCacheDuration
      };

      return socketResponse.data;
    }

    /**
     * Performs a request to the JSON API with the provided URL and handles the errors that may arise from it.
     *
     * @param {String} url The request's URL.
     */
    async __fetchRequest (url) {
      try {
        this.loading = true
        const socketResponse = await this.app.socket.jget(url, this.resourceTimeoutMs);
        this.loading = false;

        return socketResponse;
      } catch (error) {
        console.error(error);

        this.loading = false;
        this.app.openToast({ text: 'Ocorreu um erro ao obter os dados.', backgroundColor: 'red' });
      }
    }

    /**
     * This method will build the JSON API resource url with all the required parameters and filters.
     * @param {Object} parameters Object that contains the number of items per page, the current page number and sort settings.
     */
    __buildResourceUrl (parameters) {
      let resourceUrlParams = [
        this.resourceTotalsMetaParam,
        `${this.resourcePageParam}=${parameters.page}`,
        `${this.resourcePageSizeParam}=${parameters.pageSize}`
      ];

      // Limit the fields that are request to the JSON API.
      if (this.resourceListAttributes && this.resourceListAttributes.length > 0) {
        resourceUrlParams = [...resourceUrlParams, `fields[${this.resourceName}]=${this.resourceListAttributes.join(',')}`];
      }

      // Sort by ascending or descending.
      if (parameters.sorters.length > 0) {
        const sortParameters = parameters.sorters.map(sorter => sorter.direction === CasperMoacSortDirections.ASCENDING ? sorter.path : `-${sorter.path}`);
        resourceUrlParams = [...resourceUrlParams, `${this.resourceSortParam}=${sortParameters.join(',')}`];
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
        .filter(filterItem =>
          this.__valueIsNotEmpty(filterItem.filter.value)
            && filterItem.filter.lazyLoad
            && filterItem.filter.lazyLoad.field
            && filterItem.filter.lazyLoad.operator
            && !filterItem.filter.lazyLoad.disabled
        )
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