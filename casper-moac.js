import { CasperMoacTypes, CasperMoacFilterTypes, CasperMoacOperators } from './casper-moac-constants.js';
import { CasperMoacLazyLoadMixin } from './casper-moac-lazy-load-mixin.js';

import '@vaadin/vaadin-grid/vaadin-grid.js';
import '@vaadin/vaadin-grid/vaadin-grid-column.js';
import '@vaadin/vaadin-grid/vaadin-grid-selection-column.js';
import '@casper2020/casper-icons/casper-icons.js';
import '@casper2020/casper-epaper/casper-epaper.js';
import '@casper2020/casper-select/casper-select.js';
import '@casper2020/casper-date-picker/casper-date-picker.js';
import '@vaadin/vaadin-split-layout/vaadin-split-layout.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-input/iron-input.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

export class CasperMoac extends CasperMoacLazyLoadMixin(PolymerElement) {

  static get is () {
    return 'casper-moac';
  }

  static get properties () {
    return {
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
       * The identifier property that will be used when painting the active row.
       *
       * @type {String}
       */
      idProperty: {
        type: String,
        value: 'id'
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
        value: 'Filtrar Resultados'
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
        value: {},
        observer: '__filtersChanged'
      },
      /**
       * The initial width of the left~side container.
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
       * Stylesheet to be injected in order to style the vaadin-grid inner components.
       *
       * @type {String}
       */
      stylesheet: {
        type: String,
        observer: '__stylesheetChanged'
      },
      /**
       * Icon that will be used when the vaadin-grid has no items to display.
       *
       * @type {String}
       */
      noItemsIcon: {
        type: String,
        value: 'casper-icons:empty-data'
      },
      /**
       * Text that will be used when the vaadin-grid has no items to display.
       *
       * @type {String}
       */
      noItemsText: {
        type: String,
        value: 'Não existem qualquer resultados para mostrar.'
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
       * Whether to display or not all the filters components (casper-select / paper-input / casper-date-picker).
       *
       * @type {Boolean}
       */
      __displayAllFilters: {
        type: Boolean,
        value: false,
        observer: '__displayAllFiltersChanged'
      }
    };
  }

  static get observers () {
    return [
      '__selectedItemsChanged(selectedItems.splices)'
    ];
  }

  static get template () {
    return html`
      <style include="casper-common-styles">
        vaadin-split-layout {
          height: 100%;
          transform: unset;
          overflow: visible !important;
        }

        .left-side-container {
          padding: 15px;
          display: flex;
          flex-direction: column;
          background-color: white;
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

        .left-side-container .header-container .generic-filter-container {
          padding: 0 10px;
          text-align: center;
          display: flex;
          flex-direction: column;
        }

        /* Filter paper-input */
        .left-side-container .header-container .generic-filter-container #filterInput {
          height: 35px;
          display: flex;
          padding: 0 10px;
          border-radius: 3px;
          align-items: center;
          border: 1px solid lightgrey;
          transition: border 250ms linear;
        }

        .left-side-container .header-container .generic-filter-container #filterInput:focus,
        .left-side-container .header-container .generic-filter-container #filterInput:hover {
          border-color: var(--primary-color);
        }

        .left-side-container .header-container .generic-filter-container #filterInput iron-icon {
          height: 75%;
          color: var(--primary-color);
        }

        .left-side-container .header-container .generic-filter-container #filterInput input {
          border: none;
          height: 100%;
          flex-grow: 1;
          outline: none;
          font-size: 13px;
          background: transparent;
        }

        .left-side-container .header-container .generic-filter-container #displayAllFilters {
          margin: 0;
          width: 100%;
          line-height: 15px;
          font-size: 0.85em;
          font-weight: bold;
          text-transform: unset;
          color: var(--primary-color);
          transition: background-color 100ms linear;
        }

        .left-side-container .header-container .generic-filter-container #displayAllFilters:hover {
          background-color: rgba(var(--primary-color-rgb), 0.2);
        }

        .left-side-container .header-container .generic-filter-container #displayAllFilters iron-icon {
          width: 15px;
          height: 15px;
          margin-left: 5px;
          transition: transform 200ms linear;
        }

        .left-side-container .header-container .generic-filter-container #displayAllFilters iron-icon[rotate] {
          transform: rotate(180deg);
        }

        /* Active filters summary */
        .left-side-container .header-container .active-filters {
          display: flex;
          font-size: 0.85em;
          flex-direction: column;
        }

        .left-side-container .header-container .active-filters .header {
          display: flex;
          margin-bottom: 10px;
          justify-content: space-between;
        }

        .left-side-container .header-container .active-filters .active-filters-list {
          display: flex;
          flex-wrap: wrap;
        }

        .left-side-container .header-container .active-filters .no-active-filters {
          color: #A5A5A5;
        }

        .left-side-container .header-container .active-filters .active-filters-list .active-filter strong {
          cursor: pointer;
          margin-right: 5px;
          color: var(--primary-color);
        }

        .left-side-container .header-container .active-filters .active-filters-list .active-filter strong:hover {
          color: var(--dark-primary-color);
        }

        /* Active filters */
        .left-side-container .filters-container {
          display: grid;
          grid-row-gap: 10px;
          grid-column-gap: 10px;
          grid-template-columns: 1fr 1fr;
          padding: 15px;
          margin-bottom: 15px;
          border-top: 1px solid var(--primary-color);
          border-bottom: 1px solid var(--primary-color);
        }

        .left-side-container .filters-container.filters-container-inline {
          display: flex;
          padding: 10px;
        }

        .left-side-container .filters-container.filters-container-inline .filter-container {
          flex: 1;
          margin: 0 5px;
        }

        .left-side-container .filters-container .filter-container span {
          font-weight: bold;
          color: var(--primary-color);
        }

        .left-side-container .filters-container .filter-container paper-input,
        .left-side-container .filters-container .filter-container paper-checkbox,
        .left-side-container .filters-container .filter-container casper-select,
        .left-side-container .filters-container .filter-container casper-date-picker {
          width: 100%;
        }

        .left-side-container .filters-container .filter-container paper-checkbox {
          margin-top: 25px;
        }

        /* Vaadin-grid */
        .left-side-container .grid-container {
          flex-grow: 1;
          position: relative;
        }

        .left-side-container .grid-no-items {
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          color: #8A8A8A;
          position: absolute;
          text-align: center;
          align-items: center;
          flex-direction: column;
          justify-content: center;
          background: rgba(0, 0, 0, 0.1);
        }

        .left-side-container .grid-no-items iron-icon {
          width: 100px;
          height: 100px;
        }

        .left-side-container paper-spinner {
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

        .left-side-container .grid-multiple-selection-container {
          display: flex;
          padding: 10px;
          border-radius: 5px;
          align-items: center;
          background-color: #1A39601A;
          justify-content: space-between;
        }

        .left-side-container .grid-multiple-selection-container .grid-multiple-selection-label {
          font-size: 0.75em;
          color: var(--primary-color);
        }

        .left-side-container .grid-multiple-selection-container .grid-multiple-selection-icons {
          display: flex;
          flex-wrap: wrap;
          margin: -10px 0 0 0;
        }

        .left-side-container .grid-container vaadin-grid {
          height: 100%;
          overflow: hidden;
          border-radius: 5px;
        }

        .left-side-container .grid-container vaadin-grid .context-menu-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          color: var(--primary-color);
          display: var(--display-actions-on-hover);
        }

        .left-side-container .grid-container vaadin-grid .context-menu-icon:hover {
          color: white;
          cursor: pointer;
          background-color: var(--primary-color);
        }

        .right-side-container {
          display: flex;
          max-height: 100%;
          overflow: hidden;
        }

        .right-side-container .epaper-container {
          flex: 1 0 75%;
          overflow: hidden;
        }

        .right-side-container .sidebar-container {
          flex: 1 0 25%;
          display: flex;
          flex-direction: column;
        }
      </style>

      <vaadin-split-layout id="splitLayout">
        <div class="left-side-container" style="[[__leftSideInitialWidth()]]">
          <div class="header-container">
            <!--Casper-moac-menu-->
            <slot name="menu"></slot>
            <div class="generic-filter-container">
              <!--Generic Filter input-->
              <iron-input id="filterInput">
                <input placeholder="[[filterInputPlaceholder]]" id="filterInternalInput" />
                <iron-icon icon="casper-icons:search"></iron-icon>
              </iron-input>

              <!--Show/hide the active filters-->
              <template is="dom-if" if="[[__hasFilters]]">
                <paper-button id="displayAllFilters" on-click="__toggleDisplayAllFilters">
                  <span>Ver todos os filtros</span>
                  <iron-icon icon="casper-icons:arrow-drop-down"></iron-icon>
                </paper-button>
              </template>
            </div>

            <!--Active filters-->
            <div class="active-filters">
              <div class="header">
                <strong>Filtros ativos:</strong>
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

          <div hidden$="[[!__hasSelectedItems]]">
            <div class="grid-multiple-selection-container" >
              <div class="grid-multiple-selection-label">
                Selecção Múltipla:&nbsp;<strong>[[selectedItems.length]]&nbsp;[[multiSelectionLabel]]</strong>
              </div>
              <div class="grid-multiple-selection-icons">
                <slot name="actions-multiple-selected"></slot>
              </div>
            </div>
          </div>

          <!--Vaadin grid container-->
          <div class="grid-container">
            <vaadin-grid
              id="grid"
              class="moac"
              theme="row-stripes"
              loading="{{__gridLoading}}"
              items="[[__filteredItems]]"
              active-item="{{activeItem}}"
              page-size="[[resourcePageSize]]"
              selected-items="{{selectedItems}}">
              <vaadin-grid-selection-column width="45px" flex-grow="0" text-align="center"></vaadin-grid-selection-column>

              <slot name="grid"></slot>

              <!--Context Menu-->
              <template is="dom-if" if="[[__displayContextMenu]]">
                <vaadin-grid-column flex-grow="0" width="40px">
                  <template>
                    <iron-icon
                      class="context-menu-icon"
                      on-click="__openContextMenu"
                      icon="casper-icons:arrow-drop-down">
                    </iron-icon>
                  </template>
                </vaadin-grid-column>
              </template>

              <!--vaadin-grid-column with the id property to make sure the correct active item is highlighted-->
              <vaadin-grid-column width="0px" flex-grow="0" path="[[idProperty]]" hidden></vaadin-grid-column>
            </vaadin-grid>

            <!--No items placeholder-->
            <template is="dom-if" if="[[__hasNoItems(__filteredItems, __internalItems, __gridLoading, loading)]]">
              <div class="grid-no-items">
                <iron-icon icon="[[noItemsIcon]]"></iron-icon>
                [[noItemsText]]
              </div>
            </template>

            <!--Loading paper-spinner-->
            <paper-spinner active="[[__displaySpinner(__gridLoading, loading)]]"></paper-spinner>
          </div>
        </div>

        <div class="right-side-container" style="[[__rightSideInitialWidth()]]">
          <!--Epaper-->
          <template is="dom-if" if="[[__displayEpaper]]">
            <div class="epaper-container">
              <slot name="right"></slot>
              <casper-epaper app="[[app]]">
                <slot name="casper-epaper-tabs" slot="casper-epaper-tabs"></slot>
                <slot name="casper-epaper-actions" slot="casper-epaper-actions"></slot>
                <slot name="casper-epaper-context-menu" slot="casper-epaper-context-menu"></slot>
              </casper-epaper>
            </div>
          </template>

          <!--Sidebar-->
          <template is="dom-if" if="[[__displaySidebar]]">
            <div class="sidebar-container">
              <slot name="sidebar"></slot>
            </div>
          </template>
        </div>
      </vaadin-split-layout>

      <slot name="context-menu"></slot>
    `;
  }

  __isFilterPaperInput (itemType) { return itemType === CasperMoacFilterTypes.PAPER_INPUT; }
  __isFilterPaperCheckbox (itemType) { return itemType === CasperMoacFilterTypes.PAPER_CHECKBOX; }
  __isFilterCasperSelect (itemType) { return itemType === CasperMoacFilterTypes.CASPER_SELECT; }
  __isFilterCasperDatePicker (itemType) { return itemType === CasperMoacFilterTypes.CASPER_DATE_PICKER; }

  ready () {
    super.ready();

    this.grid             = this.$.grid;
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

    // Set event listeners.
    this.addEventListener('mousemove', event => this.app.tooltip.mouseMoveToolip(event));
    this.__bindClickEvents();
    this.__bindFiltersEvents();
    this.__bindContextMenuEvents();
    this.__monkeyPatchVaadinElements();

    this.__boundKeyDownEvents = this.__bindKeyDownEvents.bind(this);
    document.addEventListener('keydown', this.__boundKeyDownEvents);
  }

  disconnectedCallback () {
    super.disconnectedCallback();

    document.removeEventListener('keydown', this.__boundKeyDownEvents);
  }

  /**
   * As the name suggests, this method applies some monkey-patches to the vaadin elements. Firstly
   * it hides the grid's vertical scrollbars since the grid behaves poorly when jumping into a specific scroll position when the items
   * are lazily loaded. Then it adds a scroll event listener to paint the active row due to the grid's constant re-usage of rows.
   * It also hides the vaadin-split-layout handler if there is no epaper / sidebar.
   */
  __monkeyPatchVaadinElements () {
    this.$.grid.$.outerscroller.addEventListener('scroll', () => this.__paintGridActiveRow());

    if (this.lazyLoad) {
      this.$.grid.$.table.style.overflow = 'hidden';
    }

    if (!this.__displayEpaper && !this.__displaySidebar) {
      this.$.splitLayout.$.splitter.style.display = 'none';
    }
  }

  /**
   * Bind click events in order to paint the current active item and to update the __filteredItems
   * when the user uses the grid sort columns.
   */
  __bindClickEvents () {
    this.$.grid.addEventListener('click', event => {
      this.__paintGridActiveRow();

      // When the grid is not lazy-loaded, when the user clicks on the header make sure the __filteredItems matches the vaadin-grid items.
      if (!this.lazyLoad && this.__eventPathContainsNode(event, 'thead')) {
        this.__mirrorGridInternalItems();
      }
    });
  }

  /**
   * Bind event listeners to the generic search input and to the ones present in the filters property.
   */
  __bindFiltersEvents () {
    this.$.filterInternalInput.addEventListener('keyup', () => this.__freeFilterChanged());
    this.$.filterInternalInput.addEventListener('blur', () => { this.$.filterInput.style.border = ''; });
    this.$.filterInternalInput.addEventListener('focus', () => { this.$.filterInput.style.border = '1px solid var(--primary-color)'; });

    const filterChangedCallback = () => {
      this.dispatchEvent(new CustomEvent('filters-changed'));
      this.__renderActiveFilters();

      // If this is a lazy-loaded vaadin-grid, trigger the re-fetch of the resource.
      if (this.lazyLoad) this.__filterLazyLoadItems();
    };

    afterNextRender(this, () => {
      this.shadowRoot.querySelectorAll(`
        paper-input[data-filter],
        paper-checkbox[data-filter],
        casper-select[data-filter],
        casper-date-picker[data-filter]
      `).forEach(filter => {
        filter.nodeName.toLowerCase() !== 'paper-checkbox'
          ? filter.addEventListener('value-changed', filterChangedCallback)
          : filter.addEventListener('checked-changed', filterChangedCallback);
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

    this.__contextMenu.addEventListener('iron-overlay-canceled', event => {
      const eventPathElement = event.detail.path.shift();

      // This means the iron-overlay-canceled event was called after a new menu was open so we hide the previous one.
      if (eventPathElement.classList.contains('context-menu-icon')) {
        this.__lastContextMenuTarget.removeAttribute('style');

        // Do not close the overlay if the event was triggered by another context menu icon.
        if (this.__lastContextMenuTarget !== eventPathElement) {
          event.preventDefault();
        }
      } else {
        // This means the iron-overlay-canceled event was called after some other element was clicked so we close the current menu.
        this.__contextMenu.positionTarget.removeAttribute('style');
      }
    });
  }

  /**
   * Bind event listeners for when the user presses down the Enter or the down / up arrow keys.
   */
  __bindKeyDownEvents (event) {
    const keyCode = event.code;

    if (!['Enter', 'ArrowUp', 'ArrowDown'].includes(keyCode) || (
      (!this.__internalItems || this.__internalItems.length === 0) &&
      (!this.__gridInternalItems || this.__gridInternalItems.length === 0)
    )) return;

    const displayedItems = this.__internalItems || this.__gridInternalItems;

    // When there are no active items, select the first one.
    if (!this.__activeItem) {
      this.__activeItem = displayedItems[0];
    } else {
      // Find the index of the current active item.
      const activeItemIndex = displayedItems.findIndex(item => item === this.__activeItem);

      if (keyCode === 'ArrowUp' && activeItemIndex > 0) {
        this.__activeItem = displayedItems[activeItemIndex - 1];
      }

      if (keyCode === 'ArrowDown' && activeItemIndex + 1 < displayedItems.length) {
        this.__activeItem = displayedItems[activeItemIndex + 1];
      }

      if (keyCode === 'Enter') {
        !this.selectedItems.includes(this.__activeItem)
          ? this.$.grid.selectItem(this.__activeItem)
          : this.$.grid.deselectItem(this.__activeItem);
      }
    }

    this.__paintGridActiveRow(true);

    // If the active item changed, debounce the active item change.
    if (this.__activeItem !== this.__scheduleActiveItem) {
      // This property is used to avoid delaying infinitely activating the same item which is caused when the user
      // maintains the up / down arrows after reaching the first / last result in the table.
      this.__scheduleActiveItem = this.__activeItem;
      this.__debounce('__activeItemDebouncer', () => {
        this.activeItem = this.__scheduleActiveItem;
      });
    }
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
      this.__displayAllFiltersButtonIcon = this.__displayAllFiltersButtonIcon || this.__displayAllFiltersButton.querySelector('iron-icon');

      if (this.__displayAllFilters) {
        this.__displayAllFiltersButtonIcon.setAttribute('rotate', true);
        this.__displayAllFiltersButtonSpan.innerHTML = 'Esconder todos os filtros';
      } else {
        this.__displayAllFiltersButtonIcon.removeAttribute('rotate');
        this.__displayAllFiltersButtonSpan.innerHTML = 'Ver todos os filtros';
      }
    });
  }

  /**
   * Debounce the items filtering after the search input's value changes.
   */
  __freeFilterChanged () {
    this.__debounce('__freeFilterChangedDebouncer', () => {
      // Do not re-filter the items if the current value matches the last one.
      if (this.$.filterInput.value === this.__lastFreeFilter) return;

      !this.lazyLoad
        ? this.__filterItems()
        : this.__filterLazyLoadItems();

      this.__renderActiveFilters();
      this.__lastFreeFilter = this.$.filterInput.value;
    });
  }

  /**
   * Observer that fires after the filters object change from the outside which
   * will cause a re-render of the active filters.
   *
   * @param {Object} filters
   */
  __filtersChanged (filters) {
    this.__hasFilters = !!this.filters && Object.keys(this.filters).length > 0;

    // Transform the filters object into an array to use in a dom-repeat.
    this.__filters = Object.keys(filters).map(filterKey => ({
      filterKey: filterKey,
      filter: this.filters[filterKey]
    }));

    afterNextRender(this, () => this.__renderActiveFilters());
  }

  /**
   * Force the vaadin-grid to always have an activeItem.
   *
   * @param {Object} newActiveItem
   * @param {Object} previousActiveItem
   */
  __activeItemChanged (newActiveItem, previousActiveItem) {
    if (!newActiveItem && previousActiveItem && this.forceActiveItem) {
      this.$.grid.activeItem = previousActiveItem;
    }

    this.__activeItem = this.activeItem;
    this.__paintGridActiveRow();
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
    this.__hasSelectedItems = this.selectedItems && this.selectedItems.length > 0;

    if (this.lazyLoad && this.__internalItems && this.__selectAllCheckbox) {
      this.__selectAllCheckboxObserverLock = true;
      this.__selectAllCheckbox.checked = this.__internalItems.length === this.selectedItems.length && this.selectedItems.length > 0;
      this.__selectAllCheckbox.indeterminate = this.__internalItems.length !== this.selectedItems.length && this.selectedItems.length > 0;
      this.__selectAllCheckboxObserverLock = false;
    }
  }

  /**
   * Observer that fires when the stylesheet property changes which will delete the previous
   * <style> tag and create a new one with the most recent styles.
   *
   * @param {String} stylesheet
   */
  __stylesheetChanged (stylesheet) {
    const stylesheetTagId = 'custom-grid-styles';
    let stylesheetTag = this.shadowRoot.getElementById(stylesheetTagId);
    if (stylesheetTag) {
      this.shadowRoot.removeChild(stylesheetTag);
    }

    if (stylesheet) {
      stylesheetTag = document.createElement('style');
      stylesheetTag.id = stylesheetTagId;
      stylesheetTag.textContent = stylesheet;

      this.shadowRoot.appendChild(stylesheetTag);
    }
  }

  /**
   * This method filters the existing items with the search input's value taking into account the list of attributes
   * provided for that effect. If none were specified, every single attribute will be used for comparison purposes.
   */
  __filterItems () {
    this.activeItem = null;
    this.selectedItems = [];

    // If the search input is empty or there are no items at the moment.
    if (!this.$.filterInput.value || !this.items) {
      this.__filteredItems = this.items || [];
      this.__numberOfResults = `${this.__filteredItems.length} ${this.multiSelectionLabel}`;
      this.__mirrorGridInternalItems();
      this.__activateFirstItem();
      return;
    }

    // Either retrieve the list of filter attributes from the properties or from the item's existing keys.
    let filterAttributes = this.resourceFilterAttributes;
    if (!filterAttributes && this.items.length > 0) {
      filterAttributes = Object.keys(this.items[0]);
    }

    if (filterAttributes && this.items.length > 0) {
      const filterTerm = this.__normalizeVariable(this.$.filterInput.value);

      this.__filteredItems = this.items.filter(item => filterAttributes.some(filterAttribute => {
        if (filterAttribute.constructor === Object) {
          switch (filterAttribute.operator) {
            case CasperMoacOperators.EXACT_MATCH: return this.__normalizeVariable(item[filterAttribute.field]) === filterTerm;
            case CasperMoacOperators.CONTAINS: return this.__normalizeVariable(item[filterAttribute.field]).includes(filterTerm);
            case CasperMoacOperators.ENDS_WITH: return this.__normalizeVariable(item[filterAttribute.field]).endsWith(filterTerm);
            case CasperMoacOperators.STARTS_WITH: return this.__normalizeVariable(item[filterAttribute.field]).startsWith(filterTerm);
          }
        }

        return this.__normalizeVariable(item[filterAttribute]).includes(filterTerm);
      }));

      this.__numberOfResults = `${this.__filteredItems.length} de ${this.items.length} ${this.multiSelectionLabel}`;
      this.__mirrorGridInternalItems();
      this.__activateFirstItem();
    }
  }

  /**
   * This method activates the first result since this is invoked when the items change.
   */
  __activateFirstItem () {
    if (this.forceActiveItem && (
      (this.__internalItems && this.__internalItems.length > 0) ||
      (this.__gridInternalItems && this.__gridInternalItems.length > 0))) {
      // Fetch the first item from different sources depending if it's lazy-load or not.
      this.activeItem = this.lazyLoad
        ? this.__internalItems[0]
        : this.__gridInternalItems[0];
    }
  }

  /**
   * Event listener which is fired when the user clicks on a filter's value in the summary. This will try to move
   * the filter's overlay for UX purposes (casper-select) or display all the filters focusing the correct one.
   *
   * @param {Event} event
   */
  __displayInlineFilters (event) {
    const filterKey = event.target.dataset.filter
    const filter = this.filters[filterKey];

    switch (filter.type) {
      case CasperMoacFilterTypes.CASPER_SELECT:
        !filter.inputOptions.multiSelection
          ? this.shadowRoot.querySelector(`casper-select[data-filter="${filterKey}"]`).openDropdown(event.target)
          : this.shadowRoot.querySelector(`casper-select[data-filter="${filterKey}"]`).openDropdown(this.__activeFiltersContainer);
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
    this.$.activeFilters.innerHTML = '';

    this.__renderActiveFixedFilters();
    this.__renderActiveFreeFilters();

    // Create the no active filters placeholder.
    if (!this.$.activeFilters.innerHTML) {
      const noActiveFiltersPlaceholder = document.createElement('span');
      noActiveFiltersPlaceholder.className = 'no-active-filters';
      noActiveFiltersPlaceholder.innerHTML = '(Não há filtros activos)';

      this.$.activeFilters.appendChild(noActiveFiltersPlaceholder);
    }
  }

  /**
   * This method renders the current free filter being applied by the generic input.
   */
  __renderActiveFreeFilters () {
    if (!this.$.filterInput.value) return;

    this.__renderActiveFilterDOM('Pesquisa Livre', this.$.filterInput.value, () => this.$.filterInternalInput.focus());
  }

  /**
   * This method renders the current fixed filters that are being applied.
   */
  __renderActiveFixedFilters () {
    if (!this.__filters) return;

    const activeFiltersValues = {};
    this.__filters.forEach(filterItem => {
      const activeFilterValue = this.__activeFilterValue(filterItem);
      if (this.__valueIsNotEmpty(activeFilterValue)) {
        activeFiltersValues[filterItem.filterKey] = activeFilterValue;
      }
    });

    // This means that it wasn't possible obtain all the values from the filters components and therefore we schedule a new render.
    if (this.__filters.filter(filterItem => this.__valueIsNotEmpty(filterItem.filter.value)).length !== Object.keys(activeFiltersValues).length) {
      afterNextRender(this, () => this.__renderActiveFilters());
      return;
    }

    this.__filters.forEach(filterItem => {
      if (this.__valueIsNotEmpty(filterItem.filter.value)) {
        this.__renderActiveFilterDOM(
          filterItem.filter.label,
          activeFiltersValues[filterItem.filterKey],
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
    return ![null, undefined, false, ''].includes(value);
  }

  /**
   * Given a specific filter, this method is responsible for returning the human-readable version
   * of its current value.
   *
   * @param {Object} filterItem
   */
  __activeFilterValue (filterItem) {
    if (!this.__valueIsNotEmpty(filterItem.filter.value)) return;

    switch (filterItem.filter.type) {
      case CasperMoacFilterTypes.PAPER_INPUT:
      case CasperMoacFilterTypes.CASPER_DATE_PICKER:
        return filterItem.filter.value;
      case CasperMoacFilterTypes.PAPER_CHECKBOX:
        return filterItem.filter.inputOptions.label;
      case CasperMoacFilterTypes.CASPER_SELECT:
        const casperSelect = this.shadowRoot.querySelector(`casper-select[data-filter="${filterItem.filterKey}"]`);

        if (!casperSelect || !casperSelect.selectedItems || casperSelect.selectedItems.length === 0) return;

        const casperSelectSelectedItems = casperSelect.multiSelection
          ? casperSelect.selectedItems
          : [casperSelect.selectedItems];

        return casperSelectSelectedItems.map(selectedItem => selectedItem[casperSelect.itemColumn]).join(', ');
    }
  }

  /**
   * This method is invoked when the grid is either clicked or scrolled and ensures the correct active
   * row has a different background color. This is required for scroll as well since the vaadin-grid re-uses
   * its rows and having this into account, the id property is used to avoid highlighting the wrong row.
   */
  __paintGridActiveRow (focusActiveCell = false) {
    afterNextRender(this, () => {
      const activeItemId = this.__activeItem ? String(this.__activeItem[this.idProperty]) : null;

      // Loop through each grid row and paint the active one.
      this.$.grid.shadowRoot.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
        const isRowActive = row.lastElementChild.querySelector('slot').assignedElements().shift().innerHTML === activeItemId;

        Array.from(row.children).forEach(rowCell => {
          rowCell.style.backgroundColor = isRowActive ? 'rgba(var(--primary-color-rgb), 0.2)' : '';
        });

        if (isRowActive && focusActiveCell) row.firstElementChild.focus();
      });
    });
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
    this.__lastContextMenuTarget = this.__contextMenuOpenedOnce ? this.__contextMenu.positionTarget : event.target;

    // Check if the context menu was already opened.
    this.__contextMenu.positionTarget = event.target;
    this.__contextMenu.positionTarget.style.display = 'block';
    this.__contextMenu.refit();

    if (!this.__contextMenu.opened) {
      this.__contextMenu.open();
      this.__contextMenuOpenedOnce = true;

      afterNextRender(this, () => this.activeItem = contextMenuItem);
    }
  }

  /**
   * This method is invoked directly in the template so that the vaadin-split-layout has the
   * correct percentual width for the left side of the component.
   */
  __leftSideInitialWidth () {
    return this.moacType === CasperMoacTypes.GRID
      ? 'width: 100%;'
      : `width: ${this.leftSideInitialWidth}%;`;
  }

  /**
   * This method is invoked directly in the template so that the vaadin-split-layout has the
   * correct percentual width for the right side of the component.
   */
  __rightSideInitialWidth () {
    return this.moacType === CasperMoacTypes.GRID
      ? 'width: 0%;'
      : `width: ${100 - parseInt(this.leftSideInitialWidth)}%;`;
  }

  /**
   * Depending on the current MOAC type, the active filters will be displayed differently by either
   * adding the 'filters-container-inline' class or not.
   */
  __filtersContainerClassName () {
    return this.moacType === CasperMoacTypes.GRID_EPAPER || this.moacType === CasperMoacTypes.GRID_EPAPER_SIDEBAR
      ? 'filters-container'
      : 'filters-container filters-container-inline';
  }

  /**
   * This method is invoked when the _filteredItem property changes and either hides or displays the
   * vaadin-grid no items placeholder.
   *
   * @param {Array} filteredItems
   * @param {Array} internalItems
   * @param {Boolean} gridLoading
   * @param {Boolean} loading
   */
  __hasNoItems (filteredItems, internalItems, gridLoading, loading) {
    return !gridLoading && !loading && (
      (filteredItems && filteredItems.length === 0) ||
      (internalItems && internalItems.length === 0));
  }

  /**
   * Method used to toggle the paper-spinner's visibility.
   *
   * @param {Boolean} gridLoading
   * @param {Boolean} loading
   */
  __displaySpinner (gridLoading, loading) {
    return gridLoading || loading;
  }

  /**
   * Utility method to check if an event path contains a specific node type.
   *
   * @param {Event} event The event's object.
   * @param {String} nodeName The node type that should be present in the event's path.
   */
  __eventPathContainsNode (event, nodeName) {
    return event.composedPath().some(element => element.nodeName && element.nodeName.toLowerCase() === nodeName);
  }

  /**
   * This method will store the vaadin-grid's sorted and filtered items into casper-moac's __gridInternalItems property.
   */
  __mirrorGridInternalItems () {
    this.__gridInternalItems = Object.keys(this.$.grid._cache.items).map(itemIndex => this.$.grid._cache.items[itemIndex]);
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
      () => { callback(); }
    );
  }
}

customElements.define(CasperMoac.is, CasperMoac);