import './sidebar/casper-moac-sidebar.js';
import { CasperMoacSortingMixin } from './mixins/casper-moac-sorting-mixin.js';
import { CasperMoacLazyLoadMixin } from './mixins/casper-moac-lazy-load-mixin.js';
import { CasperMoacTypes, CasperMoacFilterTypes, CasperMoacOperators } from './casper-moac-constants.js';

import '@vaadin/vaadin-split-layout/vaadin-split-layout.js';
import '@vaadin/vaadin-grid/vaadin-grid.js';
import '@vaadin/vaadin-grid/vaadin-grid-column.js';
import '@vaadin/vaadin-grid/vaadin-grid-selection-column.js';
import '@casper2020/casper-icons/casper-icon.js';
import '@casper2020/casper-icons/casper-icons.js';
import '@casper2020/casper-epaper/casper-epaper.js';
import '@casper2020/casper-select/casper-select.js';
import '@casper2020/casper-date-picker/casper-date-picker.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { templatize } from '@polymer/polymer/lib/utils/templatize.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

export class CasperMoac extends CasperMoacLazyLoadMixin(CasperMoacSortingMixin(PolymerElement)) {

  static get is () {
    return 'casper-moac';
  }

  static get properties () {
    return {
      /**
       * Since the page load process will change there might be sometimes where this property is not
       * defined so we initialize it this way to enure that nothing breaks.
       *
       * @type {Object}
       */
      app: {
        type: Object,
        value: window.app
      },
      /**
       * The page that is currently using the casper-moac component.
       *
       * @type {Object}
       */
      page: Object,
      /**
       * This states what kind of MOAC we're dealing with so that certain items are displayed / hidden.
       *
       * @type {String}
       */
      moacType: {
        type: String,
        value: CasperMoacTypes.GRID_EPAPER
      },
      /**
       * The list of items to be displayed.
       *
       * @type {Array}
       */
      items: {
        type: Array,
        observer: '__itemsChanged'
      },
      /**
       * The items that are being currently displayed with all the applied filters.
       *
       * @type {Array}
       */
      displayedItems: {
        type: Array,
        notify: true
      },
      /**
       * List of attributes that should be used to filter.
       *
       * @type {Array}
       */
      resourceFilterAttributes: Array,
      /**
       * The placeholder used in the input where the user can filter the results.
       *
       * @type {String}
       */
      filterInputPlaceholder: {
        type: String,
        value: 'Filtrar resultados'
      },
      /**
       * Label that will be used on the header when multiple items are selected in
       * the vaadin-grid.
       *
       * @type {String}
       */
      multiSelectionLabel: {
        type: String,
        value: 'resultado(s)'
      },
      /**
       * Flag used to activate the casper-moac's lazy load mode.
       *
       * @type {Boolean}
       */
      lazyLoad: {
        type: Boolean,
        value: false
      },
      /**
       * A reference to the epaper object so that the page using casper-moac can
       * use its methods.
       *
       * @type {Object}
       */
      epaper: {
        type: Object,
        notify: true
      },
      /**
       * A reference to the vaadin-grid so that the page using casper-moac can
       * use its methods.
       *
       * @type {Object}
       */
      grid: {
        type: Object,
        notify: true
      },
      /**
       * A reference to the vaadin-grid's scroller so that developers can attach event listeners to it.
       *
       * @type {Object}
       */
      gridScroller: {
        type: Object,
        notify: true
      },
      /**
       * The item that is currently active in the vaadin-grid.
       *
       * @type {Object}
       */
      activeItem: {
        type: Object,
        notify: true,
        observer: '__activeItemChanged'
      },
      /**
       * The active item debouncer timeout to not trigger too many changes.
       *
       * @type {Number}
       */
      activeItemDebounce: {
        type: Number
      },
      /**
       * The items that are currently expanded in the vaadin-grid.
       *
       * @type {Array}
       */
      expandedItems: {
        type: Array,
        notify: true,
        value: []
      },
      /**
       * The items that are currently selected in the vaadin-grid.
       *
       * @type {Array}
       */
      selectedItems: {
        type: Array,
        notify: true
      },
      /**
       * The array of filters that are available to filter the results presents on the page.
       *
       * @type {Array}
       */
      filters: {
        type: Object,
        notify: true,
        observer: '__filtersChanged'
      },
      /**
       * The name of the GET parameter that will hold the free filter's value.
       *
       * @type {String}
       */
      freeFilterUrlParameterName: {
        type: String,
        value: 'query'
      },
      /**
       * The minimum percentual width of the left~side container.
       *
       * @type {Number}
       */
      leftSideMinimumWidth: Number,
      /**
       * The maximum percentual width of the left~side container.
       *
       * @type {Number}
       */
      leftSideMaximumWidth: Number,
      /**
       * The initial percentual width of the left~side container.
       *
       * @type {Number}
       */
      leftSideInitialWidth: {
        type: Number,
        value: 40
      },
      /**
       * Whether to display or not the number of results on the top-right corner of the filters.
       *
       * @type {Boolean}
       */
      hideNumberResults: {
        type: Boolean,
        value: false
      },
      /**
       * Icon that will be used when the vaadin-grid has no items to display.
       *
       * @type {String}
       */
      noItemsIcon: {
        type: String,
        value: 'fa-light:clipboard'
      },
      /**
       * Text that will be used when the vaadin-grid has no items to display.
       *
       * @type {String}
       */
      noItemsText: {
        type: String,
        value: 'Não existem quaisquer resultados para mostrar.'
      },
      /**
       * Boolean that when set to true, forces one item to be active all the time.
       *
       * @type {Boolean}
       */
      forceActiveItem: {
        type: Boolean,
        value: false
      },
      /**
       * Boolean that toggles the paper-spinner when the grid is loading items. This was required since the vaadin-grid one
       * is readoOnly.
       *
       * @type {Boolean}
       */
      loading: {
        type: Boolean,
        value: false
      },
      /**
       * Boolean that when set to true freezes the selection column inserted automatically by the casper-moac component.
       *
       * @type {Boolean}
       */
      freezeSelectionColumn: {
        type: Boolean,
        value: false
      },
      /**
       * The function that is going to be called before the JSON API request.
       *
       * @type {Function}
       */
      beforeJsonApiRequest: {
        type: Function,
      },
      /**
       * Boolean that states if the vaadin-grid should have the selection column or not.
       *
       * @type {Boolean}
       */
      disableSelection: {
        type: Boolean,
        value: false,
      },
      /**
       * Boolean that states if we should or shouldn't display the epaper's blank page when there is no active item.
       *
       * @type {Boolean}
       */
      disableResetEpaper: {
        type: Boolean,
        value: false,
      },
      /**
       * This property disables the odd / even row styling.
       *
       * @type {Boolean}
       */
      disableRowStripes: {
        type: Boolean,
        value: false
      },
      /**
       * The external property where the items' children are stored.
       *
       * @type {String}
       */
      childrenExternalProperty: {
        type: String,
      },
      /**
       * The external property where the items' parents are stored.
       *
       * @type {String}
       */
      parentExternalProperty: {
        type: String
      },
      /**
       * The external identifier property that will be used when painting the active row.
       *
       * @type {String}
       */
      idExternalProperty: {
        type: String,
        value: 'id'
      },
      /**
       * The internal identifier property that will be used when painting the active row.
       *
       * @type {String}
       */
      idInternalProperty: {
        type: String,
        value: '__identifier'
      },
      /**
       * The children's local property where this component will save their parent identifier
       * to easily remove them later.
       *
       * @type {String}
       */
      parentInternalProperty: {
        type: String,
        value: '__parent'
      },
      /**
       * This property disables the possibility of one item to be selected.
       *
       * @type {Boolean}
       */
      disableSelectionInternalProperty: {
        type: String,
        value: '__disableSelection'
      },
      /**
       * The filters's local property where this component will save if his event listeners were already attached or not.
       *
       * @type {String}
       */
      attachedEventListenersInternalProperty: {
        type: String,
        value: '__attachedEventListeners'
      },
      /**
       * Internal property that an item can define which changes its row background color.
       *
       * @type {String}
       */
      rowBackgroundColorInternalProperty: {
        type: String,
        value: '__rowBackgroundColor'
      },
      /**
       * Array that contains the filter components since the developer might want to access them.
       *
       * @type {Array}
       */
      filterComponents: {
        type: Array
      },
      /**
       * Flag that is passed to the casper-epaper component which disables the sticky
       * mouseenter / mouseleave animation.
       *
       * @type {Boolean}
       */
      epaperDisableStickyAnimation: {
        type: Boolean,
        value: false
      },
      /**
       * Property that is passed to the casper-epaper component which states the maximum height in pixels
       * the sticky can have.
       *
       * @type {Number}
       */
      epaperStickyMaximumHeight: {
        type: Number
      },
      /**
       * Property that is passed to the casper-epaper component which sets its initial zoom.
       */
      epaperZoom: {
        type: Number,
      },
      /**
       * Whether to display or not all the filters components (casper-select / paper-input / casper-date-picker).
       *
       * @type {Boolean}
       */
      __displayAllFilters: {
        type: Boolean,
        value: false,
        observer: '__displayAllFiltersChanged'
      },
      /**
       * The items that are currently displayed in the vaadin-grid.
       *
       * @type {Array}
       */
      __filteredItems: {
        type: Array,
        value: [],
        observer: '__filteredItemsChanged'
      },
      /**
       * This object contains the filter keys and values that should not be used to fetch new items since those filters
       * were already applied beforehand.
       *
       * @type {Object}
       */
      __skipValueChangedEvents: {
        type: Object,
        value: {}
      }
    };
  }

