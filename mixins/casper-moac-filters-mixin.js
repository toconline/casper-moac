import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

import { CasperMoacFilterTypes } from '../casper-moac-constants.js';

export const CasperMoacFiltersMixin = superClass => {
  return class extends superClass {

    /**
     * Adds a new filter to the list of existing ones.
     *
     * @param {String} filterKey The filter's identifier.
     * @param {Object} filter The filter's settings.
     */
    addFilter (filterKey, filter) {
      this.filters[filterKey] = filter;

      // This "hack" is used to avoid problems when re-rendering the filters.
      this.__filters = [];
      this.__ignoreFiltersValues = {};
      afterNextRender(this, () => { this.__filtersChanged(this.filters); });
    }

    /**
     * Removes an existing filter and re-renders the component.
     *
     * @param {String} filterKey The filter's identifier.
     */
    removeFilter (filterKey) {
      delete this.filters[filterKey];

      // This "hack" is used to avoid problems when re-rendering the filters.
      this.__filters = [];
      this.__ignoreFiltersValues = {};
      afterNextRender(this, () => { this.__filtersChanged(this.filters); });
    }

    /**
     * Changes the list of items of a provided casper-select based filter.
     *
     * @param {Object} filtersItems An object containing the new items for the specified filters.
     */
    setFiltersItems (filtersItems) {
      for (const [filterKey, filterItems] of Object.entries(filtersItems)) {
        if (this.filters[filterKey].type !== CasperMoacFilterTypes.CASPER_SELECT) return;

        const filterSelectComponent = this.__getFilterComponent(filterKey);
        if (filterSelectComponent) {
          filterSelectComponent.items = filterItems;
        }
      }
    }

    /**
     * Changes the filters values without automatically firing a request by setting the internal property '__valueChangeLock'.
     *
     * @param {Object} filterValues The object which contains the new values for each filter.
     */
    setFiltersValue (filtersValue) {
      for (const [filterName, filterValue] of Object.entries(filtersValue)) {
        const filterComponent = this.__getFilterComponent(filterName);

        this.__ignoreFiltersValues[filterName] = filterValue;

        this.filters[filterName].type !== CasperMoacFilterTypes.PAPER_CHECKBOX
          ? filterComponent.value = filterValue
          : filterComponent.checked = filterValue;
      }

      afterNextRender(this, () => {
        this.__renderActiveFilters();
        this.__updateUrlWithCurrentFilters();
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

      this.__buildHistoryStateFilters();

      const searchParams = new URLSearchParams(window.location.search);
      // Transform the filters object into an array to use in a dom-repeat.
      this.__filters = Object.keys(filters).map(filterKey => {
        const filterSettings = {
          filterKey: filterKey,
          filter: this.filters[filterKey]
        };

        // Override the filter's default value if it's present in the URL.
        const parameterName = this.__getUrlKeyForFilter(filterKey);
        if (searchParams.has(parameterName)) {
          filterSettings.filter.value = this.__getValueFromPrettyUrl(filterSettings.filter, searchParams.get(parameterName));
        }

        if (this.__valueIsNotEmpty(filterSettings.filter.value)) {
          this.__ignoreFiltersValues[filterKey] = filterSettings.filter.value;
        }

        return filterSettings;
      });

      // Since we already have all the values ready, filter the items.
      !this.lazyLoad
        ? this.__filterItems()
        : this.__filterLazyLoadItems();

      afterNextRender(this, () => {
        this.__bindFiltersEvents();
        this.__renderActiveFilters();
      });
    }

    /**
     * Bind event listeners to all the elements used to filter the dataset.
     */
    __bindFiltersEvents () {
      const filterChangedCallback = event => {
        const { dataset, value } = event.composedPath().shift();

        // This validation makes sure we're not firing requests for already fetched filters during the initialization process.
        if (Object.keys(this.__ignoreFiltersValues).includes(dataset.filter)) {
          const filterDidNotChange = String(this.__ignoreFiltersValues[dataset.filter]) === String(value);
          if (filterDidNotChange) return;

          delete this.__ignoreFiltersValues[dataset.filter];
        }

        console.log('Disparei um event');
        // Dispatch a custom event to inform the page using casper-moac that the filters have changed.
        this.dispatchEvent(new CustomEvent('filters-changed', {
          bubbles: true,
          composed: true,
          detail: { filter: dataset.filter }
        }));

        // Force the re-fetch of items if one the filter changes.
        if (this.lazyLoad) this.refreshItems();

        this.__renderActiveFilters();
        this.__updateUrlWithCurrentFilters();
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
     * This method is responsible for rendering the active filters summary and binding the event listeners that
     * will be reponsible for displaying the filter's input overlay when possible.
     */
    __renderActiveFilters () {
      this.$.activeFilters.innerHTML = '';
      this.$.activeFilters.style.display = 'none';

      if (!this.filters) return;

      Object.entries(this.filters).forEach(([filterKey, filter]) => {
        // If the filter is not visible, do not render him in the list of active filters.
        if (Object.keys(this.filters[filterKey]).includes('visible') && this.filters[filterKey].visible === false) return;

        let isFilterCurrentlyOpen = false;

        // Do not hide the "shortcut" when the casper-select is currently open.
        if (filter.type === CasperMoacFilterTypes.CASPER_SELECT) {
          const selectElement = this.__getFilterComponent(filterKey);
          isFilterCurrentlyOpen = selectElement && selectElement.opened;
        }

        if (isFilterCurrentlyOpen || this.__valueIsNotEmpty(filter.value)) {
          this.__renderActiveFilterDOM(filterKey, filter);
        }
      });

      // Create the no active filters placeholder.
      if (!this.$.activeFilters.innerHTML) {
        const noActiveFiltersPlaceholder = document.createElement('span');
        noActiveFiltersPlaceholder.className = 'no-active-filters';
        noActiveFiltersPlaceholder.innerHTML = '(Não há filtros activos)';

        this.$.activeFilters.appendChild(noActiveFiltersPlaceholder);
      }

      this.$.activeFilters.removeAttribute('style');
    }

    /**
     * This method creates the currently active filters in the DOM and binds the click event listener.
     *
     * @param {Object} filterKey The filter's identifier.
     * @param {Object} filter The filter's settings.
     */
    __renderActiveFilterDOM (filterKey, filter) {
      const activeFilter = document.createElement('casper-moac-active-filter');
      activeFilter.key = filterKey;
      activeFilter.required = filter.required;
      activeFilter.label = filter.inputOptions.label;
      activeFilter.value = this.__activeFilterValue(filterKey, filter);
      activeFilter.onClickCallback = filterKey => this.__displayInlineFilters(filterKey);
      activeFilter.onRemoveCallback = filterKey => this.__removeActiveFilter(filterKey);

      this.$.activeFilters.appendChild(activeFilter);
    }

    /**
     * Given a specific filter, this method is responsible for returning the human-readable version
     * of its current value.
     *
     * @param {Object} filterKey The filter's identifier.
     * @param {Object} filter The filter's settings.
     */
    __activeFilterValue (filterKey, filter) {
      if (!this.__valueIsNotEmpty(filter.value)) return '(Filtro Vazio)';

      switch (filter.type) {
        case CasperMoacFilterTypes.PAPER_INPUT:
        case CasperMoacFilterTypes.CASPER_DATE_PICKER:
        case CasperMoacFilterTypes.COMPONENTLESS_FILTER:
          return filter.value;
        case CasperMoacFilterTypes.PAPER_CHECKBOX:
          return filter.inputOptions.label;
        case CasperMoacFilterTypes.CASPER_SELECT:
          const casperSelect = this.__getFilterComponent(filterKey);

          // This means the casper-select is not in the DOM yet or does not have the selected items.
          if (!casperSelect || !casperSelect.selectedItems || Object.keys(casperSelect.selectedItems).length === 0) {
            return afterNextRender(this, () => { this.__renderActiveFilters() });
          }

          return !filter.inputOptions.multiSelection
            ? casperSelect.selectedItems[casperSelect.itemColumn]
            : casperSelect.selectedItems.map(selectedItem => selectedItem[casperSelect.itemColumn]).join(', ');
      }
    }

    /**
     * This method removes an active filter by changing the value of the the casper-select, paper-input, etc associated with it.
     *
     * @param {String} filterKey The filter's unique identifier.
     */
    __removeActiveFilter (filterKey) {
      const filterComponent = this.__getFilterComponent(filterKey);

      filterComponent.nodeName.toLowerCase() !== 'paper-checkbox'
        ? filterComponent.value = ''
        : filterComponent.checked = false;
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
     *
     * @param {Object} event The event's object.
     */
    __freeFilterChanged (event) {
      // If the user is in the search input and clicks the ArrowDown key, focus the currently active row.
      if (event && event.code === 'ArrowDown') return this.__focusActiveRow();

      !!this.$.filterInput.value.trim()
        ? this.$.filterInputIcon.icon = 'fa-regular:times'
        : this.$.filterInputIcon.icon = 'fa-regular:search';

      this.__debounce('__freeFilterChangedDebouncer', () => {
        // Do not re-filter the items if the current value matches the last one.
        if (this.$.filterInput.value.trim() === this.freeFilterValue) return;
        this.freeFilterValue = this.$.filterInput.value.trim();

        this.__updateUrlWithCurrentFilters();
        !this.lazyLoad
          ? this.__filterItems()
          : this.__filterLazyLoadItems();
      });
    }
  }
};