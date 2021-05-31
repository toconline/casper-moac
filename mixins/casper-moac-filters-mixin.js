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
      // Delete the current URL key if it exists.
      const urlSearchParams = new URLSearchParams(window.location.search);
      const urlParameterName = this.__getUrlKeyForFilter(filterKey);
      if (urlSearchParams.has(urlParameterName)) {
        urlSearchParams.delete(urlParameterName);
        window.history.replaceState({}, '', `${window.location.origin}${window.location.pathname}?${urlSearchParams.toString()}`);
      }

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
        if (![CasperMoacFilterTypes.CASPER_SELECT, CasperMoacFilterTypes.COMPONENTLESS_FILTER].includes(this.filters[filterKey].type)) return;

        const filterSelectComponent = this.__getFilterComponent(filterKey);
        if (filterSelectComponent) {
          filterSelectComponent.items = filterItems;

          // Also change the list of items in the filters property.
          this.filters[filterKey].inputOptions = this.filters[filterKey].inputOptions || {};
          this.filters[filterKey].inputOptions.items = filterItems;
        }
      }
    }

    /**
     * Changes the filters values without automatically firing a request by setting the internal property '__ignoreFiltersValues'.
     *
     * @param {Object} filterValues The object which contains the new values for each filter.
     * @param {Boolean} displayResetPill This flag states if the reset filters pill should be displayed.
     * @param {Boolean} overrideInitialValues This flag states if the initial values should be overwritten with the new ones.
     */
    setFiltersValue (filtersValue, displayResetFiltersPill = true, overrideInitialValues = false) {
      for (const [filterName, filterValue] of Object.entries(filtersValue)) {
        const filterComponent = this.__getFilterComponent(filterName);

        this.__ignoreFiltersValues[filterName] = filterValue;
        this.filters[filterName].type !== CasperMoacFilterTypes.PAPER_CHECKBOX
          ? filterComponent.value = filterValue
          : filterComponent.checked = filterValue;

        if (overrideInitialValues) this.__initialFiltersValues[filterName] = filterValue;
      }

      if (displayResetFiltersPill) {
        this.__displayResetFiltersButton = true;
      }

      afterNextRender(this, () => {
        this.__renderActiveFilters();
        this.__updateUrlWithCurrentFilters();
        this.__updateLocalStorageWithCurrentFilters();
      });
    }

    /**
     * Overwrites all the existing filters with the ones present in the URL.
     */
    updateFiltersAccordingToURL () {
      const newFiltersValues = {};
      const searchParams = new URLSearchParams(window.location.search);

      Object.keys(this.filters).forEach(filterKey => {
        const parameterName = this.__getUrlKeyForFilter(filterKey);

        newFiltersValues[filterKey] = !searchParams.has(parameterName)
          ? ''
          : this.__getValueFromPrettyUrl(this.filters[filterKey], searchParams.get(parameterName));
      });

      this.setFiltersValue(newFiltersValues);

      // Update the free filter as well.
      this.$.filterInput.value = this.freeFilterValue = searchParams.get(this.freeFilterUrlParameterName) || '';
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
      this.__buildLocalStorageFilters();

      const searchParams = new URLSearchParams(window.location.search);
      const localStorageFilters = this.__retrieveFiltersFromLocalStorage();

      // This object will contain the origin of each filter's initial value.
      const filtersValueOrigins = {};

      // Transform the filters object into an array to use in a dom-repeat.
      this.__filters = Object.entries(filters).map(([filterKey, filter]) => {
        filtersValueOrigins[filterKey] = { value: this.__valueIsNotEmpty(filter.value), localStorage: false, url: false };
        // Save the initial value provided by the developer.
        let filterValue = filter.value;
        this.__initialFiltersValues[filterKey] = filterValue;

        // Override the filter's default value if it's present in the local storage.
        if (this.__localStorageFilters.includes(filterKey) && localStorageFilters.hasOwnProperty(filterKey)) {
          filterValue = localStorageFilters[filterKey];
          filtersValueOrigins[filterKey] = { value: false, localStorage: true, url: false };
        }

        // Override the filter's default value if it's present in the URL.
        if (this.__historyStateFilters.includes(filterKey)) {
          const parameterName = this.__getUrlKeyForFilter(filterKey);
          if (searchParams.has(parameterName)) {
            filterValue = this.__getValueFromPrettyUrl(filter, searchParams.get(parameterName));
            filtersValueOrigins[filterKey] = { value: false, localStorage: false, url: true };
          }
        }

        // Save the initial value and ignore it down later to avoid multiple requests because of components initialization.
        if (this.__valueIsNotEmpty(filterValue)) {
          this.__ignoreFiltersValues[filterKey] = filterValue;
        }

        // If this condition returns true, it means either the local storage or the URL overwrote the initial value passed by the developer.
        if ((filterValue || this.__initialFiltersValues[filterKey]) && !this.__areBothValuesEqual(filterValue, this.__initialFiltersValues[filterKey])) {
          this.__displayResetFiltersButton = true;
        }

        filter.value = filterValue;

        return { filterKey, filter };
      });

      // Since we already have all the values ready, filter the items.
      if (this.lazyLoad) {
        this.__filterLazyLoadItems();
      } else if (this.socketLazyLoad) {
        this._filterSocketItems();
      } else {
        this.__filterItems();
      }

      if (Object.keys(filtersValueOrigins).length > 0) {
        this.dispatchEvent(new CustomEvent('filters-initialized', {
          bubbles: true,
          composed: true,
          detail: filtersValueOrigins
        }));
      }

      afterNextRender(this, () => {
        this.__bindFiltersEvents();
        this.__renderActiveFilters();
        this.__updateUrlWithCurrentFilters();
      });
    }

    /**
     * This method will compare two different values and return true if they are equal.
     *
     * @param {Object} firstValue The first value.
     * @param {Object} secondValue The second value.
     */
    __areBothValuesEqual (firstValue, secondValue) {
      if (!firstValue && !secondValue) return true;
      if ((firstValue && !secondValue) || (!firstValue && secondValue)) return false;

      // If they are both objects, compare the number of keys and the keys themselves.
      if (firstValue.constructor === Object && secondValue.constructor === Object) {
        return Object.keys(firstValue).length === Object.keys(secondValue).length && !Object.keys(firstValue).some(key => firstValue[key] !== secondValue[key]);
      }

      // By default since we don't deal with arrays, compare them as Strings.
      return String(firstValue) === String(secondValue);
    }

    /**
     * Bind event listeners to all the elements used to filter the dataset.
     */
    __bindFiltersEvents () {
      const filterChangedCallback = event => {
        let { dataset, value } = event.composedPath().shift();
        if (event.type === 'checked-changed') value = event.detail.value;

        // This validation makes sure we're not firing requests for already fetched filters during the initialization process.
        if (Object.keys(this.__ignoreFiltersValues).includes(dataset.filter)) {
          // Compare the new value with the one we're trying to ignore.
          if (this.__areBothValuesEqual(value, this.__ignoreFiltersValues[dataset.filter])) return;

          delete this.__ignoreFiltersValues[dataset.filter];
        }

        this.__displayResetFiltersButton = true;

        // Force the re-fetch of items if one the filter changes.
        if (this.lazyLoad) {
          this.refreshItems();
        } else if (this.socketLazyLoad) {
          this._filterSocketItems();
        }

        this.__renderActiveFilters();
        this.__updateUrlWithCurrentFilters();
        this.__updateLocalStorageWithCurrentFilters();
        this.__dispatchFilterChangedEvent(dataset.filter);
      };

      afterNextRender(this, () => {
        this.filterComponents = Array.from(this.shadowRoot.querySelectorAll(`
          paper-input[data-filter],
          paper-checkbox[data-filter],
          casper-select[data-filter],
          casper-date-range[data-filter],
          casper-date-picker[data-filter]
        `));

        this.filterComponents.forEach(filterComponent => {
          // Check if the events were already attached previously.
          if (filterComponent[this.attachedEventListenersInternalProperty]) return;

          const eventName = filterComponent.nodeName.toLowerCase() === 'paper-checkbox'
            ? 'checked-changed'
            : 'value-changed';

          filterComponent.addEventListener(eventName, filterChangedCallback);

          // This is used to clean possible empty filters due to the casper-select dropdown being open at the time.
          if (filterComponent.nodeName.toLowerCase() === 'casper-select') {
            filterComponent.addEventListener('opened-changed', event => {
              if (!event.target.opened) this.__renderActiveFilters();
            });
          }

          filterComponent[this.attachedEventListenersInternalProperty] = true;
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
      activeFilter.onRemoveCallback = filterKey => this.__removeActiveFilter(filterKey);

      if (filter.type !== CasperMoacFilterTypes.COMPONENTLESS_FILTER) {
        activeFilter.onClickCallback = filterKey => this.__displayInlineFilters(filterKey);
      }

      this.$.activeFilters.appendChild(activeFilter);
    }

    /**
     * Given a specific filter, this method is responsible for returning the human-readable version
     * of its current value.
     *
     * @param {String} filterKey The filter's identifier.
     * @param {Object} filter The filter's settings.
     */
    __activeFilterValue (filterKey, filter) {
      if (!this.__valueIsNotEmpty(filter.value)) return '(Filtro Vazio)';

      switch (filter.type) {
        case CasperMoacFilterTypes.PAPER_INPUT: return filter.value;
        case CasperMoacFilterTypes.PAPER_CHECKBOX: return filter.inputOptions.label;
        case CasperMoacFilterTypes.CASPER_DATE_RANGE:
          const casperDateRange = this.__getFilterComponent(filterKey);

          if (casperDateRange.formattedStartDate && casperDateRange.formattedEndDate) {
            return `Desde ${casperDateRange.formattedStartDate} até ${casperDateRange.formattedEndDate}`;
          } else if (casperDateRange.formattedStartDate) {
            return `Desde ${casperDateRange.formattedStartDate}`;
          } else if (casperDateRange.formattedEndDate) {
            return `Até ${casperDateRange.formattedEndDate}`;
          }
        case CasperMoacFilterTypes.CASPER_DATE_PICKER:
          const casperDatePicker = this.__getFilterComponent(filterKey);

          return casperDatePicker ? casperDatePicker.formattedValue : '';
        case CasperMoacFilterTypes.CASPER_SELECT:
        case CasperMoacFilterTypes.COMPONENTLESS_FILTER:
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

      // AQUI
      // The first time that this function runs, another one is called to insert paper tabs (categories for the filters)
      if (this.__firstTimeDisplayingFilters) {
        this.__firstTimeDisplayingFilters = false;
        this.__createFiltersTabs();
      } 
    }

    /**
     * Debounce the items filtering after the search input's value changes.
     */
    __freeFilterChanged () {
      !!this.$.filterInput.value.trim()
        ? this.$.filterInputIcon.icon = 'fa-regular:times'
        : this.$.filterInputIcon.icon = 'fa-regular:search';

      // When the component is lazily loaded, ignore the changes if the developer didn't specify no filter attributes or an URL parameter.
      if ((this.lazyLoad || this.socketLazyLoad) && !this.resourceFilterParam && (!this.resourceFilterAttributes || this.resourceFilterAttributes.length === 0)) return;

      this.__debounce('__freeFilterChangedDebouncer', () => {
        // Do not re-filter the items if the current value matches the last one.
        if (this.$.filterInput.value.trim() === this.freeFilterValue) return;
        this.freeFilterValue = this.$.filterInput.value.trim();

        this.__updateUrlWithCurrentFilters();

        if (this.lazyLoad) {
          this.__filterLazyLoadItems();
        } else if (this.socketLazyLoad) {
          this._filterSocketItems();
        } else {
          this.__filterItems()
        }
      });
    }

    /**
     * Dispatches a custom event that'll alert the page that the filters have changed.
     *
     * @param {String | Array} filter The filter(s) that changed.
     */
    __dispatchFilterChangedEvent (filter) {
      // Dispatches the custom event to inform the page using casper-moac that the filters have changed.
      this.dispatchEvent(new CustomEvent('filters-changed', {
        bubbles: true,
        composed: true,
        detail: { filter: filter }
      }));
    }

    /**
     * Dispatches a custom event that'll alert the page that the filters have been resetted.
     *
     * @param {String | Array} filter The filter(s) that have been resetted.
     */
    __dispatchFilterResetted (filter) {
      // Dispatches the custom event to inform the page using casper-moac that the filters have been resetted.
      this.dispatchEvent(new CustomEvent('filters-resetted', {
        bubbles: true,
        composed: true,
        detail: { filter: filter }
      }));
    }


    /**
     * Resets the filters to the initial values.
     */
    __resetFilters () {

      this.__displayResetFiltersButton = false;

      const resetFiltersValue = {};

      Object.entries(this.filters).forEach(([filterKey, filterObj]) => {
        const value = !this.__initialFiltersValues.hasOwnProperty(filterKey) ? '' : this.__initialFiltersValues[filterKey] || '';
        if (value != filterObj.value || !this.lazyLoad) resetFiltersValue[filterKey] = value;
      });

      this.setFiltersValue(resetFiltersValue, false);

      if (this.lazyLoad) {
        this.refreshItems();
        this.__dispatchFilterResetted(Object.keys(resetFiltersValue));
      } else if (this.socketLazyLoad) {
        this._filterSocketItems();
        this.__dispatchFilterChangedEvent(Object.keys(resetFiltersValue));
      } else {
        this.__dispatchFilterChangedEvent(Object.keys(resetFiltersValue));
      }
    }

    /**
     * Event listener which is fired when the user clicks on a filter's value in the summary. This will try to move
     * the filter's overlay for UX purposes (casper-select) or display all the filters focusing the correct one.
     *
     * @param {String} filterKey The filter's identifier.
     */
    __displayInlineFilters (filterKey) {
      const filter = this.filters[filterKey];
      const filterComponent = this.__getFilterComponent(filterKey);

      switch (filter.type) {
        case CasperMoacFilterTypes.CASPER_SELECT:
          filterComponent.opened
            ? filterComponent.closeDropdown()
            : filterComponent.openDropdown(this.$.activeFilters);
          break;
        case CasperMoacFilterTypes.CASPER_DATE_PICKER:
          this.__displayAllFilters = true;
          filterComponent.open();
          break;
        case CasperMoacFilterTypes.CASPER_DATE_RANGE:
          this.__displayAllFilters = true;
          filterComponent.openStartDatePicker();
          break;
        case CasperMoacFilterTypes.PAPER_INPUT:
        case CasperMoacFilterTypes.PAPER_CHECKBOX:
          this.__displayAllFilters = true;
          filterComponent.focus();
          break;
      }
    }

    /**
     * This function is responsible for creating the filters tabs.
     *
     */
     __createFiltersTabs () {
      // First we need to check if any of the filters has a key 'tab'. If not, then we return
      for (const obj of this.__filters) {
        if (obj.filter.tab) {
          this.hasTabs = true;
          break;
        }
      }
      if (!this.hasTabs) return;

      const casperTabsContainer = this.$.casperTabsContainer;
      casperTabsContainer.classList.add('casper-tabs-container');

      let casperTabsHtml = '<casper-tabs id="casperTabs">';

      for (const obj of this.__filters) {
        if (obj.filter.tab) {
          const tabName = obj.filter.tab;

          // If the tab already exists, we skip this one
          if (casperTabsHtml.includes(`data-type="${tabName}"`)) {
            continue;
          } else {
            casperTabsHtml += `<casper-tab data-type="${tabName}">${tabName}</casper-tab>`;
          }
        // If no tab was specified for the filter, then we create a "others" tab and insert it there
        } else {
          obj.filter.tab = 'others';

          if (casperTabsHtml.includes('data-type="others"')) {
            continue;
          } else {
            casperTabsHtml += `<casper-tab data-type="others">Outros filtros</casper-tab>`;
          }
        }
      }

      casperTabsHtml += '</casper-tabs>';
      casperTabsContainer.innerHTML = casperTabsHtml;
      const casperTabs = casperTabsContainer.querySelector('#casperTabs');

      // Here we create the scroll arrows and set their styles
      const leftArrow = document.createElement('span');
      leftArrow.setAttribute('id', 'leftArrow');
      leftArrow.classList.add('casper-tabs-container-scroll-arrows');
      leftArrow.innerHTML = '<casper-icon icon="fa-regular:angle-left"></casper-icon>';
      casperTabsContainer.insertBefore(leftArrow, casperTabs);

      const rightArrow = document.createElement('span');
      rightArrow.setAttribute('id', 'rightArrow');
      rightArrow.classList.add('casper-tabs-container-scroll-arrows');
      rightArrow.innerHTML = '<casper-icon icon="fa-regular:angle-right"></casper-icon>';
      casperTabsContainer.appendChild(rightArrow);

      // ver se isto é necessário (e corrigir condição)
      // if (casperTabs.offsetWidth < casperTabsContainer.offsetWidth) {
      //   rightArrow.style.visibility = 'hidden';
      //   leftArrow.style.visibility = 'hidden';
      // }

      // This will observe the resize of the given elements (entries)
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target.id === 'casperTabsContainer') {
            const casperTabsContainer = entry.target;
            const casperTabs = entry.target.querySelector('#casperTabs');
            const leftArrow = casperTabsContainer.querySelector('#leftArrow');
            const rightArrow = casperTabsContainer.querySelector('#rightArrow');

            let allTabsWidth = 0;
            for (const tab of casperTabs.children) {
              allTabsWidth += tab.offsetWidth;
            }
            
            // If the width of all tabs plus the two scroll arrows is bigger than the width of their container, then we show the right arrow
            if ((allTabsWidth + leftArrow.offsetWidth * 2) > casperTabsContainer.offsetWidth) {
              rightArrow.style.visibility = 'visible';
            } else {
              rightArrow.style.visibility = 'hidden';
              leftArrow.style.visibility = 'hidden';
            }
          }
        }
      });
      resizeObserver.observe(casperTabsContainer);

      leftArrow.addEventListener('click', this.__scrollFiltersTabs.bind(casperTabs, 'left', 150));
      rightArrow.addEventListener('click', this.__scrollFiltersTabs.bind(casperTabs, 'right', 150));
      casperTabs.addEventListener('selected-index-changed', event => this.__tabFiltersChanged(event));
      casperTabs.addEventListener('click', event => this.__findTabsScrollDirection(event));
      this.changeFiltersTab(0);
    }

    /**
     * This function fires when the user clicks on a scroll arrow. It is responsible for scrolling the casper tabs.
     * 'This' inside this function refers to the casperTabs
     *
     * @param {String} direction The direction of the scroll.
     * @param {Number} value The value of the scroll.
     */
    __scrollFiltersTabs (direction, value) {
      if (direction === 'right') {
        this.scrollLeft += value;
      } else if (direction === 'left') {
        this.scrollLeft -= value;
      }
      
      // Here we need a timeout to make sure that the scroll-behavior: smooth has finished
      setTimeout(() => {
        const casperTabsContainer = this.parentElement;
        const leftArrow = casperTabsContainer.querySelector('#leftArrow');
        const rightArrow = casperTabsContainer.querySelector('#rightArrow');

        // Here we're at the end of the scroll
        if ((this.offsetWidth + this.scrollLeft) > this.scrollWidth) {
          rightArrow.style.visibility = 'hidden';
        } else {
          rightArrow.style.visibility = 'visible';
        }
  
        // Here we're at the beginning of the scroll
        if (this.scrollLeft === 0) { 
          leftArrow.style.visibility = 'hidden';
        } else {
          leftArrow.style.visibility = 'visible';
        }
      }, 200);
    }

    /**
     * This function fires when the user clicks on the casper tabs. 
     * It is responsible for finding whether the tabs should scroll left or right.
     *
     * @param {Object} event The event's object.
     */
    __findTabsScrollDirection (event) { 
      if (event && event.currentTarget) {
        const casperTabs = event.currentTarget;

        // Here there's no need to scroll
        if (casperTabs.offsetWidth >= casperTabs.scrollWidth) return;

        const tabIndex = casperTabs.selectedIndex;
        const selectedTab = casperTabs.children[tabIndex];

        const middleX = casperTabs.offsetWidth / 2;
        const clickX = event.clientX - casperTabs.getBoundingClientRect().left;

        let direction;
        if (clickX >= middleX) {
          direction = 'right';
        } else if (clickX < middleX) {
          direction = 'left';
        }
        
        const scrollValue = selectedTab.offsetWidth;
      
        this.__scrollFiltersTabs.call(casperTabs, direction, scrollValue);
      }
    }

    /**
     * This function fires when the filters selected tab changes.
     * It is responsible for identifying the filters that should be hidden / displayed for the selected tab.
     *
     * @param {Object} event The event's object.
     */
    __tabFiltersChanged (event) {
      if (event && event.detail && event.detail.value !== undefined) {
        const tabIndex = event.detail.value;
        const casperTabs = this.$.casperTabsContainer.querySelector('#casperTabs');
        const selectedTab = casperTabs.children[tabIndex];
        const selectedTabType = selectedTab.dataset.type;
      
        const filterElements = this.$.filtersContainer.querySelectorAll('.filter-container');

        for (const filterEl of filterElements) {
          let currentFilterName;

          // We need to go inside the current filter element and get the filter's name
          for (let i = 0; i < filterEl.childElementCount; i++) {
            if (filterEl.children[i].tagName !== 'DOM-IF' && filterEl.children[i].dataset && filterEl.children[i].dataset.filter) {
              currentFilterName = filterEl.children[i].dataset.filter;
              break;
            }
          }

          // Next we need to check the filter objects to find out if the current filter belongs to the selected tab or not
          for (const obj of this.__filters) {
            if (currentFilterName === obj.filterKey) { 
              const currentFilterTab = obj.filter.tab;

              if (currentFilterTab !== selectedTabType) {
                filterEl.hidden = true;
              } else {
                filterEl.hidden = false;
              }

              break;
            }
          }
        }
      }
    }

    /**
     * Public function to change the active tab in the filters.
     *
     * @param {Number} tabIndex The index of the tab that will be selected.
     */
    changeFiltersTab (tabIndex) {
      if (isNaN(tabIndex) || +tabIndex < 0 || !this.hasTabs) return;

      const casperTabs = this.$.casperTabsContainer.querySelector('#casperTabs');
      casperTabs.selectedIndex = tabIndex;
    }

  }
};