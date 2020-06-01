import { CasperMoacSortTypes, CasperMoacSortDirections } from '../casper-moac-constants.js';

export const CasperMoacSortingMixin = superClass => {
  return class extends superClass {

    /**
     * This method will handle the currently active sorters and re-fetch the items when the grid is lazy loaded
     * or sort locally otherwise everytime a sorter changes.
     */
    __bindSorterEvents () {
      this.__activeSorters = [];
      this.__sorters = [
        ...this.shadowRoot.querySelector('slot[name="grid-before"]').assignedElements().filter(assignedElement => assignedElement.nodeName.toLowerCase() === 'casper-moac-sort-column'),
        ...this.shadowRoot.querySelector('slot[name="grid"]').assignedElements().filter(assignedElement => assignedElement.nodeName.toLowerCase() === 'casper-moac-sort-column'),
      ];

      this.__guaranteeInitialSortersOrder();

      this.__sorters.forEach(sorterColumn => {
        sorterColumn.addEventListener('direction-changed', event => {
          const sorter = event.target;

          // Check if we are listening to an event for a sorter that was already handled during initialization.
          if (this.__initialSorters.includes(sorter)) {
            this.__initialSorters = this.__initialSorters.filter(initialSorter => initialSorter !== sorter);
            return;
          }

          const existingSorterIndex = this.__activeSorters.findIndex(activeSorter => activeSorter === sorter);
          if (existingSorterIndex === -1 && !!sorter.direction) {
            // This means the current sorter does not yet exist.
            this.__activeSorters = [...this.__activeSorters, sorter];
          } else {
            // This means the sorter already exists so it needs to be removed in case it's not sorting anymore.
            if (!sorter.direction) {
              this.__activeSorters = [...this.__activeSorters.filter(activeSorter => activeSorter.path !== sorter.path)];
            }
          }

          // Loop through all the sorters and display the sorterOrder if necessary.
          this.__sorters.forEach(sorter => {
            const activeSorterIndex = this.__activeSorters.findIndex(activeSorter => activeSorter === sorter);

            sorter.sortOrder = this.__activeSorters.length > 1 && activeSorterIndex !== -1 ? activeSorterIndex + 1 : '';
          });

          this.__hasActiveSorters = this.__activeSorters.length > 0;
          !this.lazyLoad
            ? this.__filterItems()
            : this.__filterLazyLoadItems();
        });
      });
    }

    /**
     * This method makes sure that the sorters respect the columns initial sort order.
     */
    __guaranteeInitialSortersOrder () {
      // Guarantee the initial order is applied.
      this.__activeSorters = this.__initialSorters = this.__sorters
        .filter(sorter => !!sorter.direction)
        .sort((previousSorter, nextSorter) => {
          const nextSorterOrder = !isNaN(nextSorter.sortOrder) ? nextSorter.sortOrder : Infinity;
          const previousSorterOrder = !isNaN(previousSorter.sortOrder) ? previousSorter.sortOrder : Infinity;

          if (previousSorterOrder < nextSorterOrder) return -1;
          if (previousSorterOrder > nextSorterOrder) return 1;
          return 0;
        })
        .map((sorter, sorterIndex) => {
          sorter.sortOrder = sorterIndex + 1;
          return sorter;
        });

      this.__hasActiveSorters = this.__activeSorters.length > 0;
    }

    /**
     * Sort the provided items with the currently active sorters.
     *
     * @param {Array} items The items that will be sorted.
     */
    __sortItems (items) {
      if (this.__activeSorters.length === 0) return items;

      return items.sort((previousItem, nextItem) => {
        for (let activeSorterIndex = 0; activeSorterIndex < this.__activeSorters.length; activeSorterIndex++) {
          let comparisonResult;

          const activeSorter = this.__activeSorters[activeSorterIndex];
          const nextItemProperty = this.__castSortItemProperty(nextItem, activeSorter);
          const previousItemProperty = this.__castSortItemProperty(previousItem, activeSorter);

          switch (activeSorter.dataType) {
            case CasperMoacSortTypes.NUMBER:
              comparisonResult = previousItemProperty - nextItemProperty;
              break;
            case CasperMoacSortTypes.STRING:
              comparisonResult = previousItemProperty.localeCompare(nextItemProperty);
              break;
          }

          if (comparisonResult !== 0) {
            // Invert the comparison if the active sorter's direction is descending.
            return activeSorter.direction === CasperMoacSortDirections.ASCENDING
              ? comparisonResult
              : comparisonResult * -1;
          }
        }

        // If we got here, it means the objects properties that were compared are exactly the same.
        return 0;
      });
    }

    /**
     * Cast the item property to the correct data type so it can be used in comparisons.
     *
     * @param {Object} item The item whose property will be cast to String / Number.
     * @param {Object} sorter The sorter object that contains the dataType and the property name.
     */
    __castSortItemProperty (item, sorter) {
      switch (sorter.dataType) {
        case CasperMoacSortTypes.STRING:
          return (item[sorter.path] || '').toString().toLowerCase();
        case CasperMoacSortTypes.NUMBER:
          return this.__isNumeric(item[sorter.path]) ? parseFloat(item[sorter.path]) : Infinity;
      }
    }

    /**
     * Checks if the provided parameter contains a number or a numeric value.
     *
     * @param {String | Number} value The value that will be checked.
     */
    __isNumeric (value) {
      return !isNaN(parseFloat(value)) && isFinite(value);
    }
  }
}