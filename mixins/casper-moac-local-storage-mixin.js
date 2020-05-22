export const CasperMoacLocalStorageMixin = superClass => {
  return class extends superClass {

    static get properties () {
      return {
        /**
         * This property sets the local storage key that will be used to store the filters.
         *
         * @type {String}
         */
        localStorageKey: {
          type: String,
        }
      }
    }

    /**
     * Retrieves the filters information that was previously save in the local storage.
     */
    __retrieveFiltersFromLocalStorage () {
      if (!this.localStorageKey) return {};

      const localStorageFilters = window.localStorage.getItem(this.localStorageKey);

      return JSON.parse(localStorageFilters) || {};
    }

    /**
     * Saves the current filters information into the local storage.
     */
    __updateLocalStorageWithCurrentFilters () {
      if (!this.localStorageKey) return;

      const localStorageFilters = {};
      this.__localStorageFilters.forEach(filterKey => {
        const filterValue = this.filters[filterKey].value;

        if (this.__valueIsNotEmpty(filterValue)) {
          localStorageFilters[filterKey] = filterValue;
        }
      });

      window.localStorage.setItem(this.localStorageKey, JSON.stringify(localStorageFilters));
    }

    /**
     * This method is used to select the filters that will be used when reading and writing into the local storage.
     */
    __buildLocalStorageFilters () {
      this.__localStorageFilters = Object.keys(this.filters).filter(filterKey => {
        return !this.filters[filterKey].localStorage || !this.filters[filterKey].localStorage.disabled;
      });
    }
  }
};