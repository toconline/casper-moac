import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { IronOverlayBehavior } from '@polymer/iron-overlay-behavior/iron-overlay-behavior.js';

class CasperMoacMenuItems extends mixinBehaviors(IronOverlayBehavior, PolymerElement) {

  static get template () {
    return html`
      <style>
        :host {
          max-width: 25vw;
        }

        .items-container {
          display: flex;
          flex-direction: column;
        }
      </style>
      <div class="items-container">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('casper-moac-menu-items', CasperMoacMenuItems);