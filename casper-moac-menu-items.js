import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { IronOverlayBehavior } from '@polymer/iron-overlay-behavior/iron-overlay-behavior.js';

class CasperMoacMenuItems extends mixinBehaviors(IronOverlayBehavior, PolymerElement) {

  static get is () {
    return 'casper-moac-menu-items';
  }

  static get template () {
    return html`
      <style>
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

customElements.define(CasperMoacMenuItems.is, CasperMoacMenuItems);