  static get observers () {
    return [
      '__selectedItemsChanged(__selectedItems.splices)'
    ];
  }

  static get template () {
    return html`
      <style include="casper-common-styles">

        .main-container {
          display: flex;
          height: 100%;
        }

        .main-container vaadin-split-layout {
          height: 100%;
          flex-grow: 1;
          transform: unset;
        }

        .main-container vaadin-split-layout .left-side-container {
          padding: 15px;
          display: flex;
          flex-direction: column;
        }

        .main-container vaadin-split-layout .left-side-container .header-container {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 10px;
          justify-content: center;
        }

        .main-container vaadin-split-layout .left-side-container .header-container > * {
          flex: 1;
        }

        .main-container vaadin-split-layout .left-side-container .header-container .generic-filter-container {
          padding: 0 10px;
          text-align: center;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* Filter paper-input */
        .main-container vaadin-split-layout .left-side-container .header-container .generic-filter-container #filterInput {
          height: 35px;
          display: flex;
          padding: 0;
          padding-left: 10px;
          font-size: 13px;
          border-radius: 3px;
          align-items: center;
          outline: none;
          box-sizing: border-box;
          border: 1px solid lightgrey;
          transition: border 250ms linear,
                      background-color 250ms linear;
        }

        .main-container vaadin-split-layout .left-side-container .header-container .generic-filter-container #filterInput ~ casper-icon {
          top: 10px;
          right: 20px;
          width: 15px;
          height: 15px;
          position: absolute;
          --casper-icon-fill-color: var(--primary-color);
        }

        .main-container vaadin-split-layout .left-side-container .header-container .generic-filter-container #displayAllFilters {
          margin: 0;
          width: 100%;
          line-height: 15px;
          font-size: 0.85em;
          font-weight: bold;
          text-transform: unset;
          color: var(--primary-color);
          transition: background-color 100ms linear;
        }

        .main-container vaadin-split-layout .left-side-container .header-container .generic-filter-container #displayAllFilters:hover {
          background-color: rgba(var(--primary-color-rgb), 0.2);
        }

        .main-container vaadin-split-layout .left-side-container .header-container .generic-filter-container #displayAllFilters casper-icon {
          width: 15px;
          height: 15px;
          margin-left: 5px;
          transition: transform 200ms linear;
          --casper-icon-fill-color: var(--primary-color);
        }

        .main-container vaadin-split-layout .left-side-container .header-container .generic-filter-container #displayAllFilters casper-icon[rotate] {
          transform: rotate(180deg);
        }

        /* Active filters summary */
        .main-container vaadin-split-layout .left-side-container .header-container .active-filters {
          display: flex;
          font-size: 0.85em;
          flex-direction: column;
        }

        .main-container vaadin-split-layout .left-side-container .header-container .active-filters .header {
          display: flex;
          line-height: 20px;
          margin-bottom: 10px;
          align-items: center;
          justify-content: space-between;
        }

        .main-container vaadin-split-layout .left-side-container .header-container .active-filters .header .header-title {
          display: flex;
          align-items: center;
        }

        .main-container vaadin-split-layout .left-side-container .header-container .active-filters .header .header-title casper-icon {
          width: 20px;
          height: 20px;
          padding: 5px;
          border-radius: 50%;
          margin-right: 5px;
          box-sizing: border-box;
          background-color: var(--primary-color);
          --casper-icon-fill-color: white;
        }

        .main-container vaadin-split-layout .left-side-container .header-container .active-filters .header .header-title casper-icon:hover {
          cursor: pointer;
          background-color: var(--dark-primary-color);
        }

        .main-container vaadin-split-layout .left-side-container .header-container .active-filters .active-filters-list {
          display: flex;
          flex-wrap: wrap;
        }

        .main-container vaadin-split-layout .left-side-container .header-container .active-filters .no-active-filters {
          color: #A5A5A5;
        }

        .main-container vaadin-split-layout .left-side-container .header-container .active-filters .active-filters-list .active-filter strong {
          cursor: pointer;
          margin-right: 5px;
          color: var(--primary-color);
          transition: color 100ms linear;
        }

        .main-container vaadin-split-layout .left-side-container .header-container .active-filters .active-filters-list .active-filter strong:hover {
          color: var(--dark-primary-color);
        }

        /* Active filters */
        .main-container vaadin-split-layout .left-side-container .filters-container {
          display: grid;
          grid-row-gap: 10px;
          grid-column-gap: 10px;
          grid-template-columns: 1fr 1fr;
          padding: 15px;
          margin-bottom: 15px;
          border-top: 1px solid var(--primary-color);
          border-bottom: 1px solid var(--primary-color);
        }

        .main-container vaadin-split-layout .left-side-container .filters-container.filters-container-inline {
          display: flex;
          padding: 10px;
        }

        .main-container vaadin-split-layout .left-side-container .filters-container.filters-container-inline .filter-container {
          flex: 1;
          margin: 0 5px;
        }

        .main-container vaadin-split-layout .left-side-container .filters-container .filter-container span {
          font-weight: bold;
          color: var(--primary-color);
        }

        .main-container vaadin-split-layout .left-side-container .filters-container .filter-container paper-input,
        .main-container vaadin-split-layout .left-side-container .filters-container .filter-container paper-checkbox,
        .main-container vaadin-split-layout .left-side-container .filters-container .filter-container casper-select,
        .main-container vaadin-split-layout .left-side-container .filters-container .filter-container casper-date-picker {
          width: 100%;
        }

        .main-container vaadin-split-layout .left-side-container .filters-container .filter-container paper-checkbox {
          margin-top: 25px;
        }

        /* Vaadin-grid */
        .main-container vaadin-split-layout .left-side-container .grid-no-items {
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          font-size: 18px;
          font-weight: bold;
          position: absolute;
          text-align: center;
          align-items: center;
          flex-direction: column;
          justify-content: center;
          color: var(--status-gray);
          background: rgba(0, 0, 0, 0.1);
        }

        .main-container vaadin-split-layout .left-side-container .grid-no-items casper-icon {
          width: 100px;
          height: 100px;
          margin-bottom: 25px;
          --casper-icon-fill-color: var(--status-gray);
        }

        .main-container vaadin-split-layout .left-side-container #spinner {
          width: 75px;
          height: 75px;
          position: absolute;
          pointer-events: none;
          top: calc(50% - 32.5px);
          left: calc(50% - 32.5px);
          --paper-spinner-stroke-width: 8px;
          --paper-spinner-layer-1-color: var(--primary-color);
          --paper-spinner-layer-2-color: var(--primary-color);
          --paper-spinner-layer-3-color: var(--primary-color);
          --paper-spinner-layer-4-color: var(--primary-color);
        }

        .main-container vaadin-split-layout .left-side-container #multi-selection-container {
          height: 0;
          flex-shrink: 0;
          overflow: hidden;
          transition: height 100ms linear;
        }

        .main-container vaadin-split-layout .left-side-container #multi-selection-container .grid-multiple-selection {
          display: flex;
          overflow: hidden;
          border-radius: 5px;
          padding: 10px;
          align-items: center;
          background-color: #1A39601A;
          justify-content: space-between;
          transition: height 100ms linear;
        }

        .main-container vaadin-split-layout .left-side-container #multi-selection-container .grid-multiple-selection .grid-multiple-selection-label {
          font-size: 0.75em;
          color: var(--primary-color);
        }

        .main-container vaadin-split-layout .left-side-container #multi-selection-container .grid-multiple-selection .grid-multiple-selection-icons {
          display: flex;
          flex-wrap: wrap;
          margin: -10px 0 0 0;
        }

        .main-container vaadin-split-layout .left-side-container .grid-container {
          min-height: 100px;
          flex-grow: 1;
          display: flex;
          position: relative;
          flex-direction: column;
        }

        .main-container vaadin-split-layout .left-side-container .grid-container vaadin-grid {
          overflow: hidden;
          user-select: none;
          border-radius: 5px;
        }

        .main-container vaadin-split-layout .left-side-container .grid-container vaadin-grid .context-menu-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: var(--display-actions-on-hover);
          --casper-icon-fill-color: var(--primary-color);
        }

        .main-container vaadin-split-layout .left-side-container .grid-container vaadin-grid .context-menu-icon:hover {
          cursor: pointer;
          background-color: var(--primary-color);
          --casper-icon-fill-color: white;
        }

        .main-container vaadin-split-layout .right-side-container .epaper-container {
          width: 100%;
          height: 100%;
        }
      </style>

      <slot name="grid-custom-styles"></slot>

      <div class="main-container">
        <vaadin-split-layout id="splitLayout">
          <div class="left-side-container" style="[[__leftSideStyling()]]">
            <div class="header-container">
              <!--Casper-moac-menu-->
              <slot name="menu"></slot>
              <div class="generic-filter-container">
                <!--Generic Filter input-->
                <input placeholder="[[filterInputPlaceholder]]" id="filterInput" />
                <casper-icon icon="fa-regular:search"></casper-icon>

                <!--Show/hide the active filters-->
                <template is="dom-if" if="[[__hasFilters]]">
                  <paper-button id="displayAllFilters" on-click="__toggleDisplayAllFilters">
                    <span>Ver todos os filtros</span>
                    <casper-icon icon="fa-regular:angle-down"></casper-icon>
                  </paper-button>
                </template>
              </div>

              <!--Active filters-->
              <div class="active-filters">
                <div class="header">
                  <div class="header-title">
                    <template is="dom-if" if="[[__staleDataset]]">
                      <casper-icon
                        on-click="refreshItems"
                        icon="fa-regular:sync"
                        tooltip="Os dados poderão estar desactualizados. Clique aqui para recarreegar a grelha">
                      </casper-icon>
                    </template>
                    <strong>Filtros ativos:</strong>
                  </div>

                  <template is="dom-if" if="[[!hideNumberResults]]">
                    [[__numberOfResults]]
                  </template>
                </div>
                <div class="active-filters-list" id="activeFilters"></div>
              </div>
            </div>

            <div hidden$="[[!__displayAllFilters]]">
              <div class$="[[__filtersContainerClassName()]]">
                <template is="dom-repeat" items="[[__filters]]">
                  <div class="filter-container">
                    <span>[[item.filter.label]]:</span>
                    <!--Casper-Select filter-->
                    <template is="dom-if" if="[[__isFilterCasperSelect(item.filter.type)]]">
                      <casper-select
                        data-filter$="[[item.filterKey]]"
                        list-width="20vw"
                        list-height="50vh"
                        value="{{item.filter.value}}"
                        items="[[item.filter.inputOptions.items]]"
                        label="[[item.filter.inputOptions.label]]"
                        template="[[item.filter.inputOptions.template]]"
                        disable-clear$="[[item.filter.inputOptions.disableClear]]"
                        multi-selection$="[[item.filter.inputOptions.multiSelection]]"
                        lazy-load-resource="[[item.filter.inputOptions.lazyLoadResource]]"
                        lazy-load-callback="[[item.filter.inputOptions.lazyLoadCallback]]"
                        lazy-load-filter-fields="[[item.filter.inputOptions.lazyLoadFilterFields]]">
                      </casper-select>
                    </template>

                    <!--Paper-Input filter-->
                    <template is="dom-if" if="[[__isFilterPaperInput(item.filter.type)]]">
                      <paper-input
                        data-filter$="[[item.filterKey]]"
                        value="{{item.filter.value}}"
                        label="[[item.filter.inputOptions.label]]">
                      </paper-input>
                    </template>

                    <!--Casper-Date-Picker filter-->
                    <template is="dom-if" if="[[__isFilterCasperDatePicker(item.filter.type)]]">
                      <casper-date-picker
                        data-filter$="[[item.filterKey]]"
                        value="{{item.filter.value}}"
                        input-placeholder="[[item.filter.inputOptions.label]]">
                      </casper-date-picker>
                    </template>

                    <!--Paper-Checkbox Filter-->
                    <template is="dom-if" if="[[__isFilterPaperCheckbox(item.filter.type)]]">
                      <paper-checkbox
                        data-filter$="[[item.filterKey]]"
                        checked="{{item.filter.value}}">
                        [[item.filter.inputOptions.label]]
                      </paper-checkbox>
                    </template>
                  </div>
                </template>
              </div>
            </div>

            <slot name="left"></slot>
            <div id="multi-selection-container">
              <div class="grid-multiple-selection">
                <div class="grid-multiple-selection-label">
                  Seleção múltipla:&nbsp;<strong>[[__selectedItems.length]]&nbsp;[[multiSelectionLabel]]</strong>
                </div>
                <div class="grid-multiple-selection-icons">
                  <slot name="multi-selection"></slot>
                </div>
              </div>
            </div>

            <!--Vaadin grid container-->
            <div class="grid-container">
              <vaadin-grid
                id="grid"
                class="moac"
                items="[[__filteredItems]]"
                active-item="{{activeItem}}"
                selected-items="{{__selectedItems}}"
                item-id-path="[[idInternalProperty]]">

                <slot name="grid-before"></slot>

                <template is="dom-if" if="[[!disableSelection]]">
                  <vaadin-grid-selection-column width="40px" flex-grow="0" frozen$="[[freezeSelectionColumn]]"></vaadin-grid-selection-column>
                </template>

                <slot name="grid"></slot>

                <!--Context Menu-->
                <vaadin-grid-column flex-grow="0" width="40px" text-align="center">
                  <template is="dom-if" if="[[__displayContextMenu]]">
                    <template>
                      <casper-icon class="context-menu-icon" on-click="__openContextMenu" icon="fa-regular:angle-down"></casper-icon>
                    </template>
                  </template>
                </vaadin-grid-column>
              </vaadin-grid>

              <!--No items placeholder-->
              <template is="dom-if" if="[[__hasNoItems(__filteredItems, loading)]]">
                <div class="grid-no-items">
                  <casper-icon icon="[[noItemsIcon]]"></casper-icon>
                  [[noItemsText]]
                </div>
              </template>

              <!--Loading paper-spinner-->
              <paper-spinner id="spinner" active="[[loading]]"></paper-spinner>
            </div>
          </div>

          <div class="right-side-container" style="[[__rightSideStyling()]]">
            <!--Epaper-->
            <template is="dom-if" if="[[__displayEpaper]]">
              <div class="epaper-container">
                <slot name="right"></slot>
                <casper-epaper
                  app="[[app]]"
                  zoom="[[epaperZoom]]"
                  sticky-maximum-height="[[epaperStickyMaximumHeight]]"
                  disable-sticky-animation="[[epaperDisableStickyAnimation]]">
                  <slot name="casper-epaper-tabs" slot="casper-epaper-tabs"></slot>
                  <slot name="casper-epaper-actions" slot="casper-epaper-actions"></slot>
                  <slot name="casper-epaper-context-menu" slot="casper-epaper-context-menu"></slot>
                  <slot name="casper-epaper-line-menu" slot="casper-epaper-line-menu"></slot>
                </casper-epaper>
              </div>
            </template>
          </div>
        </vaadin-split-layout>

        <!--Sidebar-->
        <template is="dom-if" if="[[__displaySidebar]]">
          <slot name="sidebar"></slot>
        </template>
      </div>

      <slot name="context-menu"></slot>
    `;
  }

