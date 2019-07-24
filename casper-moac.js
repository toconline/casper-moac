import { CasperMoacLazyLoadBehavior } from './casper-moac-lazy-load-mixin.js';
import '@casper2020/casper-icons/casper-icons.js';
import '@casper2020/casper-epaper/casper-epaper.js';
import '@casper2020/casper-select/casper-select.js';
import '@casper2020/casper-date-picker/casper-date-picker.js';
import '@vaadin/vaadin-grid/vaadin-grid.js';
import '@vaadin/vaadin-split-layout/vaadin-split-layout.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-input/iron-input.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

export class CasperMoac extends CasperMoacLazyLoadBehavior(PolymerElement) {

  static get is () {
    return 'casper-moac';
  }

  static get filterTypes () {
    return {
      PAPER_INPUT: 'PAPER_INPUT',
      CASPER_SELECT: 'CASPER_SELECT',
      CASPER_DATE_PICKER: 'CASPER_DATE_PICKER',
    };
  }

  static get properties () {
    return {
      /**
       * The list of items to be displayed.
       * @type {Array}
       */
      items: {
        type: Array,
        observer: '_itemsChanged'
      },
      /**
       * List of attributes that should be used to filter.
       * @type {Array}
       */
      resourceFilterAttributes: Array,
      /**
       * The placeholder used in the input where the user can filter the results.
       * @type {String}
       */
      filterInputPlaceholder: {
        type: String,
        value: 'Filtrar Resultados'
      },
      /**
       * Label that will be used on the header when multiple items are selected in
       * the vaadin-grid.
       * @type {String}
       */
      multiSelectionLabel: String,
      /**
       * Flag used to activate the casper-moac's lazy load mode.
       * @type {Boolean}
       */
      lazyLoad: {
        type: Boolean,
        value: false
      },
      /**
       * A reference to the epaper object so that the page using casper-moac can
       * use its methods.
       * @type {Object}
       */
      epaper: {
        type: Object,
        notify: true
      },
      /**
       * The item that is currently active in the vaadin-grid.
       * @type {Object}
       */
      activeItem: {
        type: Object,
        notify: true,
      },
      /**
       * The items that are currently selected in the vaadin-grid.
       * @type {Array}
       */
      selectedItems: {
        type: Array,
        notify: true
      },
      /**
       * The array of filters that are available to filter the results presents on the page.
       * @type {Array}
       */
      filters: {
        type: Object,
        notify: true,
        observer: '_filtersChanged'
      },
      /**
       * The initial width of the left~side container.
       * @type {Number}
       */
      leftSideInitialWidth: {
        type: Number,
        value: 40
      },
      /**
       * Whether to display or not the number of results on the top-right corner of the filters.
       * @type {Boolean}
       */
      hideNumberResults: {
        type: Boolean,
        value: false
      },
      /**
       * Whether to display or not all the filters components (casper-select / paper-input / casper-date-picker).
       * @type {Boolean}
       */
      _displayAllFilters: {
        type: Boolean,
        value: false
      }
    };
  }

  static get observers () {
    return [
      '_selectedItemsChanged(selectedItems.splices)'
    ];
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
        }

