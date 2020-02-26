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
          type: String
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
         * Query that will be used when the developer specifies a custom query for each one of the possible filter values.
         *
         * @type {String}
         */
        resourceCustomQueryKey: {
          type: String,
          value: 'customQuery'
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
        /**
         * Internal property to cache children elements in order to avoid spamming the server.
         *
         * @type {Object}
         */
        __resourceChildrenCache: {
          type: Object,
          value: {}
        }
      };
    }

    /**
     * Fetches the items from the JSON API and returns them.
     *
     * @param {Array | String | Number} itemsToFetch The list of item identifiers that will be fetched from the JSON API.
     * @param {Array | String} filters The filters that will be applied when fetching the items.
     */
    async fetchItemFromAPI (itemsToFetch, filters) {
      return await this.__fetchRequest(this.__buildResourceUrlForAddOrUpdate(itemsToFetch, filters));
    }

    /**
     * This method will fetch specific items from the JSON API and then add them to the vaadin-grid.
     *
     * @param {Array | String | Number} itemsToAdd The list of item identifiers that will be fetched from the JSON API and appended
     * to the grid using the already existing addItem method.
     * @param {String | Number} afterItemId The item's identifier which we'll the append the new item(s) after.
     * @param {Boolean} staleDataset This flag will decide if the dataset will become stale or not.
     */
    async addItemFromAPI (itemsToAdd, afterItemId, staleDataset = true) {
      const socketResponse = await this.fetchItemFromAPI(itemsToAdd);

      if (socketResponse) {
        this.addItem(socketResponse.data, afterItemId, staleDataset);

        return itemsToAdd.constructor.name === 'Array'
          ? this.__filteredItems.filter(item => this.__compareItemWithIds(item, itemsToAdd, true))
          : this.__filteredItems.find(item => this.__compareItemWithId(item, itemsToAdd, true));
      }
    }

    /**
     * This method will fetch specific items from the JSON API and then replace their old versions that
     * are currently in the vaadin-grid.
     *
     * @param {Array | String | Number} itemsToUpdate The list of item identifiers that will be fetched from the JSON API and updated
     * in the grid using the already existing updateItem method.
     * @param {Boolean} staleDataset This flag will decide if the dataset will become stale or not.
     */
    async updateItemFromAPI (itemsToUpdate, staleDataset = true) {
      const socketResponse = await this.fetchItemFromAPI(itemsToUpdate);

      if (socketResponse) {
        if (socketResponse.data.constructor.name === 'Array') {
          const itemToActivate = itemsToUpdate.constructor.name === 'Array'
            ? String(itemsToUpdate[0])
            : String(itemsToUpdate);

          // Sort the server's response since it could return more records than the ones requested which causes "random" items to be activated.
          const sortedServerResponse = socketResponse.data.sort((previousItem, nextItem) => {
            if (String(nextItem[this.idExternalProperty]) === itemToActivate) return 1;
            if (String(previousItem[this.idExternalProperty]) === itemToActivate) return -1;

            return 0;
          });

          this.updateItem(sortedServerResponse, staleDataset);
        } else {
          this.updateItem(socketResponse.data, staleDataset);
        }

        return itemsToUpdate.constructor.name === 'Array'
          ? this.__filteredItems.filter(item => this.__compareItemWithIds(item, itemsToUpdate, true))
          : this.__filteredItems.find(item => this.__compareItemWithId(item, itemsToUpdate, true));
      }
    }

    /**
     * Public method that allows the casper-moac users to re-fetch the items.
     *
     * @param {String | Number} activateItemId The item's identifier that will be activated after re-fetching the new items.
     */
    refreshItems (activateItemId) {
      // Scroll to the top of the grid to reset the current page being displayed.
      if (this.gridScroller) this.gridScroller.scrollTop = 0;

      this.__currentPage = 0;
      this.__selectedItems = [];
      this.__staleDataset = false;
      this.__ignoreScrollEvents = false;
      this.__activateItemId = activateItemId;
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

        if (this.beforeJsonApiRequest) {
          this.beforeJsonApiRequest.call(this.page || {});
        }

        this.__fetchResourceItems();
      });
    }

    /**
     * Function that is invoked to fetch items from the remote source which is the JSON API in this case.
     */
    async __fetchResourceItems () {
      // Check if there is already existing filters in the resource name.
      const url = this.resourceName.includes('?')
        ? `${this.resourceName}&${this.buildResourceUrl()}`
        : `${this.resourceName}?${this.buildResourceUrl()}`;

      const socketResponse = await this.__fetchRequest(url);

      if (!socketResponse) return;

      // Format the elements returned by the JSON API.
      if (this.resourceFormatter) socketResponse.data.forEach(item => this.resourceFormatter.call(this.page || {}, item));

      if (this.__currentPage !== 1) {
        this.__filteredItems = [...this.__filteredItems, ...socketResponse.data];

        // Since there are new items, set the select all checkbox to indeterminate if it's currently checked.
        if (!this.disableSelection && this.__selectAllCheckbox.checked && !this.__selectAllCheckbox.indeterminate) {
          this.__selectAllCheckbox.indeterminate = true;
        }
      } else {
        // Reset the totals when requesting the first page.
        this.__resourceTotal = undefined;
        this.__resourceGrandTotal = undefined;
        this.__filteredItems = socketResponse.data;

        this.__activateItem();
      }

      // Check if the totals are different which means something changed in the server's dataset.
      if (!this.__staleDataset && (
        (this.__resourceTotal && this.__resourceTotal !== socketResponse.meta.total) ||
        (this.__resourceGrandTotal && this.__resourceGrandTotal !== socketResponse.meta['grand-total']))) {
        this.__staleDataset = true;
      }

      this.__resourceTotal = socketResponse.meta.total;
      this.__resourceGrandTotal = socketResponse.meta['grand-total'];

      // Disable the scroll event listeners when there are no more items.
      this.__ignoreScrollEvents = this.__filteredItems.length === parseInt(socketResponse.meta.total);

      // Update the paging information.
      this.__numberOfResults = socketResponse.meta.total === socketResponse.meta['grand-total']
        ? `${socketResponse.meta.total} ${this.multiSelectionLabel}`
        : `${socketResponse.meta.total} de ${socketResponse.meta['grand-total']} ${this.multiSelectionLabel}`;
    }

    /**
     * Function that is invoked to fetch children items from the remote source which is the JSON API in this case.
     *
     * @param {Object} parentItem Object that contains the parent item which we are fetching children from.
     */
    async __fetchChildrenResourceItems (parentItem) {
      const parentId = parentItem[this.idInternalProperty];

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

      // Replace all the placeholders with the actual parent's property value.
      let resourceFetchChildrenQuery = this.resourceFetchChildrenQuery;
      [...resourceFetchChildrenQuery.matchAll(/%{(\w+)}/g)].forEach(match => {
        resourceFetchChildrenQuery = resourceFetchChildrenQuery.replace(match[0], parentItem[match[1]]);
      });

      const socketResponse = await this.__fetchRequest(resourceFetchChildrenQuery);

      if (!socketResponse) return;

      // Format the elements returned by the JSON API.
      if (this.resourceFormatter) {
        socketResponse.data.forEach(item => this.resourceFormatter.call(this.page || {}, item));
      }

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
        this.loading = true;
        const socketResponse = await this.app.broker.get(url, this.resourceTimeoutMs, true);
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
     */
    buildResourceUrl () {
      let resourceUrlParams = [
        this.resourceTotalsMetaParam,
        `${this.resourcePageParam}=${this.__currentPage}`,
        `${this.resourcePageSizeParam}=${this.resourcePageSize}`
      ];

      // Limit the fields that are request to the JSON API.
      if (this.resourceListAttributes && this.resourceListAttributes.length > 0) {
        resourceUrlParams = [...resourceUrlParams, `fields[${this.resourceName}]=${this.resourceListAttributes.join(',')}`];
      }

      // Sort by ascending or descending.
      if (this.__activeSorters.length > 0) {
        const sortParameters = this.__activeSorters.map(sorter => sorter.direction === CasperMoacSortDirections.ASCENDING ? sorter.path : `-${sorter.path}`);
        resourceUrlParams = [...resourceUrlParams, `${this.resourceSortParam}=${sortParameters.join(',')}`];
      }

      const filterResourceUrlParams = [
        this.resourceDefaultFilters,
        this.__buildResourceUrlFreeFilters(),
        this.__buildResourceUrlFixedFilters(),
      ].filter(filterUrlParam => !!filterUrlParam)
        .map(filterUrlParam => encodeURIComponent(filterUrlParam))
        .join(' AND ');

      if (filterResourceUrlParams) {
        resourceUrlParams = [...resourceUrlParams, `${this.resourceFilterParam}="${filterResourceUrlParams}"`];
      }

      return resourceUrlParams.join('&');
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

        const filterValue = this.$.filterInput.value.toString().trim();

        freeFilters = this.resourceFilterAttributes.map(filterAttribute => {
          if (filterAttribute.constructor.name === 'Object') {
            switch (filterAttribute.operator) {
              case CasperMoacOperators.CONTAINS: return `${filterAttribute.field}::TEXT ILIKE '%${filterValue}%'`;
              case CasperMoacOperators.ENDS_WITH: return `${filterAttribute.field}::TEXT ILIKE '%${filterValue}'`;
              case CasperMoacOperators.STARTS_WITH: return `${filterAttribute.field}::TEXT ILIKE '${filterValue}%'`;
              case CasperMoacOperators.EXACT_MATCH: return `${filterAttribute.field}::TEXT ILIKE '${filterValue}'`;
            }
          }

          return `${filterAttribute}::TEXT ILIKE '%${filterValue}%'`;
        });

        // Encapsulate the free filters in parenthesis to not mess with the AND clause.
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
          const filterValue = filter.value.toString().trim();

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
            case CasperMoacOperators.CONTAINS: return `${filter.lazyLoad.field}::TEXT ILIKE '%${filterValue}%'`;
            case CasperMoacOperators.ENDS_WITH: return `${filter.lazyLoad.field}::TEXT ILIKE '%${filterValue}'`;
            case CasperMoacOperators.EXACT_MATCH: return `${filter.lazyLoad.field}::TEXT ILIKE '${filterValue}'`;
            case CasperMoacOperators.STARTS_WITH: return `${filter.lazyLoad.field}::TEXT ILIKE '${filterValue}% '`;
            case CasperMoacOperators.DOES_NOT_CONTAIN: return `${filter.lazyLoad.field}::TEXT NOT ILIKE '%${filterValue}% '`;
            // Numeric comparisons.
            case CasperMoacOperators.LESS_THAN: return `${filter.lazyLoad.field} < ${filter.value}`;
            case CasperMoacOperators.GREATER_THAN: return `${filter.lazyLoad.field} > ${filter.value}`;
            case CasperMoacOperators.LESS_THAN_OR_EQUAL_TO: return `${filter.lazyLoad.field} <= ${filter.value}`;
            case CasperMoacOperators.GREATER_THAN_OR_EQUAL_TO: return `${filter.lazyLoad.field} >= ${filter.value}`;
            // Custom comparisons.
            case CasperMoacOperators.CUSTOM: return filter.lazyLoad.field.replace(new RegExp(`%{${filterItem.filterKey}}`, 'g'), filter.value);
            case CasperMoacOperators.CUSTOM_PER_VALUE:
              // The custom comparison per value only applies to single selection casper-select components.
              if (filter.type !== CasperMoacFilterTypes.CASPER_SELECT || filter.inputOptions.multiSelection) return;

              const casperSelect = this.__getFilterComponent(filterItem.filterKey);

              return casperSelect.selectedItems[this.resourceCustomQueryKey].replace(new RegExp(`%{${filterItem.filterKey}}`, 'g'), filter.value);
          }
        }).join(' AND ');
    }

    /**
     * This method builds the url that will be used when the developer wants to add / update specific items from the JSON API.
     *
     * @param {Array | String | Number} items The list of item identifiers that will be added / replaced in the vaadin-grid.
     */
    __buildResourceUrlForAddOrUpdate (items, filters = []) {
      if (filters.constructor.name !== 'Array') filters = [filters];

      const resourceFilterParameter = items.constructor.name !== 'Array'
        ? `${this.resourceFilterParam}="${this.idExternalProperty}::TEXT = '${items}'::TEXT"`
        : `${this.resourceFilterParam}="${this.idExternalProperty}::TEXT IN (${items.map(item => `'${item}'::TEXT`).join(',')})"`;

      let resourceUrl = this.resourceName.includes('?')
        ? `${this.resourceName}&${resourceFilterParameter}`
        : `${this.resourceName}?${resourceFilterParameter}`;

      if (filters.length > 0) resourceUrl = `${resourceUrl}&${filters.join('&')}`;

      return resourceUrl;
    }
  }
}