  ready () {
    super.ready();

    this.grid             = this.$.grid;
    this.gridScroller     = this.$.grid.$.outerscroller;
    this.__displayEpaper  = [CasperMoacTypes.GRID_EPAPER_SIDEBAR, CasperMoacTypes.GRID_EPAPER].includes(this.moacType);
    this.__displaySidebar = [CasperMoacTypes.GRID_EPAPER_SIDEBAR, CasperMoacTypes.GRID_SIDEBAR].includes(this.moacType);

    if (this.__displayEpaper) {
      // Save the epaper in a notifiable property so it can be used outside.
      afterNextRender(this, () => this.epaper = this.shadowRoot.querySelector('casper-epaper'));
    }

    // Either provide the Vaadin Grid the lazy load function or manually trigger the filter function.
    this.lazyLoad
      ? this.__initializeLazyLoad()
      : afterNextRender(this, () => this.__filterItems());

    this.addEventListener('mousemove', event => this.app.tooltip.mouseMoveToolip(event));
    this.__bindSorterEvents();
    this.__bindSearchInputEvents();
    this.__bindContextMenuEvents();
    this.__monkeyPatchVaadinElements();
    this.__stampGridCustomStylesTemplate();
  }
  /**
   * Adds manually a new item / list of items to the beginning of the existing ones ignoring
   * the currently applied filters.
   *
   * @param {Object | Array} itemsToAdd The item / list of items to be added to the current dataset.
   * @param {String | Number} afterItemId The item's identifier which we'll the append the new item(s) after.
   */
  addItem (itemsToAdd, afterItemId) {
    // Cast the object as an array to avoid ternaries when appending the new item(s).
    if (itemsToAdd.constructor.name === 'Object') itemsToAdd = [itemsToAdd];

    const rootItems = itemsToAdd.filter(itemToAdd => !this.__valueIsNotEmpty(itemToAdd[this.parentExternalProperty]));
    const childItems = itemsToAdd.filter(itemToAdd => this.__valueIsNotEmpty(itemToAdd[this.parentExternalProperty]));

    let filteredItems = this.__filteredItems;
    filteredItems = this.__addRootItems(rootItems, filteredItems, afterItemId);
    filteredItems = this.__addChildItems(childItems, filteredItems);
    this.__filteredItems = filteredItems;

    this.forceGridRedraw();
    this.__staleDataset = true;

    if (rootItems.length > 0) this.activeItem = rootItems[0];

    afterNextRender(this, () => this.__scrollToItemIfNotVisible(this.activeItem[this.idInternalProperty]));
  }

