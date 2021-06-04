import '@cloudware-casper/casper-icons/casper-icon.js';
import { IronFitBehavior } from '@polymer/iron-fit-behavior/iron-fit-behavior.js';
import { IronOverlayBehavior } from '@polymer/iron-overlay-behavior/iron-overlay-behavior.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperExpandEpaperButton extends mixinBehaviors([IronOverlayBehavior, IronFitBehavior], PolymerElement) {
  static get properties () {
    return {
      epaperExpanded: {
        type: Boolean,
        notify: true,
        value: false
      }
    }
  }

  static get template() {
    return html`
      <style>
        .open-epaper-button {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-left: -10.5px;
          height: 90px;
          width: 18px;
          border-radius: 8px 0px 0px 8px;
          color: white;
          background-color: rgb(169,169,169);
        }

        .open-epaper-button:hover {
          cursor: pointer;
          background-color: var(--primary-color);
        }
      </style>

      <div class="open-epaper-button" on-click="_showHideEpaper">
        <casper-icon hidden$=[[epaperExpanded]] icon="fa-regular:angle-left"></casper-icon>
        <casper-icon hidden$=[[!epaperExpanded]] icon="fa-regular:angle-right"></casper-icon>
      </div>
    `;
  }

  static get is () {
    return 'casper-expand-epaper-button';
  }

  ready () {
    super.ready();
  }

  cancel () {
    return;
  }

  _showHideEpaper () {
    this.epaperExpanded = !this.epaperExpanded;
  }
}
customElements.define(CasperExpandEpaperButton.is, CasperExpandEpaperButton);