        /* Iron input styles */
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
          font-size: 0.85em;
          font-weight: bold;
          text-transform: unset;
          color: var(--primary-color);
        }

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

        .left-side-container .header-container .active-filters .active-filters-list .active-filter strong {
          cursor: pointer;
          margin-right: 5px;
          color: var(--primary-color);
        }

        .left-side-container .header-container .active-filters .active-filters-list .active-filter strong:hover {
          color: var(--dark-primary-color);
        }

        .left-side-container .filters-container {
          display: grid;
          grid-row-gap: 5px;
          grid-column-gap: 10px;
          grid-template-columns: 1fr 1fr;
          padding: 15px;
          margin-bottom: 15px;
          border-top: 1px solid var(--primary-color);
          border-bottom: 1px solid var(--primary-color);
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

        .left-side-container .grid-container {
          flex-grow: 1;
        }

        .left-side-container .grid-multiple-selection-container {
          display: flex;
          padding: 10px;
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

        .left-side-container .grid-multiple-selection-container slot[name="actions-multiple-selected"]::slotted(paper-icon-button) {
          padding: 3px;
          width: 25px;
          height: 25px;
          color: white;
          margin-left: 5px;
          border-radius: 50%;
          background-color: var(--primary-color);
        }

        .left-side-container .grid-container vaadin-grid {
          height: 100%;
          overflow: hidden;
          border-radius: 5px;
        }
      </style>
      <vaadin-split-layout>
        <div class="left-side-container">
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
              <paper-button id="displayAllFilters" on-click="_toggleDisplayAllFilters">
                [[_displayOrHideFiltersButtonLabel(_displayAllFilters)]]
              </paper-button>
            </div>
            <!--Active filters-->
            <div class="active-filters">
              <div class="header">
                <strong>Filtros ativos:</strong>
                <template is="dom-if" if="[[!hideNumberResults]]">
                  [[_filteredItems.length]] resultado(s)
                </template>
              </div>
              <div class="active-filters-list" id="activeFilters"></div>
            </div>
          </div>

          <div hidden$="[[!_displayAllFilters]]">
            <div class="filters-container">
              <template is="dom-repeat" items="[[_filters]]">
                <div class="filter-container">
                  <span>[[item.filter.label]]:</span>
                  <!--Casper-Select filter-->
                  <template is="dom-if" if="[[_isFilterCasperSelect(item.filter.type)]]">
                    <casper-select
                      data-filter$="[[item.filterKey]]"
                      list-width="20vw"
                      list-height="50vh"
                      value="{{item.filter.value}}"
                      items="[[item.filter.options]]"
                      label="[[item.filter.inputOptions.label]]"
                      multi-selection$="[[item.filter.inputOptions.multiSelection]]"
                      lazy-load-resource="[[item.filter.inputOptions.lazyLoadResource]]"
                      lazy-load-callback="[[item.filter.inputOptions.lazyLoadCallback]]"
                      lazy-load-filter-fields="[[item.filter.inputOptions.lazyLoadFilterFields]]">
                    </casper-select>
                  </template>

                  <!--Paper-Input filter-->
                  <template is="dom-if" if="[[_isFilterPaperInput(item.filter.type)]]">
                    <paper-input
                      data-filter$="[[item.filterKey]]"
                      value="{{item.filter.value}}"
                      label="[[item.filter.inputOptions.label]]">
                    </paper-input>
                  </template>

                  <!--Casper-Date-Picker filter-->
                  <template is="dom-if" if="[[_isFilterCasperDatePicker(item.filter.type)]]">
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

          <div class="grid-multiple-selection-container" hidden$="[[!_hasSelectedItems]]">
            <div class="grid-multiple-selection-label">
              Selecção Múltipla:&nbsp;<strong>[[selectedItems.length]]&nbsp;[[multiSelectionLabel]]</strong>
            </div>
            <div>
              <slot name="actions-multiple-selected"></slot>
            </div>
          </div>

          <!--Vaadin grid container-->
          <div class="grid-container">
            <vaadin-grid
              id="grid"
              class="moac"
              theme="row-stripes"
              page-size="[[pageSize]]"
              items="[[_filteredItems]]"
              active-item="{{activeItem}}"
              selected-items="{{selectedItems}}">
              <slot name="grid"></slot>
            </vaadin-grid>
          </div>
        </div>
        <div class="right-side-container">
          <slot name="right"></slot>
          <casper-epaper id="epaper" app="[[app]]"></casper-epaper>
        </div>
      </vaadin-split-layout>
    `;
  }

  _isFilterPaperInput (itemType) { return itemType === CasperMoac.filterTypes.PAPER_INPUT; }
  _isFilterCasperSelect (itemType) { return itemType === CasperMoac.filterTypes.CASPER_SELECT; }
  _isFilterCasperDatePicker (itemType) { return itemType === CasperMoac.filterTypes.CASPER_DATE_PICKER; }

  ready () {
    super.ready();

    this.epaper = this.$.epaper;

    // Calculate the initial width for both the left and right side containers.
    this.shadowRoot.querySelector('.left-side-container').style.width = `${this.leftSideInitialWidth}%`;
    this.shadowRoot.querySelector('.right-side-container').style.width = `${100 - parseInt(this.leftSideInitialWidth)}%`;

    // Either provide the Vaadin Grid the lazy load function or manually trigger the filter function.
    this.lazyLoad
      ? this._initializeLazyLoad()
      : afterNextRender(this, () => this._filterItems());

    // Set event listeners.
    this.addEventListener('mousemove', event => this.app.tooltip.mouseMoveToolip(event));
    this.$.filterInput.addEventListener('keyup', () => this._filterChanged());

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
          this._renderActiveFilters();
      }));
    });
  }

  _itemsChanged () {
    this._filterItems();
  }

  _filterChanged () {
    this._filterChangedDebouncer = Debouncer.debounce(
      this._filterChangedDebouncer,
      timeOut.after(this.resourceFilterDebounceMs),
      () => { this.lazyLoad ? this._filterItemsLazyLoad() : this._filterItems(); }
    );
  }

  _filtersChanged (filters) {
    if (!filters) return;

    // Transform the filters object into an array to use in a dom-repeat.
    this._filters = Object.keys(filters).map(filterKey => ({
      filterKey: filterKey,
      filter: this.filters[filterKey]
    }));

    afterNextRender(this, () => this._renderActiveFilters());
  }

  _selectedItemsChanged () {
    this._hasSelectedItems = this.selectedItems && this.selectedItems.length > 0;
  }

  _filterItems () {
    // If the search input is empty or there are no items at the moment.
    if (!this.$.filterInput.value || !this.items) {
      this._filteredItems = this.items || [];
      return;
    }

    // Either retrieve the list of filter attributes from the properties or from the item's existing keys.
    let filterAttributes = this.resourceFilterAttributes;
    if (!filterAttributes && this.items.length > 0) {
      filterAttributes = Object.keys(this.items[0]);
    }

    if (filterAttributes && this.items.length > 0) {
      const filterTerm = this._normalizeVariableForComparison(this.$.filterInput.value);

      this._filteredItems = this.items.filter(item => {
        return filterAttributes.some(filterAttribute => item[filterAttribute] && this._normalizeVariableForComparison(item[filterAttribute]).includes(filterTerm));
      });
    }
  }

  _normalizeVariableForComparison (variable) {
    return variable
      .toString()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  _toggleDisplayAllFilters () {
    this._displayAllFilters = !this._displayAllFilters;
  }

  _displayOrHideFiltersButtonLabel () {
    return !this._displayAllFilters ? 'Ver todos os filtros' : 'Esconder todos os filtros';
  }

  _displayInlineFilters (event) {
    const filterKey = event.target.dataset.filter
    const filter = this.filters[filterKey];

    switch (filter.type) {
      case CasperMoac.filterTypes.CASPER_SELECT:
        !filter.inputOptions.multiSelection
          ? this.shadowRoot.querySelector(`casper-select[data-filter="${filterKey}"]`).openDropdown(event.target)
          : this.shadowRoot.querySelector(`casper-select[data-filter="${filterKey}"]`).openDropdown(this.$.activeFilters);
        break;
      case CasperMoac.filterTypes.PAPER_INPUT:
        this._displayAllFilters = true;
        this.shadowRoot.querySelector(`paper-input[data-filter="${filterKey}"]`).focus();
        break;
      case CasperMoac.filterTypes.CASPER_DATE_PICKER:
        this._displayAllFilters = true;
        this.shadowRoot.querySelector(`casper-date-picker[data-filter="${filterKey}"]`).open();
        break;
    }
  }

  _renderActiveFilters () {
    this.$.activeFilters.innerHTML = '';

    const activeFiltersValues = {};
    this._filters.forEach(filterItem => {
      const activeFilterValue = this._renderActiveFilterValue(filterItem);
      if (activeFilterValue) {
        activeFiltersValues[filterItem.filterKey] = activeFilterValue;
      }
    });

    // This means that it wasn't possible obtain all the values from the filters components and therefore we schedule a new render.
    if (this._filters.filter(filterItem => !!filterItem.filter.value).length !== Object.keys(activeFiltersValues).length) {
      afterNextRender(this, () => this._renderActiveFilters());
      return;
    }

    this._filters.forEach(filterItem => {
      if (filterItem.filter.value) {
        const activeFilter = document.createElement('div');
        activeFilter.className = 'active-filter';

        const activeFilterLabel = document.createTextNode(`${filterItem.filter.label}:\u00a0`);
        const activeFilterValue = document.createElement('strong');
        activeFilterValue.dataset.filter = filterItem.filterKey;
        activeFilterValue.innerHTML = activeFiltersValues[filterItem.filterKey];
        activeFilterValue.addEventListener('click', event => this._displayInlineFilters(event));

        activeFilter.appendChild(activeFilterLabel);
        activeFilter.appendChild(activeFilterValue);
        this.$.activeFilters.appendChild(activeFilter);
      }
    });
  }

  _renderActiveFilterValue (filterItem) {
    if (!filterItem.filter.value) return;

    switch (filterItem.filter.type) {
      case CasperMoac.filterTypes.PAPER_INPUT:
      case CasperMoac.filterTypes.CASPER_DATE_PICKER:
        return filterItem.filter.value;
      case CasperMoac.filterTypes.CASPER_SELECT:
        const casperSelect = this.shadowRoot.querySelector(`casper-select[data-filter="${filterItem.filterKey}"]`);

        if (!casperSelect || !casperSelect.selectedItems || casperSelect.selectedItems.length === 0) return;

        const casperSelectSelectedItems = casperSelect.multiSelection
          ? casperSelect.selectedItems
          : [casperSelect.selectedItems];

        return casperSelectSelectedItems.map(selectedItem => selectedItem[casperSelect.itemColumn]).join(', ');
    }
  }
}

customElements.define(CasperMoac.is, CasperMoac);