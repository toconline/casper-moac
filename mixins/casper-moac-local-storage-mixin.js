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
    __saveFiltersIntoLocalStorage () {
      if (!this.localStorageKey) return;

      const localStorageFilters = {};

      Object.entries(this.filters).forEach(([filterKey, filter]) => {
        if (this.__valueIsNotEmpty(filter.value)) {
          localStorageFilters[filterKey] = filter.value;
        }
      });

      window.localStorage.setItem(this.localStorageKey, JSON.stringify(localStorageFilters));
    }
  }
};