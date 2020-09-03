import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

export const CasperMoacGridMixin = superClass => {
  return class extends superClass {

    /**
     * This method focuses the cell of the row which is currently active.
     */
    focusActiveCell () {
      if (!this.__activeItem) return;

      // Make sure the active row is currently in view.
      this.__scrollToItemIfNotVisible(this.__activeItem[this.idInternalProperty]);

      afterNextRender(this, () => this.__getTableActiveCell().focus());
    }

    /**
     * This method adds a scroll event listener to paint the active row due to the grid's constant re-usage of rows and replaces the existing
     * vaadin-checkbox header since it the default codebase does not meet our requirements.
     */
    __bindVaadinGridEvents () {
      this.$.grid.addEventListener('keydown', event => this.__handleGridKeyDownEvents(event));
      this.$.grid.addEventListener('column-resize', event => { event.detail.resizedColumn.flexGrow = 1; });
      this.$.grid.addEventListener('casper-moac-tree-toggle-expanded-changed', event => this.__handleGridTreeToggleEvents(event));

      this.gridScroller.addEventListener('scroll', () => {
        this.__paintGridRows();

        if (this.__contextMenu && this.__contextMenu.opened) {
          this.__contextMenu.close();
        }
      });

      if (!this.disableSelection) {
        afterNextRender(this, () => {
          this.__getAllTableHeaders().forEach(header => {
            const selectAllCheckbox = header.querySelector('slot').assignedElements().shift().firstElementChild;

            if (selectAllCheckbox && selectAllCheckbox.nodeName.toLowerCase() === 'vaadin-checkbox') {
              // Create a vaadin-checkbox to replace the default one which has bugs.
              this.__selectAllCheckbox = document.createElement('vaadin-checkbox');
              this.__selectAllCheckbox.addEventListener('checked-changed', event => {
                // Lock the vaadin-checkbox event handler to avoid infinite loops.
                if (this.__selectAllCheckboxLock) return;

                this.__selectedItems = !event.detail.value ? [] : [...this.__selectableItems()];
              });

              selectAllCheckbox.parentElement.appendChild(this.__selectAllCheckbox);
              selectAllCheckbox.remove();
            }
          });
        });
      }
    }

    /**
     * This method handles the click on the casper-moac-tree-toggle components and expands / collapses the row.
     *
     * @param {Event} event The event's object.
     */
    __handleGridTreeToggleEvents (event) {
      const parentItem = this.activeItem = this.$.grid.getEventContext(event).item;

      const treeToggleComponent = event.composedPath().shift();
      treeToggleComponent.disabled = true;

      event.detail.expanded
        ? this.expandItem(parentItem)
        : this.collapseItem(parentItem);

      treeToggleComponent.disabled = false;
    }

    /**
     * Bind event listeners for when the user presses down the arrow keys.
     *
     * @param {Event} event The event's object.
     */
    __handleGridKeyDownEvents (event) {
      const keyCode = event.key || event.code;

      // Ignore the event if there are no items, the user is typing in the filter input or it's not an arrow key event.
      if (this.displayedItems.length === 0 || !['ArrowUp', 'ArrowDown'].includes(keyCode)) return;

      // If the user is navigating in the grid, activate the row in which the user currently is.
      if (this.shadowRoot.activeElement === this.grid) {
        this.__activeItem = this.__getTableActiveCell().parentElement._item;
      }

      this.__paintGridRows();

      // If the active item changed, debounce the active item change.
      if (!this.__scheduleActiveItem || !this.__compareItems(this.__activeItem, this.__scheduleActiveItem)) {
        // This property is used to avoid delaying infinitely activating the same item which is caused when the user
        // maintains the up / down arrows after reaching the first / last result in the table.
        this.__scheduleActiveItem = { ...this.__activeItem };

        // Only debounce when the event is repeated, meaning the user keeps the key pressed or if the activeItemDebounce was specifically set.
        if (event.repeat || this.activeItemDebounce) {
          this.__debounce('__activeItemDebouncer', () => {
            this.activeItem = this.__scheduleActiveItem;
          }, this.activeItemDebounce || 300);
        } else {
          this.__cancelDebounce('__activeItemDebouncer');
          this.activeItem = this.__scheduleActiveItem;
        }
      }
    }

    /**
     * Hides or displays the select all checkbox.
     */
    __disableAllSelectionChanged () {
      this.__getAllTableHeaders().forEach(tableHeader => {
        const assignedElement = tableHeader.firstElementChild.assignedElements().shift().firstElementChild;

        if (assignedElement && assignedElement.nodeName.toLowerCase() === 'vaadin-checkbox') {
          this.disableAllSelection
            ? assignedElement.style.display = 'none'
            : assignedElement.style.display = '';
        }
      });
    }

    /**
     * This method returns all the grid's headers.
     */
    __getAllTableHeaders () {
      return Array.from(this.$.grid.shadowRoot.querySelectorAll('table thead th'));
    }

    /**
     * This method returns all the grid's rows.
     */
    __getAllTableRows () {
      return Array.from(this.$.grid.shadowRoot.querySelectorAll('table tbody tr'));
    }

    /**
     * This method returns the current grid's active cell.
     */
    __getTableActiveCell () {
      return this.$.grid.shadowRoot.querySelector('td[tabindex="0"]');
    }
  }
};