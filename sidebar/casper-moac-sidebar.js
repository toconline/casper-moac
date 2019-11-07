import '@casper2020/casper-icons/casper-icon.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperMoacSidebar extends PolymerElement {

  static get is () {
    return 'casper-moac-sidebar';
  }

  static get properties () {
    return {
      open: {
        type: Boolean,
        value: true,
        reflectToAttribute: true
      }
    };
  }

  static get template () {
    return html`
      <style>
        :host {
          width: 0;
          flex-grow: 0;
          flex-shrink: 0;
          position: relative;
          border-left: 1px solid #E2E2E2;
          transition: width 100ms linear;
        }

        :host([open]) {
          width: var(--casper-moac-sidebar-width, 250px);
        }

        #sidebar-items-container {
          overflow: auto;
          max-height: 100%;
        }

        #sidebar-trigger {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 75px;
          left: -50px;
          opacity: 0.2;
          background-color: #E2E2E2;
          transition: opacity 200ms linear;
        }

        #sidebar-trigger:hover {
          opacity: 1;
          cursor: pointer;
        }

        #sidebar-trigger casper-icon {
          transition: transform 200ms linear;
        }

        #sidebar-trigger casper-icon[rotate] {
          transform: rotate(180deg);
        }
      </style>

      <div id="sidebar-items-container">
        <slot></slot>
      </div>

      <div id="sidebar-trigger">
        <casper-icon rotate$="[[open]]" icon="fa-solid:chevron-left"><casper-icon>
      </div>
    `;
  }

  ready () {
    super.ready();

    this.$['sidebar-trigger'].addEventListener('click', () => {
      this.open = !this.open;
    });
  }
}

customElements.define(CasperMoacSidebar.is, CasperMoacSidebar);
