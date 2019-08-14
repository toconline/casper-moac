import { CasperMoacTypes, CasperMoacFilterTypes, CasperMoacOperators } from './casper-moac-constants.js';
import { CasperMoacLazyLoadMixin } from './casper-moac-lazy-load-mixin.js';

import '@casper2020/casper-icons/casper-icons.js';
import '@casper2020/casper-epaper/casper-epaper.js';
import '@casper2020/casper-select/casper-select.js';
import '@casper2020/casper-notice/casper-notice.js';
import '@casper2020/casper-date-picker/casper-date-picker.js';
import '@vaadin/vaadin-grid/vaadin-grid.js';
import '@vaadin/vaadin-grid/vaadin-grid-column.js';
import '@vaadin/vaadin-grid/vaadin-grid-selection-column.js';
import '@vaadin/vaadin-split-layout/vaadin-split-layout.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-input/iron-input.js';
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
      multiSelectionLabel: String,
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
        observer: '_stylesheetChanged'
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
       * Boolean that toggles the paper-spinner when the grid is loading items. This was required since the vaadin-grid one
       * is readoOnly.
       *
       * @type {Boolean}
       */
      loading: {
        type: Boolean,
        value: false
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
          justify-content: center;
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

        .left-side-container .header-container .generic-filter-container #filterInput:focus {
          border-color: var(--primary-color);
        }

        .left-side-container .header-container .generic-filter-container #filterInput iron-icon {
          height: 50%;
          color: var(--primary-color);
        }

        .left-side-container .header-container .generic-filter-container #filterInput input {
          border: 0;
          flex-grow: 1;
          outline: none;
          font-size: 0.75em;
        }

        .left-side-container .header-container .generic-filter-container #displayAllFilters {
          margin: 0;
          width: 100%;
          line-height: 15px;
          font-size: 0.85em;
          font-weight: bold;
          text-transform: unset;
          color: var(--primary-color);
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
        .left-side-container .filters-container .filter-container casper-select,
        .left-side-container .filters-container .filter-container casper-date-picker {
          width: 100%;
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
          top: 50%;
          left: 50%;
          width: 75px;
          height: 75px;
          position: absolute;
          --paper-spinner-stroke-width: 8px;
        }

        .left-side-container .grid-multiple-selection-container {
          display: flex;
          padding: 10px;
          border-radius: 5px;
          align-items: center;
          background-color: #1A39601A;
          justify-content: space-between;
        }

        .left-side-container .grid-multiple-selection-container[hidden] {
          display: none;
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

        .left-side-container casper-notice {
          margin-bottom: 15px;
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
        }

        .right-side-container .epaper-container {
          flex: 1 0 75%;
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
                <input placeholder="[[filterInputPlaceholder]]" />
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
            <template is="dom-if" if="[[__hasFilters]]">
              <div class="active-filters">
                <div class="header">
                  <strong>Filtros ativos:</strong>
                  <template is="dom-if" if="[[!hideNumberResults]]">
                    [[__numberOfResults]]
                  </template>
                </div>
                <div class="active-filters-list" id="activeFilters"></div>
              </div>
            </template>
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
                      items="[[item.filter.options]]"
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
                </div>
              </template>
            </div>
          </div>

          <slot name="left"></slot>

          <casper-notice>
            Para navegar entre os diversos resultados da grelha, pode usar as setas para <strong>cima e para baixo</strong>.
            Também poderá seleccionar / deseleccionar os resultados pressionando a <strong>tecla de Enter</strong>.
          </casper-notice>

          <div class="grid-multiple-selection-container" hidden$="[[!__hasSelectedItems]]">
            <div class="grid-multiple-selection-label">
              Selecção Múltipla:&nbsp;<strong>[[selectedItems.length]]&nbsp;[[multiSelectionLabel]]</strong>
            </div>
            <div class="grid-multiple-selection-icons">
              <slot name="actions-multiple-selected"></slot>
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
              <!--vaadin-grid-column with the id property to make sure the correct active item is highlighted-->
              <vaadin-grid-column width="0px" flex-grow="0" path="[[idProperty]]" hidden></vaadin-grid-column>
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
              <casper-epaper id="epaper" app="[[app]]"></casper-epaper>
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
  __isFilterCasperSelect (itemType) { return itemType === CasperMoacFilterTypes.CASPER_SELECT; }
  __isFilterCasperDatePicker (itemType) { return itemType === CasperMoacFilterTypes.CASPER_DATE_PICKER; }

  ready () {
    super.ready();

    this.grid             = this.$.grid;
    this.__displayEpaper  = [CasperMoacTypes.GRID_EPAPER_SIDEBAR, CasperMoacTypes.GRID_EPAPER].includes(this.moacType);
    this.__displaySidebar = [CasperMoacTypes.GRID_EPAPER_SIDEBAR, CasperMoacTypes.GRID_SIDEBAR].includes(this.moacType);

    if (this.__displayEpaper) {
      // Save the epaper in a notifiable property so it can be used outside.
      afterNextRender(this, () => {
        this.epaper = this.shadowRoot.querySelector('casper-epaper');
      });
    }

    // Hide the vaadin-split-layout handler.
    if (!this.__displayEpaper && !this.__displaySidebar) {
      this.$.splitLayout.shadowRoot.getElementById('splitter').style.display = 'none';
    }

    // Either provide the Vaadin Grid the lazy load function or manually trigger the filter function.
    this.lazyLoad
      ? this.__initializeLazyLoad()
      : afterNextRender(this, () => this.__filterItems());

    // Set event listeners.
    this.addEventListener('mousemove', event => this.app.tooltip.mouseMoveToolip(event));
    this.$.grid.addEventListener('click', () => this.__paintGridActiveRow());
    this.$.grid.$.outerscroller.addEventListener('scroll', () => this.__paintGridActiveRow());

    this.__bindFiltersEvents();
    this.__bindKeyPressEvents();
    this.__bindContextMenuEvents();
  }

  /**
   * Bind event listeners to the generic search input and to the ones present in the filters property.
   */
  __bindFiltersEvents () {
    this.$.filterInput.addEventListener('keyup', () => this._freeFilterChanged());
    const filterInput = this.$.filterInput.querySelector('input');
    filterInput.addEventListener('blur', () => { this.$.filterInput.style.border = ''; });
    filterInput.addEventListener('focus', () => { this.$.filterInput.style.border = '1px solid var(--primary-color)'; });

    afterNextRender(this, () => {
      this.shadowRoot.querySelectorAll(`
        paper-input[data-filter],
        casper-select[data-filter],
        casper-date-picker[data-filter]
      `).forEach(input => input.addEventListener('value-changed', () => {
          this.dispatchEvent(new CustomEvent('filters-changed'));
          this.__renderActiveFilters();

          // If this is a lazy-loaded vaadin-grid, trigger the re-fetch of the resource.
          if (this.lazyLoad) this.__filterLazyLoadItems();
      }));
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
  __bindKeyPressEvents () {
    document.addEventListener('keydown', event => {
      const keyCode = event.code;

      if ((keyCode !== 'Enter'
        && keyCode !== 'ArrowUp'
        && keyCode !== 'ArrowDown'
        && (!this.__internalItems || this.__internalItems.length === 0)
        && (!this.__filteredItems || this.__filteredItems.length === 0))
        || event.composedPath().some(element => element === this.$.filterInput)) return;

      const displayedItems = this.__internalItems || this.__filteredItems;

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

      this.__paintGridActiveRow();
      // If the active item changed, debounce the active item change.
      if (this.__activeItem !== this.activeItem) {
        this.__activeItemDebouncer = Debouncer.debounce(
          this.__activeItemDebouncer,
          timeOut.after(150),
          () => { this.activeItem = this.__activeItem; }
        );
      }
    });
  }

  /**
   * Observer that gets fired when the user displays / hides all the filters by pressing the button below the search
   * input. This method change the button's text and rotate the icon accordingly.
   */
  __displayAllFiltersChanged () {
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
  _freeFilterChanged () {
    this.__freeFilterChangedDebouncer = Debouncer.debounce(
      this.__freeFilterChangedDebouncer,
      timeOut.after(this.resourceFilterDebounceMs),
      () => {
        // Do not re-filter the items if the current value matches the last one.
        if (this.$.filterInput.value === this._lastFreeFilter) return;

        !this.lazyLoad
          ? this.__filterItems()
          : this.__filterLazyLoadItems();

        this._lastFreeFilter = this.$.filterInput.value;
      }
    );
  }

  /**
   * Observer that fires after the filters object change from the outside which
   * will cause a re-render of the active filters.
   *
   * @param {Object} filters
   */
  __filtersChanged (filters) {
    if (!filters) return;

    this.__hasFilters = !!this.filters;

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
  _stylesheetChanged (stylesheet) {
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
    this.selectedItems = [];

    // If the search input is empty or there are no items at the moment.
    if (!this.$.filterInput.value || !this.items) {
      this.__filteredItems = this.items || [];
      this.__numberOfResults = `${this.__filteredItems.length} resultado(s)`;
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

      this.__numberOfResults = `${this.__filteredItems.length} de ${this.items.length} resultado(s)`;
      this.__activateFirstItem();
    }
  }

  /**
   * This method activates the first result since this is invoked when the items change.
   */
  __activateFirstItem () {
    if (this.forceActiveItem && (
      (this.__filteredItems && this.__filteredItems.length > 0) ||
      (this.__internalItems && this.__internalItems.length > 0))) {
      // Fetch the first item from different sources depending if it's lazy-load or not.
      this.activeItem = !this.lazyLoad
        ? this.__filteredItems[0]
        : this.__internalItems[0];
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
    }
  }

  /**
   * This method is responsible for rendering the active filters summary and binding the event listeners that
   * will be reponsible for displaying the filter's input overlay when possible.
   */
  __renderActiveFilters () {
    this.__activeFiltersContainer = this.__activeFiltersContainer || this.shadowRoot.querySelector('#activeFilters');
    this.__activeFiltersContainer.innerHTML = '';

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
        const activeFilter = document.createElement('div');
        activeFilter.className = 'active-filter';

        const activeFilterLabel = document.createTextNode(`${filterItem.filter.label}: `);
        const activeFilterValue = document.createElement('strong');
        activeFilterValue.dataset.filter = filterItem.filterKey;
        activeFilterValue.innerHTML = activeFiltersValues[filterItem.filterKey];
        activeFilterValue.addEventListener('click', event => this.__displayInlineFilters(event));

        activeFilter.appendChild(activeFilterLabel);
        activeFilter.appendChild(activeFilterValue);
        this.__activeFiltersContainer.appendChild(activeFilter);
      }
    });

    if (!this.__activeFiltersContainer.innerHTML) {
      const noActiveFiltersPlaceholder = document.createElement('span');
      noActiveFiltersPlaceholder.className = 'no-active-filters';
      noActiveFiltersPlaceholder.innerHTML = '(Não há filtros activos)';

      this.__activeFiltersContainer.appendChild(noActiveFiltersPlaceholder);
    }
  }

  /**
   * This method checks if the filter value is be empty since zeroes in some occasions
   * might be used as actual values and they should not be disregarded.
   *
   * @param {String | Number | Array | Object} value
   */
  __valueIsNotEmpty (value) {
    return ![null, undefined, ''].includes(value);
  }

  /**
   * Given a specific filter, this method is responsible for returning the human-readable version
   * of its current value.
   *
   * @param {Object} filterItem
   */
  __activeFilterValue (filterItem) {
    if ([null, undefined].includes(filterItem.filter.value)) return;

    switch (filterItem.filter.type) {
      case CasperMoacFilterTypes.PAPER_INPUT:
      case CasperMoacFilterTypes.CASPER_DATE_PICKER:
        return filterItem.filter.value;
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
  __paintGridActiveRow () {
    const activeItemId = this.__activeItem ? this.__activeItem[this.idProperty].toString() : null;

    // Loop through each grid row and paint the active one.
    this.$.grid.shadowRoot.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
      const isRowActive = row.firstElementChild.querySelector('slot').assignedElements().shift().innerHTML === activeItemId;

      Array.from(row.children).forEach(rowCell => {
        rowCell.style.backgroundColor = isRowActive ? 'rgba(var(--primary-color-rgb), 0.2)' : '';
      });

      if (isRowActive) {
        row.children[1].focus();

        // Avoid "jumps" that happen when the first vaadin-grid row is focused.
        if (rowIndex === 0) this.$.grid.$.outerscroller.scrollTop = 0;
      }
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
    this.__lastContextMenuTarget = this.__contextMenuOpenedOnce ? this.__contextMenu.positionTarget : event.target;

    // Check if the context menu was already opened.
    this.__contextMenu.positionTarget = event.target;
    this.__contextMenu.positionTarget.style.display = 'block';
    this.__contextMenu.refit();

    if (!this.__contextMenu.opened) {
      this.__contextMenu.open();
      this.__contextMenuOpenedOnce = true;
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
}

customElements.define(CasperMoac.is, CasperMoac);