  /**
   * Updates manually the item / list of items provided by its id propery.
   *
   * @param {Object | Array} itemsToUpdate The item / list of items that will be updated.
   */
  updateItem (itemsToUpdate) {
    // Cast the object as an array to avoid ternaries when appending the new item(s).
    if (itemsToUpdate.constructor.name === 'Object') itemsToUpdate = [itemsToUpdate];

    const filteredItems = [...this.__filteredItems];
    const selectedItems = [...this.__selectedItems];

    itemsToUpdate.forEach(itemToUpdate => {
      const updateItemCallback = (item, itemIndex, items) => {
        if (this.__compareItems(itemToUpdate, item, true)) {
          // Do not simply overwrite the object to avoid losing important internal properties set by this component.
          Object.keys(itemToUpdate).forEach(itemToUpdateProperty => {
            items[itemIndex][itemToUpdateProperty] = itemToUpdate[itemToUpdateProperty];
          });
        }
      };

      filteredItems.forEach(updateItemCallback);
      selectedItems.forEach(updateItemCallback);
    });

    this.__filteredItems = filteredItems;
    this.__selectedItems = selectedItems;

    this.forceGridRedraw();
    this.__staleDataset = true;
    this.activeItem = itemsToUpdate[0];

    afterNextRender(this, () => this.__scrollToItemIfNotVisible(this.activeItem[this.idInternalProperty]));
  }

  /**
   * Deletes manually the item provided by its id propery.
   *
   * @param {String | Number | Array} itemsToRemove The identifier to find the item that will be removed.
   */
  removeItem (itemsToRemove) {
    // Convert the parameter to an array of strings so it's easier afterwards.
    itemsToRemove.constructor.name !== 'Array'
      ? itemsToRemove = [String(itemsToRemove)]
      : itemsToRemove = itemsToRemove.map(itemToRemove => String(itemToRemove));

    const firstItemToRemoveIndex = Math.min(...itemsToRemove.map(itemToRemove => this.__findItemIndexById(itemToRemove, true)));
    this.__scrollToItemIfNotVisible(firstItemToRemoveIndex, true);

    afterNextRender(this, () => {
      const rows = this.$.grid.shadowRoot.querySelectorAll('table tbody tr');
      const blinkingRows = Array.from(rows).filter(row => itemsToRemove.includes(String(row._item[this.idExternalProperty])));

      // Initiate the blinking animation for the rows.
      blinkingRows.forEach(blinkingRow => {
        blinkingRow.setAttribute('blink', true);
        [...blinkingRow.children].forEach(cell => {
          cell.style.backgroundColor = 'var(--casper-moac-blinking-item-background-color)';
        });
      });

      // After one second, remove all the blinking rows.
      setTimeout(() => {
        blinkingRows.forEach(blinkingRow => {
          blinkingRow.removeAttribute('blink');
          [...blinkingRow.children].forEach(cell => { cell.style.backgroundColor = ''; });
        });

        this.__staleDataset = true;
        this.__filteredItems = this.__filteredItems.filter(item => !itemsToRemove.includes(String(item[this.idExternalProperty])));
        this.__selectedItems = this.__selectedItems.filter(item => !itemsToRemove.includes(String(item[this.idExternalProperty])));
        this.__filteredItems.length === 0
          ? this.activeItem = null
          : this.activeItem = this.__filteredItems[Math.max(0, firstItemToRemoveIndex - 1)];
      }, 1000);
    });
  }

  /**
   * This function is used to see if a physical row is totally into view or not.
   *
   * @param {Element} row The row's element object.
   * @param {Number} offset The offset in pixels to apply to the calculations.
   */
  isRowIntoView (row, offset = 0) {
    const rowBoundingClientRect = row.getBoundingClientRect();
    const gridBoundingClientRect = this.grid.getBoundingClientRect();
    const gridHeaderHeight = this.grid.shadowRoot.querySelector('thead').getBoundingClientRect().height;

    return parseInt(rowBoundingClientRect.top) >= parseInt(gridBoundingClientRect.top + gridHeaderHeight - offset)
      && parseInt(rowBoundingClientRect.bottom) <= parseInt(gridBoundingClientRect.bottom + offset);
  }

  /**
   * This method forces the vaadin-grid to redraw all its rows.
   */
  forceGridRedraw () {
    this.grid.clearCache();
    this.__paintGridRows();
  }

  /**
   * This method will restamp the provided casper-selects used in the filters.
   */
  restampSelectTemplate (filters) {
    if (!filters) return;

    let selectElements;
    if (filters.constructor.name === 'String') {
      // Select a single casper-select element.
      selectElements = [this.shadowRoot.querySelector(`casper-select[data-filter="${filters}"]`)];
    } else if (filters.constructor.name === 'Array') {
      // Build a selector that contains all the casper-selects.
      const selectorQuery = filters.map(filter => `casper-select[data-filter="${filter}"]`);

      selectElements = this.shadowRoot.querySelectorAll(selectorQuery.join(','));
    }

    selectElements.forEach(selectElement => {
      if (selectElement) selectElement.restampTemplate();
    });
  }

  /**
   * This method changes the local items and offer the possibility to activate one specific item after that.
   *
   * @param {Array} items The list of new items.
   * @param {String | Number} activateItemId The item's identifier that will be activated after resetting the new items.
   */
  setItems (items, activateItemId) {
    this.__activateItemId = activateItemId;
    this.items = items;
  }

  /**
   * This method appends new items who are at the root level.
   *
   * @param {Object | Array} itemsToAdd The item / list of items to be added to the current dataset.
   * @param {String | Number} afterItemId The item's identifier which we'll the append the new item(s) after.
   * @param {Array} filteredItems The currently filtered items.
   */
  __addRootItems (itemsToAdd, filteredItems, afterItemId) {
    if (itemsToAdd.length === 0) return filteredItems;

    if (!afterItemId) {
      return [...itemsToAdd, ...filteredItems];
    } else {
      const insertAfterIndex = this.__findItemIndexById(afterItemId, true);

      return [
        ...filteredItems.slice(0, insertAfterIndex + 1),
        ...itemsToAdd,
        ...filteredItems.slice(insertAfterIndex + 1)
      ];
    }
  }

  /**
   * This method appends new items who have parents if they are currently expanded.
   *
   * @param {Object | Array} itemsToAdd The item / list of items to be added to the current dataset.
   * @param {Array} filteredItems The currently filtered items.
   */
  __addChildItems (itemsToAdd, filteredItems) {
    const expandedItems = this.expandedItems.map(expandedItem => String(expandedItem[this.idExternalProperty]));
    if (itemsToAdd.lengh === 0 || expandedItems.length === 0) return filteredItems;

    itemsToAdd.forEach(itemToAdd => {
      // Convert the parent property to an array.
      let itemToAddParents = itemToAdd[this.parentExternalProperty];
      if (itemToAdd[this.parentExternalProperty].constructor.name !== 'Array') {
        itemToAddParents = [itemToAdd[this.parentExternalProperty]];
      }

      itemToAddParents.forEach(itemToAddParent => {
        // Only append the child items if their parents are currently expanded.
        if (!expandedItems.includes(String(itemToAddParent))) return;

        itemToAdd[this.parentInternalProperty] = itemToAddParent;
        itemToAdd[this.rowBackgroundColorInternalProperty] = 'var(--casper-moac-child-item-background-color)';

        const itemToAddParentIndex = this.__findItemIndexById(itemToAddParent, true, filteredItems);

        filteredItems = [
          ...filteredItems.slice(0, itemToAddParentIndex + 1),
          {...itemToAdd},
          ...filteredItems.slice(itemToAddParentIndex + 1)
        ];
      });
    });

    return filteredItems;
  }

  /**
   * Scrolls to a specific item if he's not currently visible.
   *
   * @param {Number | String} itemId The item that should be scrolled to if he's not currently visible.
   */
  __scrollToItemIfNotVisible (itemId, useExternalProperty = false) {
    const rows = this.grid.shadowRoot.querySelectorAll('table tbody tr');

    let isRowIntoView = false;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      if (this.__compareItemWithId(rows[rowIndex]._item, itemId, useExternalProperty)) {
        // Scroll to the item if it's not into view taking into account the grid's internal items.
        isRowIntoView = this.isRowIntoView(rows[rowIndex]);
        break;
      }
    }

