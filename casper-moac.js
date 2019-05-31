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

export class CasperMoac extends CasperMoacLazyLoadMixin(PolymerElement) {

  static get is () {
    return 'casper-moac';
  }

  static get properties () {
    return {
      /**
       * The placeholder used in the input where the user can filter the results.
       * @type {String}
       */
      filterInputPlaceholder: {
        type: String,
        value: 'Filtrar Resultados'
      },
      /**
       * The actions that could be applied to several selected items.
       * @type {Array}
       */
      multiSelectionActions: {
        type: Array,
        value: []
      },
      /**
       * Flag used to activate the casper-moac's lazy load mode.
       * @type {Boolean}
       */
      lazyLoad: {
        type: Boolean,
        value: false
      }
    };
  }

  static get observers () {
    return [
      '_activeItemChanged(_activeItem)',
      '_gridSelectedItemsChanged(_gridSelectedItems.splices)'
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
          width: 35%;
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

        .left-side-container .grid-multiple-selection-container paper-icon-button {
          padding: 0;
          width: 25px;
          height: 25px;
          color: white;
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

          <div class="grid-multiple-selection-container" hidden$="[[!_hasSelectedItems]]">
            <div class="grid-multiple-selection-label">
              <vaadin-checkbox indeterminate id="deselectAllItems"></vaadin-checkbox>
              Selecção Múltipla:&nbsp;<strong>[[_gridSelectedItems.length]] documentos</strong>
            </div>
            <div>
              <template is="dom-repeat" items="[[multiSelectionActions]]">
                <paper-icon-button
                  icon="[[item.icon]]"
                  tooltip="[[item.tooltip]]"
                  data-index$="[[index]]"
                  on-click="_multipleSelectionActionClicked">
                </paper-icon-button>
              </template>
            </div>
          </div>

          <!--Vaadin grid container-->
          <div class="grid-container">
            <vaadin-grid
              id="grid"
              class="moac"
              page-size="[[pageSize]]"
              loading="{{_gridLoading}}"
              selected-items="{{_gridSelectedItems}}">
              <slot name="grid"></slot>
            </vaadin-grid>
            <!--Spinner displayed when loading elements-->
            <paper-spinner active$="[[_gridLoading]]"></paper-spinner>
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

    if (this.lazyLoad) this._initializeLazyLoad();

    // Set event listeners.
    this.$.filterInput.addEventListener('keyup', () => this._filterChanged());
    this.$.deselectAllItems.addEventListener('change', () => this._deselectAllItems());
    this.addEventListener('mousemove', event => this.app.tooltip.mouseMoveToolip(event));
  }

  _filterChanged () {
    this._filterChangedDebouncer = Debouncer.debounce(
      this._filterChangedDebouncer,
      timeOut.after(this.resourceFilterDebounceMs),
      () => this.$.grid.clearCache()
    );
  }

  _gridSelectedItemsChanged () {
    this._hasSelectedItems = 
      this._gridSelectedItems &&
      this._gridSelectedItems.length > 0 &&
      this.multiSelectionActions.length > 0;
  }

  _multipleSelectionActionClicked (event) {
    const actionIndex = parseInt(event.target.dataset.index);

    if (this.multiSelectionActions[actionIndex].onClick instanceof Function) {
      this.multiSelectionActions[actionIndex].onClick(this._gridSelectedItems);
    }
  }

  _deselectAllItems () {
    this._gridSelectedItems = [];
    this.$.deselectAllItems.setAttribute('indeterminate', '');
  }
}

customElements.define(CasperMoac.is, CasperMoac);