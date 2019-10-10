import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-icon/iron-icon.js';
import '@casper2020/casper-icons/casper-icons.js';

class CasperMoacTreeToggle extends PolymerElement {

  static get is () {
    return 'casper-moac-tree-toggle';
  }

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
      childrenCount: Number
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
        }

        :host([expanded]) #tree-toggle-container {
          color: var(--primary-color);
        }

        :host #tree-toggle-container iron-icon {
          width: 10px;
          height: 10px;
        }

        :host([expanded]) #tree-toggle-container iron-icon {
          transform: rotate(90deg);
        }
      </style>

      <template is="dom-if" if="[[hasChildren]]">
        <div id="tree-toggle-container">
          <iron-icon icon="casper-icons:caret-right"></iron-icon>
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

customElements.define(CasperMoacTreeToggle.is, CasperMoacTreeToggle);