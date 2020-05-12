import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

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
      gridContainer.addEventListener('mouseleave', () => {
        if (!this.__contextMenu.opened) {
          this.__hideFloatingContextMenu();
        }
      });

      // Display the floating context menu in a specific row.
      gridBody.addEventListener('mouseover', event => {
        const row = event.composedPath().find(element => element.nodeName && element.nodeName.toLowerCase() === 'tr');
        const rowBoundingRect = row.getBoundingClientRect();
        const gridBoundingRect = gridContainer.getBoundingClientRect();

        // Store the row and item we're currently hovering.
        this.hoveringRow = row;
        this.hoveringRowItem = row._item;

        // Check if the row is totally visible.
        if (this.__isRowTotallyInView(row)) {
          this.__floatingContextMenu.style.display = 'flex';
          this.__floatingContextMenu.style.top = `${rowBoundingRect.top - gridBoundingRect.top}px`;
          this.__floatingContextMenu.style.right = gridScroller.clientHeight === gridScroller.scrollHeight ? 0 : `${gridScroller.offsetWidth - gridScroller.clientWidth}px`;
          this.__paintFloatingContextMenu();
        } else {
          this.__hideFloatingContextMenu();
        }
      });

      // When the user clicks anywhere in the floating context menu, activate that row and change its background color.
      this.__floatingContextMenu.addEventListener('click', () => {
        this.activeItem = this.hoveringRowItem;
      });

      // Hide the floating context menu as soon as the other context menu closes.
      this.__contextMenu.addEventListener('opened-changed', event => {
        if (!event.detail.value) {
          this.__hideFloatingContextMenu();
        }
      });
    }

    /**
     * This method closes the floating context menu.
     */
    __hideFloatingContextMenu () {
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