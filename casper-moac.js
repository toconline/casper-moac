import { CasperMoacLazyLoadBehavior } from './casper-moac-lazy-load-mixin.js';
import '@casper2020/casper-icons/casper-icons.js';
import '@casper2020/casper-epaper/casper-epaper.js';
import '@casper2020/casper-select/casper-select.js';
import '@vaadin/vaadin-grid/vaadin-grid.js';
import '@vaadin/vaadin-split-layout/vaadin-split-layout.js';
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-input/iron-input.js';
import '@polymer/paper-spinner/paper-spinner.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
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
      CASPER_SELECT: 'CASPER_SELECT'
    };
  }

  static get properties () {
    return {
      /**
       * The list of items to be displayed.
       * @type {Array}
       */
      items: Array,
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
        type: Array,
        notify: true
      },
      /**
       * The initial width of the left~side container.
       * @type {Number}
       */
      leftSideInitialWidth: {
        type: Number,
        value: 50
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
        }

        .left-side-container .header-container .generic-filter-container #filterInput:focus {
          border-color: var(--primary-color);
        }

        .left-side-container .header-container .generic-filter-container #filterInput iron-icon {
          height: 50%;
          color: var(--moac-light-grey);
        }

        .left-side-container .header-container .generic-filter-container #filterInput input {
          border: 0;
          flex-grow: 1;
          outline: none;
          font-size: 13px;
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
        }

        .left-side-container .grid-container {
          flex-grow: 1;
          position: relative;
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

        .left-side-container .grid-multiple-selection-container slot[name="multiple-selected-actions"]::slotted(paper-icon-button) {
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
                Ver todos os filtros
              </paper-button>
            </div>
            <div class="active-filters">
              <div class="header">
                <strong>Filtros activos:</strong>
                [[_filteredItems.length]] resultados
              </div>
              <div class="active-filters-list">
                <template is="dom-repeat" items="[[filters]]" as="filter" id="activeFilters">
                  <div class="active-filter" hidden$="[[!_filterHasValue(filter)]]">
                    [[filter.label]]:
                    <strong>[[_filterValue(filter)]]</strong>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div hidden$="[[!_displayAllFilters]]">
            <div class="filters-container">
              <template is="dom-repeat" items="[[filters]]" as="filter">
                <!--Casper-Select filter-->
                <template is="dom-if" if="[[_isFilterCasperSelect(filter.type)]]">
                  <casper-select
                    value="{{filter.value}}"
                    items="[[filter.options]]"
                    on-value-changed="_updateActiveFilters"
                    label="[[filter.inputOptions.placeholder]]">
                  </casper-select>
                </template>

                <!--Paper-Input filter-->
                <template is="dom-if" if="[[_isFilterPaperInput(filter.type)]]">
                  <paper-input
                    value="{{filter.value}}"
                    on-value-changed="_updateActiveFilters"
                    label="[[filter.inputOptions.placeholder]]">
                  </paper-input>
                </template>
              </template>
            </div>
          </div>

          <div class="grid-multiple-selection-container" hidden$="[[!_hasSelectedItems]]">
            <div class="grid-multiple-selection-label">
              Selecção Múltipla:&nbsp;<strong>[[selectedItems.length]]&nbsp;[[multiSelectionLabel]]</strong>
            </div>
            <div>
              <slot name="multiple-selected-actions"></slot>
            </div>
          </div>

          <!--Vaadin grid container-->
          <div class="grid-container">
            <vaadin-grid
              id="grid"
              class="moac"
              theme="row-stripes"
              loading="{{_loading}}"
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

  static get sortByAscending () { return 'asc'; }
  static get sortByDescending () { return 'desc'; }

  _isFilterPaperInput (itemType) { return itemType === CasperMoac.filterTypes.PAPER_INPUT; }
  _isFilterCasperSelect (itemType) { return itemType === CasperMoac.filterTypes.CASPER_SELECT; }

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
    this.$.filterInput.addEventListener('keyup', () => this._filterChanged());
    this.addEventListener('mousemove', event => this.app.tooltip.mouseMoveToolip(event));
  }

  _filterChanged () {
    this._filterChangedDebouncer = Debouncer.debounce(
      this._filterChangedDebouncer,
      timeOut.after(this.resourceFilterDebounceMs),
      () => {
        this.lazyLoad ? this._filterItemsLazyLoad() : this._filterItems();
      }
    );
  }

  _updateActiveFilters () {
    this._updateActiveFiltersDebouncer = Debouncer.debounce(
      this._updateActiveFiltersDebouncer,
      timeOut.after(500),
      () => { this.$.activeFilters.render(); }
    );
  }

  _filterItems () {
    if (!this.$.filterInput.value) {
      this._filteredItems = this.items;
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

  _selectedItemsChanged () {
    this._hasSelectedItems = this.selectedItems && this.selectedItems.length > 0;
  }

  _filterHasValue (filter) {
    return !!filter.value;
  }

  _filterValue (filter) {
    switch (filter.type) {
      case CasperMoac.filterTypes.PAPER_INPUT:
        return filter.value;
      case CasperMoac.filterTypes.CASPER_SELECT:
        return filter.options.find(option => option.id.toString() === filter.value.toString()).name;
    }
  }

  _toggleDisplayAllFilters () {
    this._displayAllFilters = !this._displayAllFilters;
  }
}

customElements.define(CasperMoac.is, CasperMoac);