import '@casper2020/casper-icons/casper-icons.js';
import '@casper2020/casper-epaper/casper-epaper.js';
import '@vaadin/vaadin-grid/vaadin-grid.js';
import '@vaadin/vaadin-split-layout/vaadin-split-layout.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-input/iron-input.js';
import '@polymer/paper-spinner/paper-spinner.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

export class CasperMoac extends PolymerElement {

  static get is () {
    return 'casper-moac';
  }

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
       * List of attributes that should be displayed on the iron-list.
       * @type {Array}
       */
      resourceListAttributes: Array,
      /**
       * List of attributes that should be displayed on the iron-list.
       * @type {Array}
       */
      resourceFilterAttributes: Array,
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
      },
      /**
       * The placeholder used in the input where the user can filter the results.
       * @type {String}
       */
      filterInputPlaceholder: {
        type: String,
        value: 'Filtrar Resultados'
      }
    };
  }

  static get template () {
    return html`
      <style>
        vaadin-split-layout {
          height: 100%;
          transform: unset;
          overflow: visible !important;
        }

        .left-side-container {
          width: 35%;
          padding: 20px;
          background-color: white;
          display: flex;
          flex-direction: column;
        }

        .left-side-container .header-container {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 10px;
          justify-content: center;
        }

        .left-side-container .header-container > * {
          flex: 1;
        }

        .left-side-container .header-container .filters-container {
          padding: 0 10px;
          text-align: center;
        }

        /* Iron input styles */
        .left-side-container .header-container .filters-container #filterInput {
          height: 35px;
          display: flex;
          padding: 0 10px;
          border-radius: 3px;
          align-items: center;
          border: 1px solid lightgrey;
        }

        .left-side-container .header-container .filters-container #filterInput:focus {
          border-color: var(--primary-color);
        }

        .left-side-container .header-container .filters-container #filterInput iron-icon {
          height: 50%;
          color: var(--moac-light-grey);
        }

        .left-side-container .header-container .filters-container #filterInput input {
          border: 0;
          flex-grow: 1;
          outline: none;
          font-size: 13px;
        }

        .left-side-container .header-container .filters-container #seeAllFilters {
          font-size: 0.85em;
          font-weight: bold;
          text-transform: unset;
          color: var(--primary-color);
        }

        .left-side-container .grid-container {
          flex-grow: 1;
          position: relative;
        }

        .left-side-container .grid-container vaadin-grid {
          height: 100%;
        }

        .left-side-container .grid-container paper-spinner {
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: 1;
          width: 100px;
          height: 100px;
          transform: translate(-50%, -50%);
          --paper-spinner-stroke-width: 6px;
        }

        .right-side-container {
          width: 65%;
        }
      </style>
      <vaadin-split-layout>
        <div class="left-side-container">
          <div class="header-container">
            <!--Casper-moac-menu-->
            <slot name="menu"></slot>
            <div class="filters-container">
              <!--Filter input-->
              <iron-input id="filterInput">
                <input placeholder="[[filterInputPlaceholder]]" />
                <iron-icon icon="casper-icons:search"></iron-icon>
              </iron-input>
              <!--Show/hide the active filters-->
              <paper-button id="seeAllFilters">
                Ver todos os filtros
              </paper-button>
            </div>
          </div>

          <!--Vaadin grid container-->
          <div class="grid-container">
            <paper-spinner active$="[[_gridLoading]]"></paper-spinner>
            <vaadin-grid
              id="grid"
              class="moac"
              page-size="[[pageSize]]"
              loading="{{_gridLoading}}">
              <slot name="grid"></slot>
            </vaadin-grid>
          </div>
        </div>
        <div class="right-side-container">
          <casper-epaper app="[[app]]"></casper-epaper>
        </div>
      </vaadin-split-layout>
    `;
  }

  static get sortByAscending () { return 'asc'; }
  static get sortByDescending () { return 'desc'; }

  ready () {
    super.ready();

    // Set the Vaadin Grid options.
    this.$.grid.dataProvider = (parameters, callback) => this._fetchResourceItems(parameters, callback);

    // Set event listeners.
    this.$.filterInput.addEventListener('keyup', () => this._filterChanged());
  }

  _filterChanged () {
    this._filterChangedDebouncer = Debouncer.debounce(
      this._filterChangedDebouncer,
      timeOut.after(this.resourceFilterDebounceMs),
      () => this.$.grid.clearCache()
    );
  }

  _fetchResourceItems (parameters, callback) {
    app.socket.getData(this._buildResourceUrl(parameters), this.resourceTimeoutMs, socketResponse => {
      if (socketResponse.errors) return;

      callback(
        socketResponse.data.map(item => ({ id: item.id, ...item.attributes })),
        parseInt(socketResponse.meta.total)
      );
    });
  }

  _buildResourceUrl (parameters) {
    let resourceUrlParams = [
      this.resourceTotalsMetaParam,                                           // totals=1
      `${this.resourcePageParam}=${parameters.page + 1}`,                     // page[number]=1
      `${this.resourcePageSizeParam}=${parameters.pageSize}`,                 // page[size]=1
      `fields[${this.resourceName}]=${this.resourceListAttributes.join(',')}` // fields[general_ledger]=child_count,description
    ];

    // Sort by ascending or descending.
    if (parameters.sortOrders.length > 0) {
      const sortSettings = parameters.sortOrders.shift(); 
      resourceUrlParams = sortSettings.direction === CasperMoac.sortByAscending
        ? [...resourceUrlParams, `${this.resourceSortParam}=${sortSettings.path}`]
        : [...resourceUrlParams, `${this.resourceSortParam}=-${sortSettings.path}`];
    }

    // Check if there are attributes that should be filtered and if the input has already been initialized.
    if (this.resourceFilterAttributes.length > 0 && this.$.filterInput && this.$.filterInput.value !== undefined) {
      const resourceFilters = this.resourceFilterAttributes.map(filterAttribute => {
        // Escape special characters that might break the ILIKE clause or the JSONAPI url parsing.
        let escapedValue = this.$.filterInput.value.replace(/[%\\]/g, '\\$&');
        escapedValue = escapedValue.replace(/[&]/g, '_');

        return `${filterAttribute}::TEXT ILIKE '%${escapedValue}%'`;
      });

      resourceUrlParams = [
        ...resourceUrlParams,
        `${this.resourceFilterParam}="${resourceFilters.join(' AND ')}"`
      ];
    }

    // Check if there is already existing filters in the resource name.
    return this.resourceName.includes('?')
      ? `${this.resourceName}&${resourceUrlParams.join('&')}`
      : `${this.resourceName}?${resourceUrlParams.join('&')}`;
  }
}

customElements.define(CasperMoac.is, CasperMoac);
