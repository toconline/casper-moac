import '@casper2020/casper-icons/casper-icon.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperMoacTreeToggle extends PolymerElement {

  static get properties () {
    return {
      /**
       * This boolean property states if the tree is currently expanded or not.
       *
       * @typee {Boolean}
       */
      expanded: {
        type: Boolean,
        value: false,
        notify: true,
        reflectToAttribute: true
      },
      /**
       * If the current item does not have any children, the tree toggle will not be drawn.
       *
       * @type {Boolean}
       */
      hasChildren: Boolean,
      /**
       * Number of children of the current item.
       *
       * @type {Number}
       */
      childrenCount: Number,
      /**
       * Flag that states if the contraction / expansion of the component is enabled.
       *
       * @type {Boolean}
       */
      disabled: {
        type: Boolean,
        value: false
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host #tree-toggle-container {
          display: flex;
          color: darkgrey;
          user-select: none;
          align-items: center;
          transition: color 200ms linear;
        }

        :host #tree-toggle-container:hover {
          cursor: pointer;
          color: var(--primary-color);
          --casper-icon-fill-color: var(--primary-color);
        }

        :host([expanded]) #tree-toggle-container {
          color: var(--primary-color);
        }

        :host #tree-toggle-container:hover casper-icon,
        :host([expanded]) #tree-toggle-container casper-icon {
          --casper-icon-fill-color: var(--primary-color);
        }

        :host #tree-toggle-container casper-icon {
          width: 15px;
          height: 15px;
          --casper-icon-fill-color: darkgrey;
        }

        :host([expanded]) #tree-toggle-container casper-icon {
          transform: rotate(90deg);
        }
      </style>

      <template is="dom-if" if="[[hasChildren]]">
        <div id="tree-toggle-container">
          <casper-icon icon="fa-solid:caret-right"></casper-icon>
          [[childrenCount]]
        </div>
      </template>
    `;
  }

  ready () {
    super.ready();

    this.addEventListener('click', event => {
      // This is used to avoid activating / de-activating the items.
      event.stopImmediatePropagation();

      if (this.disabled) return;

      this.expanded = !this.expanded;

      // Dispatch an event to inform the casper-moac element that a toggle was changed.
      this.dispatchEvent(new CustomEvent('casper-moac-tree-toggle-expanded-changed', {
        bubbles: true,
        composed: true,
        detail: { expanded: this.expanded }
      }));
    });
  }
}

customElements.define('casper-moac-tree-toggle', CasperMoacTreeToggle);
