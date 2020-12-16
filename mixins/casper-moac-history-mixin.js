export const CasperMoacHistoryMixin = superClass => {
  return class extends superClass {
    /**
     * This method is used to select and sort the filters that will be present in the current URL.
     */
    __buildHistoryStateFilters () {
      this.__historyStateFilters = Object.keys(this.filters)
        .filter(filterKey => !this.filters[filterKey].historyState || !this.filters[filterKey].historyState.disabled)
        .sort((a, b) => {
          const nextHistoryState = this.filters[b].historyState;
          const previousHistoryState = this.filters[a].historyState;

          if (nextHistoryState?.priority === undefined && previousHistoryState?.priority === undefined) return 0;
          if (nextHistoryState?.priority === undefined) return -1;
          if (previousHistoryState?.priority === undefined) return 1;

          return previousHistoryState.priority - nextHistoryState.priority;
        });
    }

    /**
     * This method is used to update the current URL with the filters that are being applied at the moment.
     */
    __updateUrlWithCurrentFilters () {
      const searchParams = new URLSearchParams(window.location.search);

      this.__historyStateFilters.forEach(historyStateFilter => {
        const filter = this.filters[historyStateFilter];

        const parameterName = this.__getUrlKeyForFilter(historyStateFilter);

        // Remove the value firstly so that we don't end up with stale data.
        searchParams.delete(parameterName);

        // Only include non-empty filters.
        if (this.__valueIsNotEmpty(filter.value)) {
          searchParams.set(parameterName, this.__getPrettyValueForUrl(filter));
        }
      });

      searchParams.delete(this.freeFilterUrlParameterName);
      if (this.freeFilterValue) {
        searchParams.set(this.freeFilterUrlParameterName, this.freeFilterValue);
      }

      const searchParamsText = searchParams.toString();
      !searchParamsText
        ? history.replaceState({}, '', window.location.pathname)
        : history.replaceState({}, '', `${window.location.pathname}?${searchParamsText}`);
    }

    /**
     * Tries to map the pretty URL search parameter with an actual value provided by the developer.
     *
     * @param {Object} historyState The current's filter history state settings.
     * @param {String} prettyValueInUrl The value that is in the URL for the current filter.
     */
    __getValueFromPrettyUrl ({ historyState, type }, prettyValueInUrl) {
      if (historyState && historyState.prettyValues) {
        // Find the key which value matches with the parameter present in the URL.
        const filterValue = Object.keys(historyState.prettyValues).find(prettyValue => {
          return historyState.prettyValues[prettyValue] === prettyValueInUrl;
        });

        if (filterValue) return filterValue;
      }

      return prettyValueInUrl;
    }

    /**
     * Tries to obtain a pretty URL search parameter for a given value.
     *
     * @param {Object} historyState The current filter's history state settings.
     * @param {String} value The current filter's value.
     */
    __getPrettyValueForUrl ({ historyState, value, type }) {
      if (historyState
        && !historyState.disabled
        && historyState.prettyValues
        && historyState.prettyValues.hasOwnProperty(value)) {
        return historyState.prettyValues[value];
      } else {
        return value;
      }
    }

    /**
     * Returns the parameter name that will be present in the URL for a specific filter.
     *
     * @param {String} filterKey The filter identifier.
     */
    __getUrlKeyForFilter (filterKey) {
      let parameterName = filterKey;

      const historyState = this.filters[filterKey].historyState;
      if (historyState && historyState.key) {
        parameterName = historyState.key;
      }

      return parameterName;
    }
  }
};