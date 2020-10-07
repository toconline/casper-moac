import '@vaadin/vaadin-grid/vaadin-grid.js';
import '@vaadin/vaadin-grid/vaadin-grid-column.js';
import '@vaadin/vaadin-grid/vaadin-grid-selection-column.js';
import '@vaadin/vaadin-split-layout/vaadin-split-layout.js';
import '@cloudware-casper/casper-icons/casper-icon.js';
import '@cloudware-casper/casper-epaper/casper-epaper.js';
import '@cloudware-casper/casper-select/casper-select.js';
import '@cloudware-casper/casper-date-range/casper-date-range.js';
import '@cloudware-casper/casper-date-picker/casper-date-picker.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { templatize } from '@polymer/polymer/lib/utils/templatize.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

import './sidebar/casper-moac-sidebar.js';
import './sidebar/casper-moac-sidebar-item.js';
import './components/casper-moac-active-filter.js';
import { CasperMoacProperties } from './casper-moac-properties.js';
import { CasperMoacGridMixin } from './mixins/casper-moac-grid-mixin.js';
import { CasperMoacStylesMixin } from './mixins/casper-moac-styles-mixin.js';
import { CasperMoacSortingMixin } from './mixins/casper-moac-sorting-mixin.js';
import { CasperMoacFiltersMixin } from './mixins/casper-moac-filters-mixin.js';
import { CasperMoacHistoryMixin } from './mixins/casper-moac-history-mixin.js';
import { CasperMoacLazyLoadMixin } from './mixins/casper-moac-lazy-load-mixin.js';
import { CasperMoacContextMenuMixin } from './mixins/casper-moac-context-menu-mixin.js';
import { CasperMoacLocalStorageMixin } from './mixins/casper-moac-local-storage-mixin.js';
import { CasperMoacFilterTypes, CasperMoacOperators } from './casper-moac-constants.js';