    if (!isRowIntoView) {
      this.grid.scrollToIndex(this.__findItemIndexById(itemId, useExternalProperty));
    }
  }

  __isFilterPaperInput (itemType) { return itemType === CasperMoacFilterTypes.PAPER_INPUT; }
  __isFilterPaperCheckbox (itemType) { return itemType === CasperMoacFilterTypes.PAPER_CHECKBOX; }
  __isFilterCasperSelect (itemType) { return itemType === CasperMoacFilterTypes.CASPER_SELECT; }
  __isFilterCasperDatePicker (itemType) { return itemType === CasperMoacFilterTypes.CASPER_DATE_PICKER; }

  /**
   * This method checks if the named slot "grid-custom-styles" has a template assigned to it. If it has,
   * it will stamp it in the actual DOM.
   */
  __stampGridCustomStylesTemplate () {
    afterNextRender(this, () => {
      const customStylesSlot = this.shadowRoot.querySelector('slot[name="grid-custom-styles"]');
      if (customStylesSlot.assignedElements().length > 0) {
        const template = customStylesSlot.assignedElements().shift();
        const templateClass = templatize(template);
        this.shadowRoot.appendChild(new templateClass().root);
      }
    });
  }

  /**
   * As the name suggests, this method applies some monkey-patches to the vaadin elements. Firstly
   * it adds a scroll event listener to paint the active row due to the grid's constant re-usage of rows.
   * It also hides the vaadin-split-layout handler if there is no epaper and replaces the existing
   * vaadin-checkbox header since its current implementation is faulty.
   */
  __monkeyPatchVaadinElements () {
    this.gridScroller.addEventListener('scroll', () => {
      this.__paintGridRows();

      this.__contextMenu.close();
    });

    this.grid.addEventListener('keydown', event => this.__handleGridKeyDownEvents(event));
    this.grid.addEventListener('casper-moac-tree-toggle-expanded-changed', event => this.__handleGridTreeToggleEvents(event));

    if (!this.__displayEpaper) {
      this.$.splitLayout.$.splitter.style.display = 'none';
    }

    if (!this.disableSelection) {
      afterNextRender(this, () => {
        this.grid.shadowRoot.querySelectorAll('table thead th').forEach(header => {
          const selectAllCheckbox = header.querySelector('slot').assignedElements().shift().firstElementChild;
          if (selectAllCheckbox && selectAllCheckbox.nodeName.toLowerCase() === 'vaadin-checkbox') {
           // Create a vaadin-checkbox to replace the default one which has bugs.
            this.__selectAllCheckbox = document.createElement('vaadin-checkbox');
            this.__selectAllCheckbox.addEventListener('checked-changed', event => {
              // Lock the vaadin-checkbox event handler to avoid infinite loops.
              if (this.__selectAllCheckboxLock) return;

              this.__selectedItems = !event.detail.value ? [] : [...this.__selectableItems()];
            });

            selectAllCheckbox.parentElement.appendChild(this.__selectAllCheckbox);
            selectAllCheckbox.remove();
          }
        });
      });
    }
  }

  /**
   * Bind event listeners to the generic search input.
   */
  __bindSearchInputEvents () {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has(this.freeFilterUrlParameterName)) {
      afterNextRender(this, () => {
        this.$.filterInput.value = searchParams.get(this.freeFilterUrlParameterName);
        this.$.filterInput.style.border = '1px solid var(--primary-color)';
        this.$.filterInput.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.1)';
      });
    }

    this.$.filterInput.addEventListener('keydown', event => this.__freeFilterChanged(event));
    this.$.filterInput.addEventListener('focus', () => {
      this.$.filterInput.style.border = '1px solid var(--primary-color)';
      this.$.filterInput.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.1)';
    });

    this.$.filterInput.addEventListener('blur', () => {
      if (!this.$.filterInput.value.trim()) {
        this.$.filterInput.style.border = '';
        this.$.filterInput.style.backgroundColor = '';
      }
    });
  }

  /**
   * Bind event listeners to all the elements used to filter the dataset.
   */
  __bindFiltersEvents () {
    const filterChangedCallback = event => {
      const filterComponent = event.composedPath().shift();

      // This validation makes sure we're not firing requests for already fetched filters during the initialization process.
      if (this.__skipValueChangedEvents[filterComponent.dataset.filter] === this.filters[filterComponent.dataset.filter].value) {
        delete this.__skipValueChangedEvents[filterComponent.dataset.filter];
        return;
      }

      // Dispatch a custom event to inform the page using casper-moac that the filters have changed.
      this.dispatchEvent(new CustomEvent('filters-changed', {
        bubbles: true,
        composed: true,
        detail: { filter: filterComponent.dataset.filter }
      }));

      // Force the re-fetch of items if one the filter changes.
      if (this.lazyLoad) {
        if (this.beforeJsonApiRequest) this.beforeJsonApiRequest.call(this.page || {});

        this.refreshItems();
      }

      this.__updateUrlWithCurrentFilters();
      this.__renderActiveFilters();
    };

    afterNextRender(this, () => {
      this.filterComponents = Array.from(this.shadowRoot.querySelectorAll(`
        paper-input[data-filter],
        paper-checkbox[data-filter],
        casper-select[data-filter],
        casper-date-picker[data-filter]
      `));

      this.filterComponents.forEach(filter => {
        if (filter[this.attachedEventListenersInternalProperty]) return;

        filter.nodeName.toLowerCase() !== 'paper-checkbox'
          ? filter.addEventListener('value-changed', filterChangedCallback)
          : filter.addEventListener('checked-changed', filterChangedCallback);

        // This is used to clean possible empty filters due to the casper-select dropdown being open at the time.
        if (filter.nodeName.toLowerCase() === 'casper-select') {
          filter.addEventListener('opened-changed', event => {
            if (!event.target.opened) this.__renderActiveFilters();
          });
        }

        filter[this.attachedEventListenersInternalProperty] = true;
      });
    });
  }

  /**
   * Bind event listeners to the context menu component if there is any.
   */
  __bindContextMenuEvents () {
    // Check if there is a casper-context-menu.
    this.__contextMenu = Array.from(this.children).find(child => child.getAttribute('slot') === 'context-menu');
    this.__displayContextMenu = !!this.__contextMenu;

    if (!this.__contextMenu) return;

    this.__contextMenu.noOverlap = true;
    this.__contextMenu.dynamicAlign = true;
    this.__contextMenu.verticalAlign = 'auto';
    this.__contextMenu.horizontalAlign = 'auto';

    // Hide the context menu when one of its items is clicked.
    this.__contextMenu.addEventListener('click', event => {
      if (this.__eventPathContainsNode(event, 'casper-menu-item')) {
        this.__contextMenu.positionTarget.removeAttribute('style');
      }
    });

    this.__contextMenu.addEventListener('opened-changed', event => {
      if (!event.detail.value) {
        this.shadowRoot.querySelectorAll('.context-menu-icon').forEach(contextMenuIcon => {
          contextMenuIcon.removeAttribute('style');
        });
      }
    });
  }

  /**
   * Bind event listeners for when the user presses down the Enter or the down / up arrow keys.
   *
   * @param {Object} event The event's object.
   */
  __handleGridKeyDownEvents (event) {
    const keyCode = event.code;

    if (this.__filteredItems.length === 0 || !['Enter', 'ArrowUp', 'ArrowDown'].includes(keyCode)) return;

    // When there are no active items, select the first one.
    if (!this.__activeItem) {
      this.__activeItem = this.__filteredItems[0];
    } else {
      // Find the index of the current active item.
      const activeItemIndex = this.__findItemIndexById(this.__activeItem[this.idInternalProperty]);

      if (keyCode === 'ArrowUp' && activeItemIndex > 0) {
        this.__activeItem = this.__filteredItems[activeItemIndex - 1];
      }

      if (keyCode === 'ArrowDown' && activeItemIndex + 1 < this.__filteredItems.length) {
        this.__activeItem = this.__filteredItems[activeItemIndex + 1];
      }

      if (keyCode === 'Enter' && !this.disableSelection && !this.__activeItem[this.disableSelectionInternalProperty]) {
        !this.__selectedItems.find(selectedItem => this.__compareItems(selectedItem, this.__activeItem))
          ? this.$.grid.selectItem(this.__activeItem)
          : this.$.grid.deselectItem(this.__activeItem);

        // The remaining function code only concerns the arrow navigation.
        return;
      }
    }

    this.__paintGridRows();

    // If the active item changed, debounce the active item change.
    if (!this.__scheduleActiveItem || !this.__compareItems(this.__activeItem, this.__scheduleActiveItem)) {
      // This property is used to avoid delaying infinitely activating the same item which is caused when the user
      // maintains the up / down arrows after reaching the first / last result in the table.
      this.__scheduleActiveItem = {...this.__activeItem};

      // Only debounce when the event is repeated, meaning the user keeps the key pressed or if the activeItemDebounce was specifically set.
      if (event.repeat || this.activeItemDebounce) {
        this.__debounce('__activeItemDebouncer', () => {
          this.activeItem = this.__scheduleActiveItem;
        }, this.activeItemDebounce || 300);
      } else {
        this.__cancelDebounce('__activeItemDebouncer');
        this.activeItem = this.__scheduleActiveItem;
      }
    }
  }

  /**
   * This method handles the click on the casper-moac-tree-toggle components and expands / collapses the row.
   *
   * @param {Object} event The event's object.
   */
  async __handleGridTreeToggleEvents (event) {
    const parentItem = this.activeItem = this.grid.getEventContext(event).item;

    const treeToggleComponent = event.composedPath().shift();
    treeToggleComponent.disabled = true;

    if (!event.detail.expanded) {
      this.expandedItems = [...this.expandedItems.filter(expandedItem => !this.__compareItems(expandedItem, parentItem, true))];

      // Remove the row color from the parent.
      delete parentItem[this.rowBackgroundColorInternalProperty];

      // If the toggle is not expanded remove the items that were previously expanded.
      this.__filteredItems = this.__filteredItems.filter(item => String(item[this.parentInternalProperty]) !== String(parentItem[this.idExternalProperty]));
    } else {
      this.expandedItems = [...this.expandedItems, parentItem];
      const parentItemIndex = this.__findItemIndexById(parentItem[this.idInternalProperty]);

      // Either query the database or use the local property depending on the current type of grid.
      let parentItemChildren = !this.lazyLoad
        ? parentItem[this.childrenExternalProperty]
        : await this.__fetchChildrenResourceItems(parentItem);

      // Safeguard for an empty response from the server or an empty local property.
      parentItemChildren = Array.isArray(parentItemChildren) ? parentItemChildren : [];
      parentItemChildren.forEach(child => {
        child[this.parentInternalProperty] = parentItem[this.idExternalProperty];
        child[this.rowBackgroundColorInternalProperty] = 'var(--casper-moac-child-item-background-color)';
      });

      parentItem[this.rowBackgroundColorInternalProperty] = 'var(--casper-moac-parent-item-background-color)';

      this.__filteredItems = [
        ...this.__filteredItems.slice(0, parentItemIndex + 1),
        ...parentItemChildren,
        ...this.__filteredItems.slice(parentItemIndex + 1)
      ];
    }

    this.__paintGridRows();
    treeToggleComponent.disabled = false;
  }

  /**
   * Observer that gets fired when the user displays / hides all the filters by pressing the button below the search
   * input. This method change the button's text and rotate the icon accordingly.
   */
  __displayAllFiltersChanged () {
    if (!this.__hasFilters) return;

    afterNextRender(this, () => {
      this.__displayAllFiltersButton = this.__displayAllFiltersButton || this.shadowRoot.querySelector('#displayAllFilters');
      this.__displayAllFiltersButtonSpan = this.__displayAllFiltersButtonSpan || this.__displayAllFiltersButton.querySelector('span');
      this.__displayAllFiltersButtonIcon = this.__displayAllFiltersButtonIcon || this.__displayAllFiltersButton.querySelector('casper-icon');

      if (this.__displayAllFilters) {
        // This fix is required for smaller screens where the vaadin-grid has no height with the filters visible.
        this.$.grid.style.flex = '';

        this.__displayAllFiltersButtonIcon.setAttribute('rotate', true);
        this.__displayAllFiltersButtonSpan.innerHTML = 'Esconder todos os filtros';
      } else {
        // This fix is required for smaller screens where the vaadin-grid has no height with the filters visible.
        this.$.grid.style.flex = 1;

        this.__displayAllFiltersButtonIcon.removeAttribute('rotate');
        this.__displayAllFiltersButtonSpan.innerHTML = 'Ver todos os filtros';
      }
    });
  }

  /**
   * Debounce the items filtering after the search input's value changes.
   */
  __freeFilterChanged (event) {
    // If the user is in the search input and clicks the ArrowDown key, focus the currently active row.
    if (event.code === 'ArrowDown') return this.__focusActiveRow();

    this.__debounce('__freeFilterChangedDebouncer', () => {
      // Do not re-filter the items if the current value matches the last one.
      if (this.$.filterInput.value.trim() === this.__lastFreeFilter) return;
      this.__lastFreeFilter = this.$.filterInput.value.trim();

      this.__updateUrlWithCurrentFilters();
      !this.lazyLoad
        ? this.__filterItems()
        : this.__filterLazyLoadItems();

    });
  }

  /**
   * Observer that fires after the filters object change from the outside which
   * will cause a re-render of the active filters.
   *
   * @param {Object} filters The filters that are currently being applied to the dataset.
   */
  __filtersChanged (filters) {
    this.__hasFilters = !!filters && Object.keys(filters).length > 0;
    this.__bindFiltersEvents();
    this.__buildHistoryStateFilters();

    const searchParams = new URLSearchParams(window.location.search);
    // Transform the filters object into an array to use in a dom-repeat.
    this.__filters = Object.keys(filters).map(filterKey => {
      const filterSettings = {
        filterKey: filterKey,
        filter: this.filters[filterKey]
      };

      // Override the filter's default value if it's present in the URL.
      if (searchParams.has(filterKey)) {
        filterSettings.filter.value = searchParams.get(filterKey);
      }

      if (this.__valueIsNotEmpty(filterSettings.filter.value)) {
        this.__skipValueChangedEvents[filterKey] = filterSettings.filter.value;
      }

      return filterSettings;
    });

    // Since we already have all the values ready, filter the items.
    !this.lazyLoad
      ? this.__filterItems()
      : this.__filterLazyLoadItems();

    this.__renderActiveFilters();
  }

  /**
   * Observer that gets called when the vaadin-grid activeItem changes.
   *
   * @param {Object} newActiveItem The new vaadin-grid activeItem.
   * @param {Object} previousActiveItem The previous vaadin-grid activeItem.
   */
  __activeItemChanged (newActiveItem, previousActiveItem) {
    if (!newActiveItem && previousActiveItem && this.forceActiveItem && this.__filteredItems && this.__filteredItems.length > 0) {
      this.activeItem = previousActiveItem;
    }

    // Clean the epaper when there is no active item and the developer didn't disabled this behavior.
    if (!this.activeItem && this.epaper && !this.disableResetEpaper) {
      this.epaper.openBlankPage();
    }

    // This is used to avoid conflicts between arrow and click events.
    this.__scheduleActiveItem = this.__activeItem = {...this.activeItem};
    this.__paintGridRows();
  }

  /**
   * Observer that fires as soon as the items change. This will invoke the internal __filterItems method to display
   * the new items on the vaadin-grid.
   */
  __itemsChanged () {
    this.__filterItems();
  }

  /**
   * Observer that fires when the vaadin-grid selected items change.
   */
  __selectedItemsChanged () {
    this.selectedItems = [...this.__selectedItems];
    this.__selectedItems && this.__selectedItems.length > 0
      ? this.$['multi-selection-container'].style.height = `${this.$['multi-selection-container'].firstElementChild.scrollHeight}px`
      : this.$['multi-selection-container'].style.height = '';

    if (!this.__selectAllCheckbox) return;

    const selectableItems = this.__selectableItems();

    // Lock the vaadin-checkbox event handler to avoid infinite loops.
    this.__selectAllCheckboxLock = true;
    this.__selectAllCheckbox.checked = this.__selectedItems.length > 0 && selectableItems.length === this.__selectedItems.length;
    this.__selectAllCheckbox.indeterminate = this.__selectedItems.length > 0 && selectableItems.length !== this.__selectedItems.length;
    this.__selectAllCheckboxLock = false;
  }

  /**
   * This method filters the existing items with the search input's value taking into account the list of attributes
   * provided for that effect. If none were specified, every single attribute will be used for comparison purposes.
   */
  __filterItems () {
    this.activeItem = null;
    this.__selectedItems = [];

    // Use spread operator to avoid messing with the original dataset by sorting.
    let originalItems = [...(this.items || [])]
    let filteredItems = [...(this.items || [])];

    if (this.$.filterInput.value.trim() && originalItems.length > 0) {
      // Either retrieve the list of filter attributes from the properties or from the first item's existing keys.
      let filterAttributes = this.resourceFilterAttributes;
      if (!filterAttributes) filterAttributes = Object.keys(originalItems[0]);

      if (filterAttributes) {
        const filterTerm = this.__normalizeVariable(this.$.filterInput.value);

        filteredItems = originalItems.filter(item => filterAttributes.some(filterAttribute => {
          if (filterAttribute.constructor.name === 'Object') {
            switch (filterAttribute.operator) {
              case CasperMoacOperators.EXACT_MATCH: return this.__normalizeVariable(item[filterAttribute.field]) === filterTerm;
              case CasperMoacOperators.CONTAINS: return this.__normalizeVariable(item[filterAttribute.field]).includes(filterTerm);
              case CasperMoacOperators.ENDS_WITH: return this.__normalizeVariable(item[filterAttribute.field]).endsWith(filterTerm);
              case CasperMoacOperators.STARTS_WITH: return this.__normalizeVariable(item[filterAttribute.field]).startsWith(filterTerm);
            }
          }

          return this.__normalizeVariable(item[filterAttribute]).includes(filterTerm);
        }));
      }
    }

    this.__filteredItems = this.__sortItems(filteredItems);
    this.forceGridRedraw();
    this.__activateItem();
    this.__numberOfResults = filteredItems.length === originalItems.length
      ? `${filteredItems.length} ${this.multiSelectionLabel}`
      : `${filteredItems.length} de ${this.items.length} ${this.multiSelectionLabel}`;
  }

  /**
   * This method activates the item that is present in the specified index.
   */
  __activateItem () {
    let itemIndex = 0;
    if (this.__activateItemId) {
      itemIndex = this.__findItemIndexById(this.__activateItemId, true);
      this.__scrollToItemIfNotVisible(this.__activateItemId, true);
      this.__activateItemId = undefined;
    }

    this.__filteredItems && this.__filteredItems.length > itemIndex
      ? this.activeItem = this.__filteredItems[itemIndex]
      : this.activeItem = null;
  }

  /**
   * Event listener which is fired when the user clicks on a filter's value in the summary. This will try to move
   * the filter's overlay for UX purposes (casper-select) or display all the filters focusing the correct one.
   *
   * @param {Event} event The event's object.
   */
  __displayInlineFilters (event) {
    const filterKey = event.target.dataset.filter
    const filter = this.filters[filterKey];

    switch (filter.type) {
      case CasperMoacFilterTypes.CASPER_SELECT:
        const selectElement = this.shadowRoot.querySelector(`casper-select[data-filter="${filterKey}"]`);

        selectElement.opened
          ? selectElement.closeDropdown()
          : selectElement.openDropdown(this.$.activeFilters);
        break;
      case CasperMoacFilterTypes.PAPER_INPUT:
        this.__displayAllFilters = true;
        this.shadowRoot.querySelector(`paper-input[data-filter="${filterKey}"]`).focus();
        break;
      case CasperMoacFilterTypes.CASPER_DATE_PICKER:
        this.__displayAllFilters = true;
        this.shadowRoot.querySelector(`casper-date-picker[data-filter="${filterKey}"]`).open();
        break;
      case CasperMoacFilterTypes.PAPER_CHECKBOX:
        this.__displayAllFilters = true;
        this.shadowRoot.querySelector(`paper-checkbox[data-filter="${filterKey}"]`).focus();
        break;
    }
  }

  /**
   * This method is responsible for rendering the active filters summary and binding the event listeners that
   * will be reponsible for displaying the filter's input overlay when possible.
   */
  __renderActiveFilters () {
    this.__debounce('__renderActiveFiltersDebouncer', () => {
      this.$.activeFilters.innerHTML = '';

      this.__renderActiveFixedFilters();

      // Create the no active filters placeholder.
      if (!this.$.activeFilters.innerHTML) {
        const noActiveFiltersPlaceholder = document.createElement('span');
        noActiveFiltersPlaceholder.className = 'no-active-filters';
        noActiveFiltersPlaceholder.innerHTML = '(Não há filtros activos)';

        this.$.activeFilters.appendChild(noActiveFiltersPlaceholder);
      }
    });
  }

  /**
   * This method renders the current fixed filters that are being applied.
   */
  __renderActiveFixedFilters () {
    if (!this.__filters) return;

    this.__filters.forEach(filterItem => {
      // Do not hide the "shortcut" when the casper-select is currently open.
      let isFilterCurrentlyOpen = false;
      if (filterItem.filter.type === CasperMoacFilterTypes.CASPER_SELECT) {
        const selectElement = this.shadowRoot.querySelector(`casper-select[data-filter="${filterItem.filterKey}"]`);

        isFilterCurrentlyOpen = selectElement && selectElement.opened;
      }

      if (isFilterCurrentlyOpen || this.__valueIsNotEmpty(filterItem.filter.value)) {
        this.__renderActiveFilterDOM(
          filterItem.filter.label,
          this.__activeFilterValue(filterItem),
          event => this.__displayInlineFilters(event),
          filterItem.filterKey
        );
      }
    });
  }

  /**
   * This method actually creates the elements in the DOM and binds the click event listener.
   * @param {String} filterLabel The filter's label.
   * @param {String} filterValue The filter's current value.
   * @param {Function} clickEventListener The filter's click event listener.
   * @param {String} datasetKey For fixed filters, this represents the key that uniquely identifies it.
   */
  __renderActiveFilterDOM (filterLabel, filterValue, clickEventListener, datasetKey) {
    const activeFilter = document.createElement('div');
    activeFilter.className = 'active-filter';

    const activeFilterLabel = document.createTextNode(`${filterLabel}: `);
    const activeFilterValue = document.createElement('strong');
    activeFilterValue.innerHTML = filterValue;
    activeFilterValue.dataset.filter = datasetKey;
    activeFilterValue.addEventListener('click', clickEventListener);

    activeFilter.appendChild(activeFilterLabel);
    activeFilter.appendChild(activeFilterValue);
    this.$.activeFilters.appendChild(activeFilter);
  }

  /**
   * This method checks if the filter value is be empty since zeroes in some occasions
   * might be used as actual values and they should not be disregarded.
   *
   * @param {String | Number | Array | Object} value
   */
  __valueIsNotEmpty (value) {
    return value && value.constructor.name === 'Array'
      ? value.length > 0
      : ![null, undefined, false, ''].includes(value);
  }

  /**
   * Given a specific filter, this method is responsible for returning the human-readable version
   * of its current value.
   *
   * @param {Object} filterItem
   */
  __activeFilterValue (filterItem) {
    if (!this.__valueIsNotEmpty(filterItem.filter.value)) return '(Filtro Vazio)';

    switch (filterItem.filter.type) {
      case CasperMoacFilterTypes.PAPER_INPUT:
      case CasperMoacFilterTypes.CASPER_DATE_PICKER:
        return filterItem.filter.value;
      case CasperMoacFilterTypes.PAPER_CHECKBOX:
        return filterItem.filter.inputOptions.label;
      case CasperMoacFilterTypes.CASPER_SELECT:
        const casperSelect = this.shadowRoot.querySelector(`casper-select[data-filter="${filterItem.filterKey}"]`);

        if (!casperSelect || !casperSelect.items || casperSelect.items.length === 0) return '(Filtro Vazio)';

        const filterValues = !filterItem.filter.inputOptions.multiSelection
          ? [filterItem.filter.value.toString()]
          : filterItem.filter.value.split(casperSelect.multiSelectionValueSeparator);

        return casperSelect.items
          .filter(item => filterValues.includes(item[casperSelect.keyColumn].toString()))
          .map(item => item[casperSelect.itemColumn]).join(', ');
    }
  }

  /**
   * This method is invoked when the grid is either clicked or scrolled and ensures the correct active
   * row has a different background color. This is required for scroll as well since the vaadin-grid re-uses
   * its rows and having this into account, the id property is used to avoid highlighting the wrong row.
   */
  __paintGridRows () {
    afterNextRender(this, () => {
      // Loop through each grid row and paint the active one.
      this.$.grid.shadowRoot.querySelectorAll('table tbody tr').forEach(row => {
        const isRowActive = this.__activeItem && this.__compareItems(row._item, this.__activeItem);
        const isRowBackgroundColored = !!row._item[this.rowBackgroundColorInternalProperty];

        Array.from(row.children).forEach(cell => {
          if(row.hasAttribute('blink')) return;

          // Check if the row has no active animation and is either active or colored.
          if (isRowActive || isRowBackgroundColored) {
            // The active background color has priority.
            isRowActive
              ? cell.style.backgroundColor = 'var(--casper-moac-active-item-background-color)'
              : cell.style.backgroundColor = row._item[this.rowBackgroundColorInternalProperty];
          } else {
            this.disableRowStripes || row._item[this.idInternalProperty] % 2 === 0
              ? cell.style.backgroundColor = 'white'
              : cell.style.backgroundColor = 'var(--casper-moac-row-stripe-color)';
          }

          // Remove the vaadin-checkbox element if this items does not support selection.
          if (!this.disableSelection) {
            const vaadinCheckbox = cell.firstElementChild.assignedElements().shift().querySelector('vaadin-checkbox');
            if (vaadinCheckbox) {
              !row._item[this.disableSelectionInternalProperty]
                ? vaadinCheckbox.style.display = ''
                : vaadinCheckbox.style.display = 'none';
            }
          }
        });
      });
    });
  }

  /**
   * This method focuses the row that is currently active to enable the ArrowDown / ArrowUp navigation.
   */
  __focusActiveRow () {
    if (!this.activeItem) return;

    const vaadinGridTable = this.$.grid.shadowRoot.querySelector('table');
    const vaadinGridTableRows = vaadinGridTable.querySelectorAll('tbody tr');

    // This line is necessary since when clicking the ArrowDown, the grid would slightly scroll down.
    vaadinGridTable.style.overflow = 'hidden';

    const vaadinGridTableActiveRow = Array.from(vaadinGridTableRows).find(row => this.__compareItems(row._item, this.activeItem));
    if (vaadinGridTableActiveRow) {
      vaadinGridTableActiveRow.firstElementChild.focus();
      afterNextRender(this, () => { vaadinGridTable.style.overflow = ''; });
      return;
    }

    // This means that the active row is not currently visible.
    this.__scrollToItemIfNotVisible(this.activeItem);
    this.__focusActiveRow();
  }

  /**
   * In order to make searching items easier, every accented characters should be replaced with its
   * unaccented equivalent.
   *
   * @param {String} variable
   */
  __normalizeVariable (variable) {
    if (!variable) return '';

    return variable
      .toString()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  /**
   * This method toggles the visibility of all the filters when the user presses the button below the search input.
   */
  __toggleDisplayAllFilters () {
    this.__displayAllFilters = !this.__displayAllFilters;
  }

  /**
   * This method fires when a context menu icon is pressed on a specific row. The context menu will have to be moved around
   * so that it appears aligned with the icon that triggered the event in the first place.
   *
   * @param {Event} event
   */
  __openContextMenu (event) {
    const contextMenuItem = this.$.grid.getEventContext(event).item;

    this.__contextMenu.positionTarget = event.target;
    this.__contextMenu.close();

    afterNextRender(this, () => {
      this.__contextMenu.positionTarget.style.display = 'block';
      this.__contextMenu.refit();
      this.__contextMenu.open();
      this.activeItem = contextMenuItem;
    });
  }

  /**
   * This method is invoked directly in the template so that the vaadin-split-layout has the
   * correct percentual width for the left side of the component.
   */
  __leftSideStyling () {
    const width = [CasperMoacTypes.GRID, CasperMoacTypes.GRID_SIDEBAR].includes(this.moacType) ? 'width: 100%' : `width: ${this.leftSideInitialWidth}%`;
    const maximumWidth = this.leftSideMaximumWidth ? `max-width: ${this.leftSideMaximumWidth}%` : null;
    const minimumWidth = this.leftSideMinimumWidth ? `min-width: ${this.leftSideMinimumWidth}%` : null;

    return [width, maximumWidth, minimumWidth].filter(cssRule => !!cssRule).join(';');
  }

  /**
   * This method is invoked directly in the template so that the vaadin-split-layout has the
   * correct percentual width for the right side of the component.
   */
  __rightSideStyling () {
    return [CasperMoacTypes.GRID, CasperMoacTypes.GRID_SIDEBAR].includes(this.moacType)
      ? 'width: 0%;'
      : `width: ${100 - parseInt(this.leftSideInitialWidth)}%;`;
  }

  /**
   * Depending on the current MOAC type, the active filters will be displayed differently by either
   * adding the 'filters-container-inline' class or not.
   */
  __filtersContainerClassName () {
    return [CasperMoacTypes.GRID_EPAPER, CasperMoacTypes.GRID_EPAPER_SIDEBAR].includes(this.moacType)
      ? 'filters-container'
      : 'filters-container filters-container-inline';
  }

  /**
   * This method is invoked when the _filteredItem property changes and either hides or displays the
   * vaadin-grid no items placeholder.
   *
   * @param {Array} filteredItems
   * @param {Boolean} loading
   */
  __hasNoItems (filteredItems, loading) {
    return !loading && filteredItems && filteredItems.length === 0;
  }

  /**
   * Utility method to check if an event path contains a specific node type.
   *
   * @param {Event} event The event's object.
   * @param {String} nodeName The node type that should be present in the event's path.
   */
  __eventPathContainsNode (event, nodeName) {
    return event.composedPath().find(element => element.nodeName && element.nodeName.toLowerCase() === nodeName);
  }

  /**
   * This function is a wrapper for the Polymer's debounce method.
   *
   * @param {String} debouncerProperty The casper-moac's property that will hold the current debounce status.
   * @param {Function} callback The function that will be invoked afterwards.
   * @param {Number} timeOutMilliseconds Number of milliseconds after the last invoke that will trigger the callback.
   */
  __debounce (debouncerProperty, callback, timeOutMilliseconds = 250) {
    this[debouncerProperty] = Debouncer.debounce(
      this[debouncerProperty],
      timeOut.after(timeOutMilliseconds),
      () => {
        callback();
      }
    );
  }

  /**
   * This function is used to cancel active debouncers.
   *
   * @param {String} debouncerProperty The casper-moac's property that currently holds the debounce status.
   */
  __cancelDebounce (debouncerProperty) {
    if (this[debouncerProperty] && this[debouncerProperty].isActive()) {
      this[debouncerProperty].cancel();
    }
  }

  /**
   * This observer gets called when the internal property filteredItems changes.
   */
  __filteredItemsChanged () {
    this.displayedItems = this.__filteredItems;

    this.__filteredItems.forEach((item, itemIndex) => {
      item[this.idInternalProperty] = itemIndex;
    });
  }

  /**
   * Look for the index of a specific item based on the internal / external identifier property.
   *
   * @param {Number | String} itemId The item's identifier that we'll looking for.
   * @param {Boolean} useExternalProperty This flag states which identifier should be used.
   * @param {Array} filteredItems When this parameter is present use it to search the item instead of the __filteredItems.
   */
  __findItemIndexById (itemId, useExternalProperty = false, filteredItems) {
    return useExternalProperty
      ? (filteredItems || this.__filteredItems).findIndex(item => String(item[this.idExternalProperty]) === String(itemId))
      : (filteredItems || this.__filteredItems).findIndex(item => String(item[this.idInternalProperty]) === String(itemId));
  }

  /**
   * This method is used to compare two objects and state if they're equal or not based on the
   * internal / external identifier property.
   *
   * @param {Object} previousItem The first item that will be used for comparison.
   * @param {Object} nextItem The next item that will be used for comparison.
   * @param {Boolean} useExternalProperty This flag states which identifier should be used - internal ou external.
   */
  __compareItems (previousItem, nextItem, useExternalProperty = false) {
    return useExternalProperty
      ? String(previousItem[this.idExternalProperty]) === String(nextItem[this.idExternalProperty])
      : String(previousItem[this.idInternalProperty]) === String(nextItem[this.idInternalProperty]);
  }

  /**
   *
   * @param {Object} item The item which internal / external idenifier will be used for comparison.
   * @param {String | Number} itemId The item's identifier that we'll be used for comparison.
   * @param {Boolean} useExternalProperty This flag states which identifier should be used - internal ou external.
   */
  __compareItemWithId (item, itemId, useExternalProperty = false) {
    return useExternalProperty
      ? String(item[this.idExternalProperty]) === String(itemId)
      : String(item[this.idInternalProperty]) === String(itemId);
  }

  /**
   * This method returns all the items that can be selected since one can disable the selection per item.
   */
  __selectableItems () {
    return this.__filteredItems.filter(filteredItem => !filteredItem[this.disableSelectionInternalProperty]);
  }

  /**
   * This method is used to select and sort the filters that will be present in the current URL.
   */
  __buildHistoryStateFilters () {
    this.__historyStateFilters = Object.keys(this.filters)
      .filter(filterKey => !this.filters[filterKey].historyState || !this.filters[filterKey].historyState.disabled)
      .sort((a, b) => {
        if ((this.filters[a].historyState === undefined || this.filters[a].historyState.priority === undefined) && (this.filters[b].historyState === undefined || this.filters[b].historyState.priority === undefined)) return 0;
        if (this.filters[a].historyState === undefined || this.filters[a].historyState.priority === undefined) return 1;
        if (this.filters[b].historyState === undefined || this.filters[b].historyState.priority === undefined) return -1;

        if (this.filters[a].historyState.priority < this.filters[b].historyState.priority) return -1;
        if (this.filters[a].historyState.priority > this.filters[b].historyState.priority) return 1;

        return 0;
      });
  }

  /**
   * This method is used to update the current URL with the filters that are being applied at the moment.
   */
  __updateUrlWithCurrentFilters () {
    const searchParams = new URLSearchParams(window.location.search);
    this.__historyStateFilters.forEach(historyStateFilter => {
      // Remove the value firstly so that we don't end up with stale data.
      searchParams.delete(historyStateFilter);

      // Only include non-empty filters.
      if (this.__valueIsNotEmpty(this.filters[historyStateFilter].value)) {
        searchParams.set(historyStateFilter, this.filters[historyStateFilter].value);
      }
    });

    searchParams.delete(this.freeFilterUrlParameterName);
    if (this.__lastFreeFilter) {
      searchParams.set(this.freeFilterUrlParameterName, this.__lastFreeFilter);
    }

    const searchParamsText = searchParams.toString();
    if (searchParamsText) {
      history.replaceState({}, '', `${window.location.pathname}?${searchParamsText}`);
    }
  }
}

customElements.define(CasperMoac.is, CasperMoac);