import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';
import { CasperMoacSortTypes, CasperMoacSortDirections } from '../casper-moac-constants.js';

export const CasperMoacSortingMixin = superClass => {
  return class extends superClass {

    /**
     * This method will handle the currently active sorters and re-fetch the items when the grid is lazy loaded
     * or sort locally otherwise everytime a sorter changes.
     */
    __bindSorterEvents () {
      const activeSorters = [];
      this.__sorters = [
        ...this.shadowRoot.querySelector('slot[name="grid-before"]').assignedElements().filter(assignedElement => assignedElement.nodeName.toLowerCase() === 'casper-moac-sort-column'),
        ...this.shadowRoot.querySelector('slot[name="grid"]').assignedElements().filter(assignedElement => assignedElement.nodeName.toLowerCase() === 'casper-moac-sort-column'),
      ];

      this.__sorters.forEach(sorterColumn => {
        sorterColumn.addEventListener('direction-changed', event => {
          const sorter = event.target;

          const existingSorterIndex = activeSorters.findIndex(activeSorter => activeSorter === sorter);
          if (existingSorterIndex === -1) {
            // This means the current sorter does not yet exist.
            activeSorters.push(sorter);
          } else {
            // This means the sorter already exists so it needs to be removed in case it's not sorting anymore.
            if (!sorter.direction) {
              activeSorters.splice(existingSorterIndex, 1);
            }
          }

          // Loop through all the sorters and display the sorterOrder if necessary.
          this.__sorters.forEach(sorter => {
            const activeSorterIndex = activeSorters.findIndex(activeSorter => activeSorter === sorter);

            sorter.sortOrder = activeSorters.length > 1 && activeSorterIndex !== -1 ? activeSorterIndex + 1 : '';
          });

          this.__activeSorters = [];
          afterNextRender(this, () => this.__activeSorters = activeSorters);

          !this.lazyLoad
            ? this.__filterItems()
            : this.__filterLazyLoadItems();
        });
      });
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

    /**
     * This method returns the icon that should be used when displaying the currently active sorters.
     *
     * @param {String} direction The active sorter current direction.
     */
    __getActiveSorterIcon (direction) {
      return direction === 'desc'
        ? 'fa-solid:sort-down'
        : 'fa-solid:sort-up';
    }
  }
}