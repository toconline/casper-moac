/* 
 * Copyright (C) 2020 Cloudware S.A. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

export const CasperMoacContextMenuMixin = superClass => {
  return class extends superClass {

    static get properties () {
      return {
        /**
         * The row currently being hovered.
         *
         * @type {Object}
         */
        hoveringRow: {
          type: Object,
          notify: true
        },
        /**
         * The row's item currently being hovered.
         *
         * @type {Object}
         */
        hoveringRowItem: {
          type: Object,
          notify: true
        },
      };
    }

    /**
     * Bind event listeners to the context menu component if there is any.
     */
    __bindContextMenuEvents () {
      // Check if there is a casper-context-menu.
      this.__contextMenu = Array.from(this.children).find(child => child.getAttribute('slot') === 'context-menu');
      this.__displayContextMenu = !!this.__contextMenu;

      if (!this.__contextMenu) return;

      this.__contextMenu.noOverlap = true;
      this.__contextMenu.dynamicAlign = true;
      this.__contextMenu.verticalAlign = 'auto';
      this.__contextMenu.horizontalAlign = 'auto';
      this.__floatingContextMenu = this.shadowRoot.querySelector('#floating-context-menu');

      const gridBody = this.$.grid.shadowRoot.querySelector('tbody');
      const gridContainer = this.shadowRoot.querySelector('.grid-container');
      const gridScroller = this.$.grid.shadowRoot.querySelector('vaadin-grid-outer-scroller');

      // Hide the floating context menu as soon as the user leaves the grid if the context menu is not open or when the user scrolls the grid.
      gridScroller.addEventListener('scroll', () => { this.__hideFloatingContextMenu(); });

      gridBody.addEventListener('mouseleave', event => this.__hideFloatingContextMenu(event));
      gridContainer.addEventListener('mouseleave', event => this.__hideFloatingContextMenu(event));

      // Display the floating context menu when the user hovers on a row.
      gridBody.addEventListener('mouseover', event => {
        const row = event.composedPath().find(element => element.nodeName && element.nodeName.toLowerCase() === 'tr');

        if (!row || row === this.hoveringRow) return;

        const rowBoundingRect = row.getBoundingClientRect();
        const gridBoundingRect = gridContainer.getBoundingClientRect();

        // Store the row and item we're currently hovering.
        this.hoveringRow = row;
        this.hoveringRowItem = row._item;

        // Check if the row should hide the floating icon
        if (this.hoveringRowItem.hideFloatingIcon) return;

        // Check if the row is totally visible.
        if (this.__isRowTotallyInView(row)) {
          this.__floatingContextMenu.style.display = 'flex';
          this.__floatingContextMenu.style.top = `${rowBoundingRect.top - gridBoundingRect.top + 2}px`;
          this.__floatingContextMenu.style.right = gridScroller.clientHeight === gridScroller.scrollHeight ? 0 : `${gridScroller.offsetWidth - gridScroller.clientWidth}px`;
          this.__paintFloatingContextMenu();

          // This is used so the users don't get confused when the context menu is open in one line and the floating context menu on another line.
          if (this.__contextMenu.opened) {
            this.__contextMenu.close();
          }
        } else {
          this.__hideFloatingContextMenu();
        }
      });

      // When the user clicks anywhere in the floating context menu, activate that row and change its background color.
      this.__floatingContextMenu.addEventListener('click', () => {
        this.activeItem = this.hoveringRowItem;
      });

      // Close the floating context menu when the other menu closes and user is not currently hovering the table.
      this.__contextMenu.addEventListener('opened-changed', event => {
        if (!event.detail.value && !gridBody.matches(':hover')) {
          this.__hideFloatingContextMenu();
        }
      })
    }

    /**
     * This method closes the floating context menu.
     *
     * @param {Object} event The event's object.
     */
    __hideFloatingContextMenu (event) {
      if (event && event.relatedTarget && (
        this.__contextMenu.opened ||
        event.relatedTarget === app.tooltip ||
        event.relatedTarget === this.__floatingContextMenu ||
        event.relatedTarget.parentElement === this.__floatingContextMenu ||
        (event.relatedTarget.assignedSlot && event.relatedTarget.assignedSlot.name === 'floating-context-menu-actions')
      )) return;

      this.hoveringRow = null;
      this.hoveringRowItem = null;
      this.__floatingContextMenu.style.display = 'none';
    }

    /**
     * Changes the background color of the floating context menu according to the row he's hovering over.
     */
    __paintFloatingContextMenu () {
      if (!this.hoveringRowItem || !this.__contextMenu) return;

      this.__floatingContextMenu.style.backgroundColor = this.__getRowBackgroundColor(this.hoveringRowItem);
    }
  }
};
