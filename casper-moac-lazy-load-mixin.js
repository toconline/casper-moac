export const CasperMoacLazyLoadBehavior = superClass => class CasperMoacLazyLoadBehavior extends superClass {

  static get properties () {
    return {
      /**
       * Number of results that will be displayed per page.
       * @type {Number}
       */
      pageSize: {
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
       * @type {Array}
       */
      resourceFilterDebounceMs: {
        type: Number,
        value: 250
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

  _initializeLazyLoad () {
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

    this.$.grid.dataProvider = (parameters, callback) => this._fetchResourceItems(parameters, callback);
  }

  _filterItemsLazyLoad () {
    this.$.grid.clearCache();
  }

  _fetchResourceItems (parameters, callback) {
    app.socket.getData(this._buildResourceUrl(parameters), this.resourceTimeoutMs, socketResponse => {
      if (socketResponse.errors) return;

      callback(
        socketResponse.data.map(item => ({ id: item.id, ...item.attributes })),
        parseInt(socketResponse.meta.total)
      );

      this._gridSelectedItems = [];
      this._bindDisableDefaultClickListener();
    });
  }

  _buildResourceUrl (parameters) {
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
      const sortSettings = parameters.sortOrders.shift(); 
      resourceUrlParams = sortSettings.direction === this.constructor.sortByAscending
        ? [...resourceUrlParams, `${this.resourceSortParam}=${sortSettings.path}`]
        : [...resourceUrlParams, `${this.resourceSortParam}=-${sortSettings.path}`];
    }

    // Check if there are attributes that should be filtered and if the input has already been initialized.
    const fixedFilters = this._applyFilters().join(' AND ');
    if (this.$.filterInput
      && this.$.filterInput.value
      && this.resourceFilterAttributes
      && this.resourceFilterAttributes.length > 0) {
      const freeTextFilters = this.resourceFilterAttributes.map(filterAttribute => {
        return `${filterAttribute}::TEXT ILIKE '%${this._sanitizeValue(this.$.filterInput.value)}%'`;
      }).join(' OR ');

      resourceUrlParams = [...resourceUrlParams, `${this.resourceFilterParam}="${[fixedFilters, `(${freeTextFilters})`].join(' AND ')}"`];
    } else {
      resourceUrlParams = [...resourceUrlParams, `${this.resourceFilterParam}="${fixedFilters}"`];
    }

    // Check if there is already existing filters in the resource name.
    return this.resourceName.includes('?')
      ? `${this.resourceName}&${resourceUrlParams.join('&')}`
      : `${this.resourceName}?${resourceUrlParams.join('&')}`;
  }

  _applyFilters () {
    if (!this._filters) return [];

    return this._filters
      .filter(filterItem => {
        return this._valueIsNotEmpty(filterItem.filter.value)
          && filterItem.filter.lazyLoad
          && filterItem.filter.lazyLoad.field
          && filterItem.filter.lazyLoad.comparisonType
      })
      .map(filterItem => {
        const filter = filterItem.filter;
        switch (filter.lazyLoad.comparisonType) {
          // String comparisons.
          case 'ENDS_WITH': return `${filter.lazyLoad.field}::TEXT ILIKE '%${this._sanitizeValue(filter.value)}'`;
          case 'CONTAINS': return `${filter.lazyLoad.field}::TEXT ILIKE '%${this._sanitizeValue(filter.value)}%'`;
          case 'EXACT_MATCH': return `${filter.lazyLoad.field}::TEXT ILIKE '${this._sanitizeValue(filter.value)}'`;
          case 'STARTS_WITH': return `${filter.lazyLoad.field}::TEXT ILIKE '${this._sanitizeValue(filter.value)}%'`;
          case 'DOES_NOT_CONTAIN': return `${filter.lazyLoad.field}::TEXT NOT ILIKE '%${this._sanitizeValue(filter.value)}%'`;
          // Numeric comparisons.
          case 'LESS_THAN': return `${filter.lazyLoad.field} < ${filter.value}`;
          case 'GREATER_THAN': return `${filter.lazyLoad.field} > ${filter.value}`;
          case 'LESS_THAN_OR_EQUAL_TO': return `${filter.lazyLoad.field} <= ${filter.value}`;
          case 'GREATER_THAN_OR_EQUAL_TO': return `${filter.lazyLoad.field} >= ${filter.value}`;
        }
    });
  }

  _sanitizeValue (value) {
    // Escape special characters that might break the ILIKE clause or the JSONAPI url parsing.
    const escapedValue = value.toString().replace(/[%\\]/g, '\\$&');
    return escapedValue.replace(/[&]/g, '_');
  }
}