export class CasperMoac extends CasperMoacLazyLoadMixin(
  CasperMoacGridMixin(
    CasperMoacProperties(
      CasperMoacStylesMixin(
        CasperMoacFiltersMixin(
          CasperMoacSortingMixin(
            CasperMoacContextMenuMixin(
              CasperMoacLocalStorageMixin(
                CasperMoacHistoryMixin(PolymerElement))))))))) {

  static get observers () {
    return [
      '__gridSelectedItemsChanged(__selectedItems.splices)'
    ];
  }

  static get template () {
    return html`
      ${this.__styles()}

      <slot name="context-menu"></slot>
      <slot name="grid-custom-styles"></slot>

      <div class="main-container">
        <vaadin-split-layout id="splitLayout">
          <div class="left-side-container" style="[[__leftSideStyling()]]">
            <div class="header-container">
              <div class="header-left-side-container">
                <!--Casper-moac-menu-->
                <slot name="menu"></slot>
                <div class="generic-filter-container">
                  <!--Generic Filter input-->
                  <input placeholder="[[filterInputPlaceholder]]" id="filterInput" />
                  <casper-icon id="filterInputIcon" on-click="__clearFilterInput"></casper-icon>

                  <!--Show/hide the active filters-->
                  <template is="dom-if" if="[[__hasFilters]]">
                    <paper-button id="displayAllFilters" on-click="__toggleDisplayAllFilters">
                      <span>Ver todos os filtros</span>
                      <casper-icon icon="fa-regular:angle-down"></casper-icon>
                    </paper-button>
                  </template>
                </div>
              </div>

              <!--Active filters-->
              <div class="active-filters">
                <div class="header">
                  <div class="header-title">
                    <!--Stale dataset icon-->
                    <template is="dom-if" if="[[__staleDataset]]">
                      <casper-icon
                        on-click="refreshItems"
                        icon="fa-regular:sync"
                        tooltip="Os dados poderão estar desactualizados. Clique aqui para recarregar a grelha">
                      </casper-icon>
                    </template>

                    <!--Reset filters button-->
                    <template is="dom-if" if="[[__displayResetFiltersButton]]">
                      <casper-icon-button
                        reverse
                        text="Repor filtros"
                        icon="fa-light:times"
                        on-click="__resetFilters"></casper-icon-button>
                    </template>

                    <template is="dom-if" if="[[!__displayResetFiltersButton]]">
                      <strong>Filtros ativos:</strong>
                    </template>
                  </div>

                  <template is="dom-if" if="[[!hideNumberResults]]">
                    [[__numberOfResults]]
                  </template>
                </div>
                <div class="active-filters-list" id="activeFilters"></div>
              </div>
            </div>

            <div hidden$="[[!__displayAllFilters]]">
              <div class="filters-container">
                <template is="dom-repeat" items="[[__filters]]" restamp>
                  <div class$="[[__filterContainerClassName(item.filter)]]">
                    <!--Casper-Select filter-->
                    <template is="dom-if" if="[[__isFilterCasperSelectOrComponentless(item.filter.type)]]">
                      <casper-select
                        data-filter$="[[item.filterKey]]"
                        list-height="50vh"
                        fixed-container-width
                        value="{{item.filter.value}}"
                        items="[[item.filter.inputOptions.items]]"
                        label="[[item.filter.inputOptions.label]]"
                        template="[[item.filter.inputOptions.template]]"
                        disable-clear$="[[item.filter.inputOptions.disableClear]]"
                        multi-selection$="[[item.filter.inputOptions.multiSelection]]"
                        lazy-load-resource="[[item.filter.inputOptions.lazyLoadResource]]"
                        lazy-load-callback="[[item.filter.inputOptions.lazyLoadCallback]]"
                        lazy-load-filter-fields="[[item.filter.inputOptions.lazyLoadFilterFields]]"
                        delay-lazy-load="[[item.filter.inputOptions.delayLazyLoad]]">
                      </casper-select>
                    </template>

                    <!--Paper-Input or componentless filter-->
                    <template is="dom-if" if="[[__isFilterPaperInput(item.filter.type)]]">
                      <paper-input
                        data-filter$="[[item.filterKey]]"
                        value="{{item.filter.value}}"
                        label="[[item.filter.inputOptions.label]]">
                      </paper-input>
                    </template>

                    <!--Casper-Date-Range filter-->
                    <template is="dom-if" if="[[__isFilterCasperDateRange(item.filter.type)]]">
                      <casper-date-range
                        data-filter$="[[item.filterKey]]"
                        value="{{item.filter.value}}"
                        end-date-required="[[__dateRangeFieldsNotRequired]]"
                        start-date-required="[[__dateRangeFieldsNotRequired]]"
                        end-date-placeholder="[[item.filter.inputOptions.endDatePlaceholder]]"
                        start-date-placeholder="[[item.filter.inputOptions.startDatePlaceholder]]">
                      </casper-date-range>
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

            <!--Active sorters container-->
            <template is="dom-if" if="[[__hasActiveSorters]]">
              <div id="active-sorters-container">
                <strong>Itens ordenados por:</strong>
                <template is="dom-repeat" items="[[__activeSorters]]" as="activeSorter">
                  <casper-icon-button
                    reverse
                    icon="fa-light:times"
                    text="[[activeSorter.header]]"
                    on-click="__removeActiveSorter"
                    data-path$="[[activeSorter.path]]"></casper-icon-button>
                </template>
              </div>
            </template>

            <!--Multi-selection container-->
            <div id="multi-selection-container">
              <div class="grid-multiple-selection">
                <div class="grid-multiple-selection-label">
                  Seleção múltipla:&nbsp;<strong>[[selectedItems.length]]&nbsp;[[multiSelectionLabel]]</strong>
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
                items="[[displayedItems]]"
                active-item="{{activeItem}}"
                selected-items="{{__selectedItems}}"
                item-id-path="[[idInternalProperty]]">

                <slot name="grid-before"></slot>

                <template is="dom-if" if="[[!disableSelection]]">
                  <vaadin-grid-selection-column width="45px" flex-grow="0" frozen$="[[freezeSelectionColumn]]"></vaadin-grid-selection-column>
                </template>

                <slot name="grid"></slot>
              </vaadin-grid>

              <!--Context Menu-->
              <div id="floating-context-menu">
                <slot name="floating-context-menu-actions"></slot>
                <casper-icon on-click="__openContextMenu" icon="fa-regular:angle-down"></casper-icon>
              </div>

              <!--No items placeholder-->
              <template is="dom-if" if="[[__hasNoItems(displayedItems, loading)]]">
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
            <template is="dom-if" if="[[__hasEpaperComponent(hasEpaper, hasFlippingEpaper)]]">
              <div class="epaper-container">
                <slot name="right"></slot>
                <casper-epaper
                  app="[[app]]"
                  zoom="[[epaperZoom]]"
                  current-attachment="{{epaperCurrentAttachment}}"
                  sticky-maximum-height="[[epaperStickyMaximumHeight]]"
                  disable-sticky-animation="[[epaperDisableStickyAnimation]]">
                  <slot name="casper-epaper-tabs" slot="casper-epaper-tabs"></slot>
                  <slot name="casper-epaper-actions" slot="casper-epaper-actions"></slot>
                  <slot name="casper-epaper-line-menu" slot="casper-epaper-line-menu"></slot>
                  <slot name="casper-epaper-context-menu" slot="casper-epaper-context-menu"></slot>
                </casper-epaper>
              </div>
            </template>
          </div>
        </vaadin-split-layout>

        <!--Sidebar-->
        <slot name="sidebar"></slot>
      </div>
    `;
  }

  ready () {
    super.ready();

    this.grid = this.$.grid;
    this.gridScroller = this.$.grid.$.outerscroller;

    this.__leftSideContainer = this.shadowRoot.querySelector('.left-side-container');
    this.__rightSideContainer = this.shadowRoot.querySelector('.right-side-container');

    if (this.__hasEpaperComponent()) {
      // Save the epaper in a notifiable property so it can be used outside.
      afterNextRender(this, () => this.epaper = this.shadowRoot.querySelector('casper-epaper'));
    }

    // Either provide the Vaadin Grid the lazy load function or manually trigger the filter function.
    this.lazyLoad
      ? this.__initializeLazyLoad()
      : afterNextRender(this, () => this.__filterItems());

    this.addEventListener('mousemove', event => this.app.tooltip.mouseMoveToolip(event));
    this.__bindSorterEvents();
    this.__bindVaadinGridEvents();
    this.__bindSearchInputEvents();
    this.__bindContextMenuEvents();
    this.__bindVaadinSplitLayoutEvents();
    this.__stampGridCustomStylesTemplate();

    // Observe the multi selection container layout changes and resize if needed.
    if (typeof window.ResizeObserver === 'function') {
      const multiSelectionElement = this.shadowRoot.querySelector('.grid-multiple-selection');
      const multiSelectionElementObserver = new ResizeObserver(() => {
        if (this.selectedItems.length > 0) {
          this.__debounce('__multiSelectionResizeDebouncer', () => this.$['multi-selection-container'].style.height = `${multiSelectionElement.scrollHeight}px`);
        }
      });

      multiSelectionElementObserver.observe(multiSelectionElement);
    }
  }

  /**
   * This method, when the fipping epaper behavior is enabled, displays the epaper component.
   */
  displayEpaper () {
    if (!this.hasFlippingEpaper) return;

    this.__displayGridOrEpaper(this.__leftSideContainer, this.__rightSideContainer);
  }

  /**
   * This method, when the fipping epaper behavior is enabled, displays the grid component.
   */
  displayGrid () {
    if (!this.hasFlippingEpaper) return;

    this.__displayGridOrEpaper(this.__rightSideContainer, this.__leftSideContainer);
  }

  /**
   * This is a utility method which will hide or display the epaper and will hide or display the grid.
   *
   * @param {Object} elementToHide The element that will be hidden.
   * @param {Object} elementToDisplay The element that will be displayed.
   */
  __displayGridOrEpaper (elementToHide, elementToDisplay) {
    elementToHide.style.width = '0%';
    elementToHide.style.display = 'none';

    elementToDisplay.style.width = '100%';
    elementToDisplay.style.display = 'block';
  }

  /**
   * Adds manually a new item / list of items to the beginning of the existing ones ignoring
   * the currently applied filters.
   *
   * @param {Object | Array} itemsToAdd The item / list of items to be added to the current dataset.
   * @param {String | Number} afterItemId The item's identifier which we'll the append the new item(s) after.
   * @param {Boolean} staleDataset This flag will decide if the dataset will become stale or not.
   */
  addItem (itemsToAdd, afterItemId, staleDataset = true) {
    // Cast the object as an array to avoid ternaries when appending the new item(s).
    if (itemsToAdd.constructor.name === 'Object') itemsToAdd = [itemsToAdd];

    // Format the items we're adding.
    if (this.lazyLoad && this.resourceFormatter) {
      itemsToAdd.forEach(item => this.resourceFormatter.call(this.page || {}, item));
    }

    const rootItems = itemsToAdd.filter(itemToAdd => !this.__valueIsNotEmpty(itemToAdd[this.parentExternalProperty]));
    const childItems = itemsToAdd.filter(itemToAdd => this.__valueIsNotEmpty(itemToAdd[this.parentExternalProperty]));

    let displayedItems = this.displayedItems;
    displayedItems = this.__addRootItems(rootItems, displayedItems, afterItemId);
    displayedItems = this.__addChildItems(childItems, displayedItems);

    this.displayedItems = this.__addInternalIdentifierToItems(displayedItems);

    this.forceGridRedraw();
    this.__staleDataset = staleDataset;

    if (rootItems.length > 0) this.activeItem = rootItems[0];

    afterNextRender(this, () => this.scrollToItem(this.activeItem[this.idInternalProperty]));
  }

  /**
   * Updates manually the item / list of items provided by its id propery.
   *
   * @param {Object | Array} itemsToUpdate The item / list of items that will be updated.
   * @param {Boolean} staleDataset This flag will decide if the dataset will become stale or not.
   */
  updateItem (itemsToUpdate, staleDataset = true) {
    // Cast the object as an array to avoid ternaries when updating the item(s).
    if (itemsToUpdate.constructor.name !== 'Array') itemsToUpdate = [itemsToUpdate];

    const displayedItems = [...this.displayedItems];
    const selectedItems = [...this.__selectedItems];

    itemsToUpdate.forEach(itemToUpdate => {
      const updateItemCallback = (item, itemIndex, items) => {
        if (this.__compareItems(itemToUpdate, item, true)) {
          // Do not simply overwrite the object to avoid losing important internal properties set by this component.
          Object.keys(itemToUpdate).forEach(itemToUpdateProperty => {
            items[itemIndex][itemToUpdateProperty] = itemToUpdate[itemToUpdateProperty];
          });

          // Format the items we're updating.
          if (this.lazyLoad && this.resourceFormatter) {
            this.resourceFormatter.call(this.page || {}, items[itemIndex]);
          }
        }
      };

      selectedItems.forEach(updateItemCallback);
      displayedItems.forEach(updateItemCallback);

      // Make sure we keep the active item with the most up-to-date information.
      if (this.__compareItems(itemToUpdate, this.activeItem, true)) {
        Object.keys(itemToUpdate).forEach(itemToUpdateProperty => {
          this.activeItem[itemToUpdateProperty] = itemToUpdate[itemToUpdateProperty];
        });

        this.dispatchEvent(new CustomEvent('active-item-updated'));
      }
    });

    this.displayedItems = displayedItems;
    this.__selectedItems = selectedItems;

    this.forceGridRedraw();
    this.__staleDataset = staleDataset;

    afterNextRender(this, () => this.scrollToItem(this.activeItem[this.idInternalProperty]));
  }

  /**
   * Deletes manually the item provided by its id propery.
   *
   * @param {String | Number | Array} itemsToRemove The identifier to find the item that will be removed.
   */
  removeItem (itemsToRemove, staleDataset = true) {
    // Convert the parameter to an array of strings so it's easier afterwards.
    itemsToRemove = [itemsToRemove].flat().map(itemToRemove => String(itemToRemove));

    const itemIndices = itemsToRemove
      .map(itemToRemove => this.__findItemIndexById(itemToRemove, true))
      .filter(itemIndex => itemIndex !== -1);

    const itemIndex = Math.min(...itemIndices);
    if (itemIndex === Infinity) return;

    this.scrollToItem(this.displayedItems[itemIndex][this.idInternalProperty]);

    afterNextRender(this, () => {
      const blinkingRows = this.__getAllTableRows().filter(row => itemsToRemove.includes(String(row._item[this.idExternalProperty])));

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

        this.__staleDataset = staleDataset;
        this.displayedItems = this.displayedItems.filter(item => !itemsToRemove.includes(String(item[this.idExternalProperty])));
        this.__selectedItems = this.__selectedItems.filter(item => !itemsToRemove.includes(String(item[this.idExternalProperty])));
        this.displayedItems.length === 0
          ? this.activeItem = null
          : this.activeItem = this.displayedItems[Math.max(0, itemIndex - 1)];
      }, 1000);
    });
  }

  /**
   * This method forces the vaadin-grid to redraw all its rows.
   */
  forceGridRedraw () {
    this.$.grid.clearCache();
    this.__paintGridRows();
  }

  /**
   * This method will restamp the provided casper-selects used in the filters.
   */
  restampSelectTemplate (filters) {
    if (!filters) return;

    let selectElements = [];
    if (filters.constructor.name === 'String') {
      // Select a single casper-select element.
      selectElements = [this.shadowRoot.querySelector(`casper-select[data-filter="${filters}"]`)];
    } else if (filters.constructor.name === 'Array') {
      // Build a selector that contains all the casper-selects.
      selectElements = this.shadowRoot.querySelectorAll(filters.map(filter => `casper-select[data-filter="${filter}"]`).join(','));
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
   * This method expands a specific item.
   *
   * @param {Object} parentItem The object that will be expanded.
   */
  async expandItem (parentItem) {
    // If the item is already expanded, exit.
    if (this.expandedItems.some(expandedItem => this.__compareItems(expandedItem, parentItem, true))) return;

    // If the item can't be expanded, exit.
    this.__toggleColumns = this.__toggleColumns || [
      ...this.shadowRoot.querySelector('slot[name="grid-before"]').assignedElements().filter(element => element.nodeName.toLowerCase() === 'casper-moac-tree-toggle-column'),
      ...this.shadowRoot.querySelector('slot[name="grid"]').assignedElements().filter(element => element.nodeName.toLowerCase() === 'casper-moac-tree-toggle-column'),
    ];

    if (!this.__toggleColumns.some(toggleColumn => {
      return parentItem[toggleColumn.path]
        && parentItem[toggleColumn.path].constructor.name === 'Array'
        && parentItem[toggleColumn.path].length > 0;
    })) return;


    this.expandedItems = [...this.expandedItems, parentItem];
    const parentItemIndex = this.__findItemIndexById(parentItem[this.idInternalProperty]);

    // Either query the database or use the local property depending on the current type of grid.
    let parentItemChildren = !this.lazyLoad
      ? parentItem[this.childrenExternalProperty]
      : await this.__fetchChildrenResourceItems(parentItem);

    if (!parentItemChildren) return;

    // Safeguard for an empty response from the server or an empty local property.
    parentItemChildren = Array.isArray(parentItemChildren) ? parentItemChildren : [];
    parentItemChildren.forEach(child => {
      child[this.expandedInternalProperty] = false;
      child[this.parentInternalProperty] = parentItem[this.idExternalProperty];
      child[this.rowBackgroundColorInternalProperty] = 'var(--casper-moac-child-item-background-color)';
    });

    parentItem[this.expandedInternalProperty] = true;
    parentItem[this.rowBackgroundColorInternalProperty] = 'var(--casper-moac-parent-item-background-color)';

    this.displayedItems = this.__addInternalIdentifierToItems([
      ...this.displayedItems.slice(0, parentItemIndex),
      parentItem,
      ...parentItemChildren,
      ...this.displayedItems.slice(parentItemIndex + 1)
    ]);
  }

  /**
   * This method collapses a specific item.
   *
   * @param {Object} parentItem The object that will be collapsed.
   */
  collapseItem (parentItem) {
    // If the item is already collapsed, exit.
    if (!this.expandedItems.some(expandedItem => this.__compareItems(expandedItem, parentItem, true))) return;

    this.expandedItems = [...this.expandedItems.filter(expandedItem => !this.__compareItems(parentItem, expandedItem, true))];

    // Remove the row color from the parent and set the internal property to false.
    parentItem[this.expandedInternalProperty] = false;
    delete parentItem[this.rowBackgroundColorInternalProperty];

    this.displayedItems = this.__removeChildItemsRecursively(this.displayedItems, parentItem);
  }

  /**
   * This method appends new items who are at the root level.
   *
   * @param {Object | Array} itemsToAdd The item / list of items to be added to the current dataset.
   * @param {Array} displayedItems The currently filtered items.
   * @param {String | Number} afterItemId The item's identifier which we'll the append the new item(s) after.
   */
  __addRootItems (itemsToAdd, displayedItems, afterItemId) {
    if (itemsToAdd.length === 0) return displayedItems;

    if (!afterItemId) {
      return [...itemsToAdd, ...displayedItems];
    } else {
      const insertAfterIndex = this.__findItemIndexById(afterItemId, true);

      return [
        ...displayedItems.slice(0, insertAfterIndex + 1),
        ...itemsToAdd,
        ...displayedItems.slice(insertAfterIndex + 1)
      ];
    }
  }

  /**
   * This method appends new items who have parents if they are currently expanded.
   *
   * @param {Object | Array} itemsToAdd The item / list of items to be added to the current dataset.
   * @param {Array} displayedItems The currently displayed items.
   */
  __addChildItems (itemsToAdd, displayedItems) {
    const expandedItems = this.expandedItems.map(expandedItem => String(expandedItem[this.idExternalProperty]));
    if (itemsToAdd.lengh === 0 || expandedItems.length === 0) return displayedItems;

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

        const itemToAddParentIndex = this.__findItemIndexById(itemToAddParent, true, displayedItems);

        displayedItems = [
          ...displayedItems.slice(0, itemToAddParentIndex + 1),
          { ...itemToAdd },
          ...displayedItems.slice(itemToAddParentIndex + 1)
        ];
      });
    });

    return displayedItems;
  }

  /**
   * Scrolls to a specific item.
   *
   * @param {Number | String} itemId The identifer of the item that should be scrolled to.
   */
  scrollToItem (itemId, useExternalProperty = false) {
    this.$.grid.scrollToIndex(this.__findItemIndexById(itemId, useExternalProperty));
  }

  /**
   * This method checks if a specific row is totally visible or not.
   *
   * @param {Element} row The row we're trying to figure out if it's in view or not.
   */
  __isRowTotallyInView (row) {
    const rowBoundingRect = row.getBoundingClientRect();
    const gridBoundingRect = this.shadowRoot.querySelector('.grid-container').getBoundingClientRect();
    const gridHeaderBoundingRect = this.$.grid.shadowRoot.querySelector('thead').getBoundingClientRect();

    return parseInt(rowBoundingRect.bottom) <= parseInt(gridBoundingRect.bottom) &&
      parseInt(rowBoundingRect.top) >= parseInt(gridBoundingRect.top + gridHeaderBoundingRect.height);
  }

  __isFilterPaperInput (itemType) { return itemType === CasperMoacFilterTypes.PAPER_INPUT; }
  __isFilterPaperCheckbox (itemType) { return itemType === CasperMoacFilterTypes.PAPER_CHECKBOX; }
  __isFilterCasperDateRange (itemType) { return itemType === CasperMoacFilterTypes.CASPER_DATE_RANGE; }
  __isFilterCasperDatePicker (itemType) { return itemType === CasperMoacFilterTypes.CASPER_DATE_PICKER; }
  __isFilterCasperSelectOrComponentless (itemType) { return [CasperMoacFilterTypes.CASPER_SELECT, CasperMoacFilterTypes.COMPONENTLESS_FILTER].includes(itemType); }

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
   * This method is called when the user presses the times icon that sits inside the filter input.
   */
  __clearFilterInput () {
    this.$.filterInput.value = '';

    this.__freeFilterChanged();
    this.__updateFilterInputStyles();
  }

  /**
   * This method either applies or removes the border and background color styling to the filter input.
   *
   * @param {Boolean} applyStyles When this parameter is sets to true, apply the border and background color.
   */
  __updateFilterInputStyles (applyStyles) {
    if (applyStyles) {
      this.$.filterInput.style.border = '1px solid var(--primary-color)';
      this.$.filterInput.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.1)';
    } else {
      this.$.filterInput.style.border = '';
      this.$.filterInput.style.backgroundColor = '';
    }
  }

  /**
   * Bind event listeners to the generic search input.
   */
  __bindSearchInputEvents () {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has(this.freeFilterUrlParameterName)) {
      this.$.filterInput.value = this.freeFilterValue = searchParams.get(this.freeFilterUrlParameterName);
      this.$.filterInputIcon.icon = 'fa-regular:times';
      this.__updateFilterInputStyles(true);
    } else {
      this.$.filterInputIcon.icon = 'fa-regular:search';
    }

    this.$.filterInput.addEventListener('keyup', () => this.__freeFilterChanged());
    this.$.filterInput.addEventListener('focus', () => { this.__updateFilterInputStyles(true); });
    this.$.filterInput.addEventListener('blur', () => { this.__updateFilterInputStyles(!!this.$.filterInput.value.trim()); });
  }

  /**
   * Adds the necessary event listeners to the split layout component.
   */
  __bindVaadinSplitLayoutEvents () {
    if (!this.hasEpaper) this.$.splitLayout.$.splitter.style.display = 'none';

    this.$.splitLayout.addEventListener('splitter-dragend', () => {
      const headerContainer = this.shadowRoot.querySelector('.header-container');

      afterNextRender(this, () => {
        headerContainer.offsetWidth < 600
          ? headerContainer.classList.add('header-container--responsive')
          : headerContainer.classList.remove('header-container--responsive');
      });
    });

    // Fire the initial event to make sure the header container is aligned correctly from the get-go.
    this.$.splitLayout.dispatchEvent(new CustomEvent('splitter-dragend'));
  }

  /**
   * This method hides the children, grandchildren, etc from a specific parent item.
   *
   * @param {Array} items The list of items from where the items will be removed.
   * @param {Object} parentItem The parent item which will be collapsed.
   */
  __removeChildItemsRecursively (items, parentItem) {
    const itemsToRemove = [parentItem];

    // Replace the parent as well to change its internal properties.
    items = items.map(item => item[this.idInternalProperty] === parentItem[this.idInternalProperty] ? parentItem : item);

    while (itemsToRemove.length > 0) {
      const parentItem = itemsToRemove.shift();

      items = items.filter(item => {
        if (String(item[this.parentInternalProperty]) === String(parentItem[this.idExternalProperty])) {
          itemsToRemove.push(item);
          return false;
        }

        return true;
      });
    }

    return items;
  }

  /**
   * Observer that gets called when the vaadin-grid activeItem changes.
   *
   * @param {Object} newActiveItem The new vaadin-grid activeItem.
   * @param {Object} previousActiveItem The previous vaadin-grid activeItem.
   */
  __activeItemChanged (newActiveItem, previousActiveItem) {
    if (!newActiveItem && previousActiveItem && this.displayedItems && this.displayedItems.length > 0) {
      this.activeItem = previousActiveItem;
    }

    // Clean the epaper when there is no active item and the developer didn't disable this behavior.
    if (!this.activeItem && this.epaper && !this.disableResetEpaper) {
      this.epaper.openBlankPage();
    }

    // This is used to avoid conflicts between arrow and click events.
    this.__scheduleActiveItem = this.__activeItem = { ...this.activeItem };
    this.__paintGridRows();
  }

  /**
   * Observer that fires as soon as the items change. This will invoke the internal __filterItems method to display
   * the new items on the vaadin-grid.
   */
  __itemsChanged () {
    // Check if the new items are an array or otherwise, exit early.
    if (!this.items || this.items.constructor !== Array) {
      return console.warn('The items property should be an array and instead the component received this -', this.items);
    }

    this.__filterItems();
  }


  /**
   * Observer that fires when the vaadin-grid selected items change.
   */
  __gridSelectedItemsChanged () {
    this.__selectedItemsChangedInternally = true;
    this.selectedItems = [...this.__selectedItems];
    this.__selectedItemsChangedInternally = false;
  }

  /**
   * Observer that fires when the selectedItems property changes.
   */
  __selectedItemsChanged () {
    if (this.shadowRoot.querySelector('slot[name="multi-selection"]').assignedElements().length === 0) return;

    if (!this.selectedItems || this.selectedItems.length === 0) {
      this.$.grid.style.borderTopLeftRadius = '5px';
      this.$.grid.style.borderTopRightRadius = '5px';
      this.$['multi-selection-container'].style.height = '';
    } else {
      this.$.grid.style.borderTopLeftRadius = '';
      this.$.grid.style.borderTopRightRadius = '';
      this.$['multi-selection-container'].style.height = `${this.$['multi-selection-container'].firstElementChild.scrollHeight}px`;
    }

    if (!this.__selectAllCheckbox) return;

    const selectableItems = this.__selectableItems();

    // Lock the vaadin-checkbox event handler to avoid infinite loops.
    this.__selectAllCheckboxLock = true;
    this.__selectAllCheckbox.checked = this.selectedItems.length > 0 && selectableItems.length === this.selectedItems.length;
    this.__selectAllCheckbox.indeterminate = this.selectedItems.length > 0 && selectableItems.length !== this.selectedItems.length;
    this.__selectAllCheckboxLock = false;

    // Check if this method was invoked by the vaadin-grid or from the page using this component.
    if (this.__selectedItemsChangedInternally) return;

    // Fetch the internal representation of the items since they contain the field that the vaadin-grid uses as an identifier.
    this.$.grid.selectedItems = this.selectedItems.map(selectedItem => {
      return this.displayedItems[this.__findItemIndexById(selectedItem[this.idExternalProperty], true)];
    });
  }

  /**
   * This method filters the existing items with the search input's value taking into account the list of attributes
   * provided for that effect. If none were specified, every single attribute will be used for comparison purposes.
   */
  __filterItems () {
    this.activeItem = null;
    this.__selectedItems = [];

    // Use spread operator to avoid messing with the original dataset by sorting.
    let originalItems = [...(this.items || [])];
    let displayedItems = [...(this.items || [])];

    if (this.$.filterInput.value.trim() && originalItems.length > 0) {
      // Either retrieve the list of filter attributes from the properties or from the first item's existing keys.
      let filterAttributes = this.resourceFilterAttributes;
      if (!filterAttributes) filterAttributes = Object.keys(originalItems[0]);

      if (filterAttributes) {
        const filterTerm = this.__normalizeVariable(this.$.filterInput.value);

        displayedItems = originalItems.filter(item => filterAttributes.some(filterAttribute => {
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

    this.displayedItems = this.__addInternalIdentifierToItems(this.__sortItems(displayedItems));
    this.forceGridRedraw();
    this.__activateItem();
    this.__numberOfResults = displayedItems.length === originalItems.length
      ? `${displayedItems.length} ${this.multiSelectionLabel}`
      : `${displayedItems.length} de ${this.items.length} ${this.multiSelectionLabel}`;
  }

  /**
   * This method activates the item that is present in the specified index.
   */
  __activateItem () {
    let itemIndex = 0;
    if (this.__activateItemId) {
      itemIndex = this.__findItemIndexById(this.__activateItemId, true);
      this.scrollToItem(this.__activateItemId, true);
      this.__activateItemId = undefined;
    }

    this.displayedItems && this.displayedItems.length > itemIndex
      ? this.activeItem = this.displayedItems[itemIndex]
      : this.activeItem = null;
  }

  /**
   * This method returns the DOM object that represents the casper-select, paper-input, etc, for a specific filter.
   *
   * @param {String} key The filter's unique identifier.
   */
  __getFilterComponent (key) {
    switch (this.filters[key].type) {
      case CasperMoacFilterTypes.PAPER_INPUT:
        return this.shadowRoot.querySelector(`paper-input[data-filter="${key}"]`);
      case CasperMoacFilterTypes.CASPER_SELECT:
      case CasperMoacFilterTypes.COMPONENTLESS_FILTER:
        return this.shadowRoot.querySelector(`casper-select[data-filter="${key}"]`);
      case CasperMoacFilterTypes.PAPER_CHECKBOX:
        return this.shadowRoot.querySelector(`paper-checkbox[data-filter="${key}"]`);
      case CasperMoacFilterTypes.CASPER_DATE_RANGE:
        return this.shadowRoot.querySelector(`casper-date-range[data-filter="${key}"]`);
      case CasperMoacFilterTypes.CASPER_DATE_PICKER:
        return this.shadowRoot.querySelector(`casper-date-picker[data-filter="${key}"]`);
    }
  }

  /**
   * This method checks if the filter's value is be empty since zeroes in some occasions
   * might be used as actual values and they should not be disregarded.
   *
   * @param {Object} value The value we're checking.
   */
  __valueIsNotEmpty (value) {
    const emptyValues = [null, undefined, false, ''];

    // This checks if the value is an array and contains any element.
    if (value && value.constructor.name === 'Array') return value.length > 0;
    if (value && value.constructor.name === 'Object') return Object.keys(value).some(key => !emptyValues.includes(key));

    return ![null, undefined, false, ''].includes(value);
  }

  /**
   * This method is invoked when the grid is either clicked or scrolled and ensures the correct active
   * row has a different background color. This is required for scroll as well since the vaadin-grid re-uses
   * its rows and having this into account, the id property is used to avoid highlighting the wrong row.
   */
  __paintGridRows () {
    afterNextRender(this, () => {
      this.__paintFloatingContextMenu();

      this.__getAllTableRows().forEach(row => {
        const currentRowItem = this.displayedItems.find(item => this.__compareItems(row._item, item));

        if (!currentRowItem || row.hasAttribute('blink')) return;

        const rowBackgroundColor = this.__getRowBackgroundColor(currentRowItem);
        Array.from(row.children).forEach(cell => {
          cell.style.backgroundImage = 'none';
          cell.style.backgroundColor = rowBackgroundColor;

          const cellContents = cell.firstElementChild.assignedElements().shift();

          // Remove the vaadin-checkbox element if this items does not support selection.
          if (!this.disableSelection && cellContents) {
            const vaadinCheckbox = cellContents.querySelector('vaadin-checkbox');
            if (vaadinCheckbox) {
              if (!currentRowItem[this.disableSelectionInternalProperty]) {
                vaadinCheckbox.disabled = false;
                vaadinCheckbox.style.display = '';
              } else {
                vaadinCheckbox.disabled = true;
                vaadinCheckbox.style.display = 'none';
              }
            }
          }
        });
      });
    });
  }

  /**
   * This method returns the row background color taking into account the item associated with it.
   *
   * @param {Object} item The current item whose row background color we want to know.
   */
  __getRowBackgroundColor (item) {
    // This means the row is currently active.
    if (this.__activeItem && this.__compareItems(item, this.__activeItem)) {
      return 'var(--light-primary-color)';
    }

    // This means the row has a specific color.
    if (!!item[this.rowBackgroundColorInternalProperty]) {
      return item[this.rowBackgroundColorInternalProperty];
    }

    // The fallback scenario is to apply white or the striped colors.
    return this.disableRowStripes || item[this.idInternalProperty] % 2 === 0 ? 'white' : 'var(--casper-moac-row-stripe-color)';
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
   *
   * @param {Object} event The event's object.
   */
  __toggleDisplayAllFilters (event) {
    const paperButton = this.__eventPathContainsNode(event, 'paper-button');

    this.__displayAllFilters = !this.__displayAllFilters;
    !this.__displayAllFilters
      ? paperButton.style.backgroundColor = ''
      : paperButton.style.backgroundColor = 'rgba(var(--primary-color-rgb), 0.2)';
  }

  /**
   * This method fires when a context menu icon is pressed on a specific row. The context menu will have to be moved around
   * so that it appears aligned with the icon that triggered the event in the first place.
   *
   * @param {Event} event
   */
  __openContextMenu (event) {
    this.__contextMenu.positionTarget = event.target;
    this.__contextMenu.positionTarget.style.display = 'block';
    this.__contextMenu.refit();
    this.__contextMenu.open();
  }

  /**
   * This method is invoked directly in the template so that the vaadin-split-layout has the
   * correct percentual width for the left side of the component.
   */
  __leftSideStyling () {
    const width = !this.hasEpaper ? 'width: 100%' : `width: ${this.leftSideInitialWidth}%`;
    const maximumWidth = this.leftSideMaximumWidth ? `max-width: ${this.leftSideMaximumWidth}%` : null;
    const minimumWidth = this.leftSideMinimumWidth ? `min-width: ${this.leftSideMinimumWidth}%` : null;

    return [width, maximumWidth, minimumWidth].filter(cssRule => !!cssRule).join(';');
  }

  /**
   * This method is invoked directly in the template so that the vaadin-split-layout has the
   * correct percentual width for the right side of the component.
   */
  __rightSideStyling () {
    return !this.hasEpaper
      ? 'width: 0%;'
      : `width: ${100 - parseInt(this.leftSideInitialWidth)}%;`;
  }

  /**
   * This method allows filters to span over two columns instead of the default one and also allows for hidden filters.
   *
   * @param {Object} filter The filter's obejct.
   */
  __filterContainerClassName (filter) {
    if (filter.type === CasperMoacFilterTypes.COMPONENTLESS_FILTER) return 'filter-container-invisible';

    return filter.type !== CasperMoacFilterTypes.CASPER_DATE_RANGE
      ? 'filter-container'
      : 'filter-container filter-container--double-width';
  }

  /**
   * This method is invoked when the _filteredItem property changes and either hides or displays the
   * vaadin-grid no items placeholder.
   *
   * @param {Array} displayedItems The currently displayed items.
   * @param {Boolean} loading Flag that states if the grid is currently loading.
   */
  __hasNoItems (displayedItems, loading) {
    return !loading && displayedItems && displayedItems.length === 0;
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
   * @param {Number} debounceMilliseconds Number of milliseconds after the last invoke that will trigger the callback.
   */
  __debounce (debouncerProperty, callback, debounceMilliseconds = 250) {
    this[debouncerProperty] = Debouncer.debounce(
      this[debouncerProperty],
      timeOut.after(debounceMilliseconds),
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
   * This method sets the internal identifer key required for some actions like painting the active row for instance.
   *
   * @param {Array} newItems The list of items that will be patched with the identifier.
   */
  __addInternalIdentifierToItems (newItems) {
    return newItems.map((newItem, newItemIndex) => {
      newItem[this.idInternalProperty] = newItemIndex;
      return newItem;
    });
  }

  /**
   * Look for the index of a specific item based on the internal / external identifier property.
   *
   * @param {Number | String} itemId The item's identifier that we'll looking for.
   * @param {Boolean} useExternalProperty This flag states which identifier should be used.
   * @param {Array} items When this parameter is present use it to search the item instead of the displayedItems.
   */
  __findItemIndexById (itemId, useExternalProperty = false, items) {
    return useExternalProperty
      ? (items || this.displayedItems).findIndex(item => String(item[this.idExternalProperty]) === String(itemId))
      : (items || this.displayedItems).findIndex(item => String(item[this.idInternalProperty]) === String(itemId));
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
   * @param {Object} item The item which internal / external identifier will be used for comparison.
   * @param {String | Number} itemId The item's identifier that we'll be used for comparison.
   * @param {Boolean} useExternalProperty This flag states which identifier should be used - internal ou external.
   */
  __compareItemWithId (item, itemId, useExternalProperty = false) {
    return useExternalProperty
      ? String(item[this.idExternalProperty]) === String(itemId)
      : String(item[this.idInternalProperty]) === String(itemId);
  }

  /**
   *
   * @param {Object} item The item which internal / external identifier will be used for comparison.
   * @param {String | Number} itemIds The items identifiers that we'll be used for comparison.
   * @param {Boolean} useExternalProperty This flag states which identifier should be used - internal ou external.
   */
  __compareItemWithIds (item, itemIds, useExternalProperty = false) {
    return useExternalProperty
      ? itemIds.map(itemId => String(itemId)).includes(String(item[this.idExternalProperty]))
      : itemIds.map(itemId => String(itemId)).includes(String(item[this.idInternalProperty]));
  }

  /**
   * This method returns all the items that can be selected since one can disable the selection per item.
   */
  __selectableItems () {
    return this.displayedItems.filter(displayedItem => !displayedItem[this.disableSelectionInternalProperty]);
  }

  /**
   * This method checks if there should be an epaper component or not.
   */
  __hasEpaperComponent () {
    return this.hasEpaper || this.hasFlippingEpaper;
  }
}

window.window.customElements.define('casper-moac', CasperMoac);