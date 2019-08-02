import { CasperMoacTypes, CasperMoacFilterTypes } from './casper-moac-constants.js';
import { CasperMoacLazyLoadMixin } from './casper-moac-lazy-load-mixin.js';

import '@casper2020/casper-icons/casper-icons.js';
import '@casper2020/casper-epaper/casper-epaper.js';
import '@casper2020/casper-select/casper-select.js';
import '@casper2020/casper-date-picker/casper-date-picker.js';
import '@vaadin/vaadin-grid/vaadin-grid.js';
import '@vaadin/vaadin-grid/vaadin-grid-column';
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
       * @type {String}
       */
      moacType: {
        type: String,
        value: CasperMoacTypes.GRID_EPAPER
      },
      /**
       * The identifier property that will be used when painting the active row.
       */
      idProperty: {
        type: String,
        value: 'id'
      },
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
       * A reference to the vaadin-grid so that the page using casper-moac can
       * use its methods.
       * @type {Object}
       */
      grid: {
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
        observer: '_activeItemChanged'
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
       * Stylesheet to be injected in order to style the vaadin-grid inner components.
       * @type {String}
       */
      stylesheet: {
        type: String,
        observer: '_stylesheetChanged'
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
          font-size: 0.85em;
          font-weight: bold;
          text-transform: unset;
          color: var(--primary-color);
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

        .left-side-container .grid-container vaadin-grid .context-menu-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          color: var(--primary-color);
        }

        .left-side-container .grid-container vaadin-grid .context-menu-icon:hover {
          color: white;
          cursor: pointer;
          background-color: var(--primary-color);
        }
      </style>

      <vaadin-split-layout id="splitLayout">
        <div class="left-side-container" style="[[_leftSideInitialWidth()]]">
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
              <template is="dom-if" if="[[_hasFilters]]">
                <paper-button id="displayAllFilters" on-click="_toggleDisplayAllFilters">
                  [[_displayOrHideFiltersButtonLabel(_displayAllFilters)]]
                </paper-button>
              </template>
            </div>
            <!--Active filters-->
            <template is="dom-if" if="[[_hasFilters]]">
              <div class="active-filters">
                <div class="header">
                  <strong>Filtros ativos:</strong>
                  <template is="dom-if" if="[[!hideNumberResults]]">
                    [[_numberOfResults]] resultado(s)
                  </template>
                </div>
                <div class="active-filters-list" id="activeFilters"></div>
              </div>
            </template>
          </div>

          <div hidden$="[[!_displayAllFilters]]">
            <div class$="[[_filtersContainerClassName()]]">
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
                      disable-clear$="[[item.filter.inputOptions.disableClear]]"
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

          <slot name="left"></slot>

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
              page-size="[[pageSize]]"
              items="[[_filteredItems]]"
              active-item="{{activeItem}}"
              selected-items="{{selectedItems}}">
              <!--vaadin-grid-column with the id property to make sure the correct active item is highlighted-->
              <vaadin-grid-column width="0px" flex-grow="0" path="[[idProperty]]"></vaadin-grid-column>

              <slot name="grid"></slot>

              <!--Context Menu-->
              <template is="dom-if" if="[[_displayContextMenu]]">
                <vaadin-grid-column flex-grow="0" width="40px">
                  <template>
                    <iron-icon
                      class="context-menu-icon"
                      on-click="_openContextMenu"
                      icon="casper-icons:arrow-drop-down">
                    </iron-icon>
                  </template>
                </vaadin-grid-column>
              </template>
            </vaadin-grid>
          </div>
        </div>

        <template is="dom-if" if="[[_displayEpaper]]">
          <div class="right-side-container" style="[[_rightSideInitialWidth()]]">
            <slot name="right"></slot>
            <casper-epaper id="epaper" app="[[app]]"></casper-epaper>
          </div>
        </template>
      </vaadin-split-layout>

      <slot name="context-menu"></slot>
    `;
  }

  _isFilterPaperInput (itemType) { return itemType === CasperMoacFilterTypes.PAPER_INPUT; }
  _isFilterCasperSelect (itemType) { return itemType === CasperMoacFilterTypes.CASPER_SELECT; }
  _isFilterCasperDatePicker (itemType) { return itemType === CasperMoacFilterTypes.CASPER_DATE_PICKER; }

  ready () {
    super.ready();

    this.grid           = this.$.grid;
    this._displayEpaper = this.moacType !== CasperMoacTypes.GRID;

    if (!this._displayEpaper) {
      // Hide the vaadin-split-layout handler.
      this.$.splitLayout.shadowRoot.getElementById('splitter').style.display = 'none';
    } else {
      // Save the epaper in a notifiable property so it can be used outside.
      afterNextRender(this, () => {
        this.epaper = this.shadowRoot.querySelector('casper-epaper');
      });
    }

    // Either provide the Vaadin Grid the lazy load function or manually trigger the filter function.
    this.lazyLoad
      ? this._initializeLazyLoad()
      : afterNextRender(this, () => this._filterItems());

    // Set event listeners.
    this.addEventListener('mousemove', event => this.app.tooltip.mouseMoveToolip(event));
    this.$.grid.addEventListener('click', () => this._paintGridActiveRow());
    this.$.grid.$.outerscroller.addEventListener('scroll', () => this._paintGridActiveRow());

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

          // If this is a lazy-loaded vaadin-grid, trigger the re-fetch of the resource.
          if (this.lazyLoad) this.filterLazyLoadItems();
      }));
    });

    // Check if there is a casper-context-menu.
    this._contextMenu = Array.from(this.children).find(child => child.getAttribute('slot') === 'context-menu');
    this._displayContextMenu = !!this._contextMenu;

    if (this._contextMenu) {
      this._contextMenu.addEventListener('iron-overlay-canceled', event => {
        // Do not close the overlay if the event was triggered by another context menu icon.
        const eventPathElement = event.detail.path.shift();
        if (eventPathElement.classList.contains('context-menu-icon') && this._lastContextMenuTarget !== eventPathElement) {
          event.preventDefault();
        }
      });
    }
  }

  /**
   * Debounce the items filtering after the search input's value changes.
   */
  _filterChanged () {
    this._filterChangedDebouncer = Debouncer.debounce(
      this._filterChangedDebouncer,
      timeOut.after(this.resourceFilterDebounceMs),
      () => { this.lazyLoad ? this.filterLazyLoadItems() : this._filterItems(); }
    );
  }

  /**
   * Observer that fires after the filters object change from the outside which
   * will cause a re-render of the active filters.
   * @param {Object} filters
   */
  _filtersChanged (filters) {
    if (!filters) return;

    this._hasFilters = !!this.filters;

    // Transform the filters object into an array to use in a dom-repeat.
    this._filters = Object.keys(filters).map(filterKey => ({
      filterKey: filterKey,
      filter: this.filters[filterKey]
    }));

    afterNextRender(this, () => this._renderActiveFilters());
  }

  /**
   * Force the vaadin-grid to always have an activeItem.
   * @param {Object} newActiveItem
   * @param {Object} previousActiveItem
   */
  _activeItemChanged (newActiveItem, previousActiveItem) {
    if (!newActiveItem && previousActiveItem) {
      this.$.grid.activeItem = previousActiveItem;
    }
  }

  /**
   * Observer that fires as soon as the items change. This will invoke the internal _filterItems method to display
   * the new items on the vaadin-grid.
   */
  _itemsChanged () {
    this._filterItems();
  }

  /**
   * Observer that fires when the vaadin-grid selected items change.
   */
  _selectedItemsChanged () {
    this._hasSelectedItems = this.selectedItems && this.selectedItems.length > 0;
  }

  /**
   * Observer that fires when the stylesheet property changes which will delete the previous
   * <style> tag and create a new one with the most recent styles.
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
  _filterItems () {
    // If the search input is empty or there are no items at the moment.
    if (!this.$.filterInput.value || !this.items) {
      this._filteredItems = this.items || [];
      this._updateNumberOfResultsAndActivateFirstItem();
      return;
    }

    // Either retrieve the list of filter attributes from the properties or from the item's existing keys.
    let filterAttributes = this.resourceFilterAttributes;
    if (!filterAttributes && this.items.length > 0) {
      filterAttributes = Object.keys(this.items[0]);
    }

    if (filterAttributes && this.items.length > 0) {
      const filterTerm = this._normalizeVariable(this.$.filterInput.value);

      this._filteredItems = this.items.filter(item => {
        return filterAttributes.some(filterAttribute => item[filterAttribute] && this._normalizeVariable(item[filterAttribute]).includes(filterTerm));
      });
      this._updateNumberOfResultsAndActivateFirstItem();
    }
  }

  /**
   * This method updates the UI with the current number of results and proceeds to select the first result
   * since this is invoked when the items change.
   */
  _updateNumberOfResultsAndActivateFirstItem () {
    this._numberOfResults = this._filteredItems.length;
    if (this._filteredItems.length > 0) {
      this.$.grid.activeItem = this._filteredItems[0];
      this._paintGridActiveRow();
    }
  }

  /**
   * Event listener which is fired when the user clicks on a filter's value in the summary. This will try to move
   * the filter's overlay for UX purposes (casper-select) or display all the filters focusing the correct one.
   * @param {Event} event
   */
  _displayInlineFilters (event) {
    const filterKey = event.target.dataset.filter
    const filter = this.filters[filterKey];

    switch (filter.type) {
      case CasperMoacFilterTypes.CASPER_SELECT:
        !filter.inputOptions.multiSelection
          ? this.shadowRoot.querySelector(`casper-select[data-filter="${filterKey}"]`).openDropdown(event.target)
          : this.shadowRoot.querySelector(`casper-select[data-filter="${filterKey}"]`).openDropdown(this.$.activeFilters);
        break;
      case CasperMoacFilterTypes.PAPER_INPUT:
        this._displayAllFilters = true;
        this.shadowRoot.querySelector(`paper-input[data-filter="${filterKey}"]`).focus();
        break;
      case CasperMoacFilterTypes.CASPER_DATE_PICKER:
        this._displayAllFilters = true;
        this.shadowRoot.querySelector(`casper-date-picker[data-filter="${filterKey}"]`).open();
        break;
    }
  }

  /**
   * This method is responsible for rendering the active filters summary and binding the event listeners that
   * will be reponsible for displaying the filter's input overlay when possible.
   */
  _renderActiveFilters () {
    this._activeFilters = this._activeFilters || this.shadowRoot.querySelector('#activeFilters');
    this._activeFilters.innerHTML = '';

    const activeFiltersValues = {};
    this._filters.forEach(filterItem => {
      const activeFilterValue = this._activeFilterValue(filterItem);
      if (this._valueIsNotEmpty(activeFilterValue)) {
        activeFiltersValues[filterItem.filterKey] = activeFilterValue;
      }
    });

    // This means that it wasn't possible obtain all the values from the filters components and therefore we schedule a new render.
    if (this._filters.filter(filterItem => this._valueIsNotEmpty(filterItem.filter.value)).length !== Object.keys(activeFiltersValues).length) {
      afterNextRender(this, () => this._renderActiveFilters());
      return;
    }

    this._filters.forEach(filterItem => {
      if (this._valueIsNotEmpty(filterItem.filter.value)) {
        const activeFilter = document.createElement('div');
        activeFilter.className = 'active-filter';

        const activeFilterLabel = document.createTextNode(`${filterItem.filter.label}: `);
        const activeFilterValue = document.createElement('strong');
        activeFilterValue.dataset.filter = filterItem.filterKey;
        activeFilterValue.innerHTML = activeFiltersValues[filterItem.filterKey];
        activeFilterValue.addEventListener('click', event => this._displayInlineFilters(event));

        activeFilter.appendChild(activeFilterLabel);
        activeFilter.appendChild(activeFilterValue);
        this._activeFilters.appendChild(activeFilter);
      }
    });

    if (!this._activeFilters.innerHTML) {
      const noActiveFiltersPlaceholder = document.createElement('span');
      noActiveFiltersPlaceholder.className = 'no-active-filters';
      noActiveFiltersPlaceholder.innerHTML = '(Não há filtros activos)';

      this._activeFilters.appendChild(noActiveFiltersPlaceholder);
    }
  }

  /**
   * This method checks if the filter value is be empty since zeroes in some occasions
   * might be used as actual values and they should not be disregarded.
   * @param {String | Number | Array | Object} value
   */
  _valueIsNotEmpty (value) {
    return ![null, undefined, ''].includes(value);
  }

  /**
   * Given a specific filter, this method is responsible for returning the human-readable version
   * of its current value.
   * @param {Object} filterItem
   */
  _activeFilterValue (filterItem) {
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
  _paintGridActiveRow () {
    const activeItemId = this.activeItem ? this.activeItem[this.idProperty].toString() : null;

    // Loop through each grid row and paint the active one.
    this.$.grid.shadowRoot.querySelectorAll('tr').forEach(row => {
      const isRowActive = row.firstChild.querySelector('slot').assignedElements().shift().innerHTML === activeItemId;

      row.firstChild.style.display = 'none';
      Array.from(row.children).forEach(rowCell => {
        rowCell.style.backgroundColor = isRowActive ? 'rgba(var(--primary-color-rgb), 0.2)' : '';
      });
    });
  }

  /**
   * In order to make searching items easier, every accented characters should be replaced with its
   * unaccented equivalent.
   * @param {String} variable
   */
  _normalizeVariable (variable) {
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
  _toggleDisplayAllFilters () {
    this._displayAllFilters = !this._displayAllFilters;
  }

  /**
   * The button below the search input will have a different message based on all filters being visible or not.
   */
  _displayOrHideFiltersButtonLabel () {
    return !this._displayAllFilters
      ? 'Ver todos os filtros'
      : 'Esconder todos os filtros';
  }

  /**
   * This method fires when a context menu icon is pressed on a specific row. The context menu will have to be moved around
   * so that it appears aligned with the icon that triggered the event in the first place.
   * @param {Event} event
   */
  _openContextMenu (event) {
    this._lastContextMenuTarget = this._contextMenu.positionTarget;
    this._contextMenu.positionTarget = event.target;
    this._contextMenu.refit();

    if (!this._contextMenu.opened) {
      this._contextMenu.open();
    }
  }

  /**
   * This method is invoked directly in the template so that the vaadin-split-layout has the
   * correct percentual width for the left side of the component.
   */
  _leftSideInitialWidth () {
    return this.moacType === CasperMoacTypes.GRID
      ? 'width: 100%;'
      : `width: ${this.leftSideInitialWidth}%;`;
  }

  /**
   * This method is invoked directly in the template so that the vaadin-split-layout has the
   * correct percentual width for the right side of the component.
   */
  _rightSideInitialWidth () {
    return `width: ${100 - parseInt(this.leftSideInitialWidth)}%;`;
  }

  /**
   * Depending on the current MOAC type, the active filters will be displayed differently by either
   * adding the 'filters-container-inline' class or not.
   */
  _filtersContainerClassName () {
    return this.moacType === CasperMoacTypes.GRID
      ? 'filters-container'
      : 'filters-container filters-container-inline';
  }
}

customElements.define(CasperMoac.is, CasperMoac);