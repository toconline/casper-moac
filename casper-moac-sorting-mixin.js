import { CasperMoacSortTypes, CasperMoacSortDirections } from './casper-moac-constants';

export const CasperMoacSortingMixin = superClass => {
  return class extends superClass {

    __bindSorterEvents () {
      this.__activeSorters = [];
      this.__sorters = [
        ...this.shadowRoot.querySelector('slot[name="grid-before"]').assignedElements().filter(assignedElement => assignedElement.nodeName.toLowerCase() === 'casper-moac-sort-column'),
        ...this.shadowRoot.querySelector('slot[name="grid"]').assignedElements().filter(assignedElement => assignedElement.nodeName.toLowerCase() === 'casper-moac-sort-column'),
      ];

      this.__sorters.forEach(sorterColumn => {
        sorterColumn.addEventListener('direction-changed', event => {
          const sorter = event.target;

          const existingSorterIndex = this.__activeSorters.findIndex(activeSorter => activeSorter === sorter);
          if (existingSorterIndex === -1) {
            // This means the current sorter does not yet exist.
            this.__activeSorters.push(sorter);
          } else {
            // This means the sorter already exists so it needs to be removed in case it's not sorting anymore.
            if (!sorter.direction) {
              this.__activeSorters.splice(existingSorterIndex, 1);
            }
          }

          // Loop through all the sorters and display the sorterOrder if necessary.
          this.__sorters.forEach(sorter => {
            const activeSorterIndex = this.__activeSorters.findIndex(activeSorter => activeSorter === sorter);

            sorter.sortOrder = this.__activeSorters.length > 1 && activeSorterIndex !== -1
              ? activeSorterIndex + 1
              : '';
          });

          !this.lazyLoad
            ? this.__filterItems()
            : this.__filterLazyLoadItems();
        });
      });
    }

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
        case CasperMoacSortTypes.STRING: return item[sorter.path].toString().toLowerCase();
        case CasperMoacSortTypes.NUMBER: return parseFloat(item[sorter.path]);
      }
    }
  }
}