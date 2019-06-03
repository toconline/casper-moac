import { CasperMoacLazyLoadMixin } from './casper-moac-lazy-load-mixin.js';
import '@casper2020/casper-icons/casper-icons.js';
import '@casper2020/casper-epaper/casper-epaper.js';
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

export class CasperMoac extends CasperMoacLazyLoadMixin(PolymerElement) {

  static get is () {
    return 'casper-moac';
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
          margin: 0;
          width: 100%;
          font-size: 0.85em;
          font-weight: bold;
          text-transform: unset;
          color: var(--primary-color);
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

        .left-side-container .grid-container paper-spinner:not(active) {
          width: 0;
          height: 0;
        }

        .right-side-container .right-slot-container {
          padding: 10px;
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

          <div class="grid-multiple-selection-container" hidden$="[[!_hasSelectedItems]]">
            <div class="grid-multiple-selection-label">
              <vaadin-checkbox indeterminate id="deselectAllItems"></vaadin-checkbox>
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
            <!--Spinner displayed when loading elements-->
            <paper-spinner active$="[[_loading]]"></paper-spinner>
          </div>
        </div>
        <div class="right-side-container">
          <div class="right-slot-container">
            <slot name="right"></slot>
          </div>
          <casper-epaper id="epaper" app="[[app]]"></casper-epaper>
        </div>
      </vaadin-split-layout>
    `;
  }

  static get sortByAscending () { return 'asc'; }
  static get sortByDescending () { return 'desc'; }

  ready () {
    super.ready();

    this.epaper = this.$.epaper;

    // Either provide the Vaadin Grid the lazy load function or manually trigger the filter function.
    this.lazyLoad
      ? this._initializeLazyLoad()
      : afterNextRender(this, () => this._filterItems());

    // Set event listeners.
    this.$.filterInput.addEventListener('keyup', () => this._filterChanged());
    this.$.deselectAllItems.addEventListener('change', () => this._deselectAllItems());
    this.addEventListener('mousemove', event => this.app.tooltip.mouseMoveToolip(event));
  }

  _filterChanged () {
    this._filterChangedDebouncer = Debouncer.debounce(
      this._filterChangedDebouncer,
      timeOut.after(this.resourceFilterDebounceMs),
      () => {
        this.lazyLoad
          ? this._filterItemsLazyLoad()
          : this._filterItems();
      }
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

  _deselectAllItems () {
    this.selectedItems = [];
    this.$.deselectAllItems.setAttribute('indeterminate', '');
  }
}

customElements.define(CasperMoac.is, CasperMoac);