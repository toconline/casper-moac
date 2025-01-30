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

import { html } from '@polymer/polymer/lib/utils/html-tag.js';

export const CasperMoacStylesMixin = superClass => {
  return class extends superClass {

    static __styles () {
      return html`
        ${this.__genericStyles()}
        ${this.__casperMoacColumnStyles()}
        ${this.__casperMoacSortColumnStyles()}
        ${this.__casperMoacToggleColumnStyles()}
      `;
    }

    /**
     * This method returns the styles that will be used for the casper-moac-column component.
     */
    static __casperMoacColumnStyles () {
      return html`
        <style>
          .casper-moac-column {
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        </style>
      `;
    }

    /**
     * This method returns the styles that will be used for the casper-moac-toggle-column component.
     */
    static __casperMoacToggleColumnStyles () {
      return html`
        <style>
          .casper-moac-toggle-column {
            width: 100%;
            display: inline-flex;
            user-select: none;
          }

          .casper-moac-toggle-column .toggle-buttons-container {
            display: inline-flex;
            border: solid 1px rgba(12, 84, 96, .7);
            border-radius: 7.5px;
            background-color: rgba(12, 84, 96, .5);
            margin: 2px 0;
          }

          .casper-moac-toggle-column .toggle-buttons-container .toggle-button {
            display: inline-block;
            padding: 2px 15px;
            opacity: .5;
          }

          .casper-moac-toggle-column .toggle-buttons-container .selected-toggle-button {
            background-color: #fff;
            border-radius: 7px;
            color: var(--primary-color);
            box-shadow: 2px 2px 3px rgb(12, 84, 96);
            opacity: 1;
          }

          .casper-moac-toggle-column .toggle-buttons-container span:not(.selected-toggle-button):hover {
            background-color: rgba(12, 84, 96, .7);
            cursor: pointer;
            border-radius: 4px;
          }
        </style>
      `;
    }

    /**
     * This method returns the styles that will be used for the casper-moac-sort-column component.
     */
    static __casperMoacSortColumnStyles () {
      return html`
        <style>
          .casper-moac-sort-column {
            width: 100%;
            display: inline-flex;
            user-select: none;
          }

          .casper-moac-sort-column:hover {
            cursor: pointer;
          }

          .casper-moac-sort-column .header-title {
            flex-shrink: 1;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .casper-moac-sort-column .header-sort {
            flex-shrink: 0;
            margin-left: 5px;
            display: flex;
            align-items: center;
          }

          .casper-moac-sort-column .header-sort casper-icon {
            width: 15px;
            height: 15px;
            color: white;
          }

          .casper-moac-sort-column .header-sort .header-sort-order {
            width: 10px;
            font-size: 10px;
          }
        </style>
      `;
    }

    /**
     * This method returns the styles that will be used for the casper-moac component.
     */
    static __genericStyles () {
      return html`
        <style include="casper-common-styles">
          .main-container {
            display: flex;
            height: 100%;
          }

          .main-container vaadin-split-layout {
            height: 100%;
            flex-grow: 1;
            transform: unset;
          }

          .main-container vaadin-split-layout .left-side-container {
            padding: 15px;
            display: flex;
            flex-direction: column;
          }

          .main-container vaadin-split-layout .left-side-container .header-container {
            display: flex;
            flex-wrap: wrap;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--primary-color);
            justify-content: center;
          }

          .main-container vaadin-split-layout .left-side-container .header-container-expanded {
            border-bottom: 0px solid var(--primary-color);
          }

          .main-container vaadin-split-layout .left-side-container .top-container {
            padding-bottom: 10px;
            border-bottom: 1px solid var(--primary-color);
            max-height: 0%;
            transition: all 0.4s ease-in-out;
          }

          .main-container vaadin-split-layout .left-side-container .top-container-expanded {
            max-height: 200%; /* Martelada: some moacs don't have 100% max-height */
          }

          .main-container vaadin-split-layout .left-side-container .header-container.header-container--responsive {
            flex-direction: column;
          }

          .main-container vaadin-split-layout .left-side-container .header-container > * {
            flex: 1;
          }

          .main-container vaadin-split-layout .left-side-container .header-container .header-left-side-container {
            display: flex;
            user-select: none;
          }

          .main-container vaadin-split-layout .left-side-container .header-container .generic-filter-container {
            display: flex;
            flex-grow: 1;
            flex-direction: column;
            padding: 0 10px;
            text-align: center;
            position: relative;
          }

          /* Filter paper-input */
          .main-container vaadin-split-layout .left-side-container .header-container .generic-filter-container #filterInput {
            margin: 0;
            padding: 0;
            height: 35px;
            outline: none;
            font-size: 13px;
            padding-left: 10px;
            border-radius: 3px;
            align-items: center;
            box-sizing: border-box;
            border: 1px solid lightgrey;
            transition: border 250ms linear,
                        background-color 250ms linear;
          }

          .main-container vaadin-split-layout .left-side-container .header-container .generic-filter-container #filterInputIcon {
            top: 10px;
            right: 20px;
            width: 15px;
            height: 15px;
            position: absolute;
            color: var(--primary-color);
          }

          .main-container vaadin-split-layout .left-side-container .header-container .generic-filter-container #filterInputIcon:hover {
            cursor: pointer;
            color: var(--dark-primary-color);
          }

          .main-container vaadin-split-layout .left-side-container .display-all-filters-btn {
            margin: 0;
            width: 100%;
            height: 35px;
            outline: none;
            line-height: 35px;
            font-size: 0.85em;
            font-weight: bold;
            text-transform: unset;
            color: var(--primary-color);
            transition: background-color 100ms linear;
          }

          .main-container vaadin-split-layout .left-side-container .display-all-filters-btn:hover {
            background-color: rgba(var(--primary-color-rgb), 0.2);
          }

          .main-container vaadin-split-layout .left-side-container .display-all-filters-btn casper-icon {
            width: 15px;
            height: 15px;
            margin-left: 5px;
            transition: transform 200ms linear;
            color: var(--primary-color);
          }

          .main-container vaadin-split-layout .left-side-container .display-all-filters-btn casper-icon[rotate] {
            transform: rotate(180deg);
          }

          .main-container vaadin-split-layout .left-side-container .display-all-filters-hide {
            background-color: rgba(var(--primary-color-rgb), 0.2);
          }

          /* Active filters summary */
          .main-container vaadin-split-layout .left-side-container .header-container .active-filters {
            display: flex;
            font-size: 0.85em;
            flex-direction: column;
          }

          .main-container vaadin-split-layout .left-side-container .header-container.header-container--responsive .active-filters {
            margin-top: 10px;
          }

          .main-container vaadin-split-layout .left-side-container .header-container .active-filters .header {
            display: flex;
            line-height: 20px;
            margin-bottom: 10px;
            align-items: center;
            justify-content: space-between;
          }

          .main-container vaadin-split-layout .left-side-container .header-container .active-filters .header .header-title {
            display: flex;
            align-items: center;
          }

          .main-container vaadin-split-layout .left-side-container .header-container .active-filters .header .header-title casper-icon {
            width: 20px;
            height: 20px;
            padding: 5px;
            border-radius: 50%;
            margin-right: 5px;
            box-sizing: border-box;
            background-color: var(--primary-color);
            color: white;
          }

          .main-container vaadin-split-layout .left-side-container .header-container .active-filters .header .header-title casper-icon:hover {
            cursor: pointer;
            background-color: var(--dark-primary-color);
          }

          .main-container vaadin-split-layout .left-side-container .header-container .active-filters .header .header-title casper-icon-button {
            height: 25px;
            padding: 4px 8px;
          }

          .main-container vaadin-split-layout .left-side-container .header-container .active-filters .active-filters-list {
            display: flex;
            flex-wrap: wrap;
          }

          .main-container vaadin-split-layout .left-side-container .header-container .active-filters .no-active-filters {
            color: #A5A5A5;
          }

          /* Active filters */
          .main-container vaadin-split-layout .left-side-container .filters-container {
            display: grid;
            padding: 10px;
            grid-row-gap: 10px;
            grid-column-gap: 10px;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          }

          .main-container vaadin-split-layout .left-side-container .filters-container casper-select {
            --casper-select-single-paper-input-container-label: { font-size: 14px; };
            --casper-select-single-paper-input-container-input: { font-size: 14px; };
          }

          .main-container vaadin-split-layout .left-side-container .filters-container casper-select[multi-selection] {
            --paper-input-container-label: { font-size: 14px; };
          }

          .main-container vaadin-split-layout .left-side-container .filters-container paper-input {
            --paper-input-container-label: { font-size: 14px; };
            --paper-input-container-input: { font-size: 14px; };
          }

          /* Casper tabs container inside the filters container */
          .main-container vaadin-split-layout .left-side-container .filters-container .casper-tabs-container {
            grid-column: 1 / -1;
            display: inline-flex;
            justify-content: center;
            margin-bottom: -10px;
          }

          .main-container vaadin-split-layout .left-side-container .filters-container .filter-container-invisible {
            display: none;
          }

          .main-container vaadin-split-layout .left-side-container .filters-container .filter-container.filter-container--double-width {
            grid-column: span 2;
          }

          .main-container vaadin-split-layout .left-side-container .filters-container .filter-container paper-input,
          .main-container vaadin-split-layout .left-side-container .filters-container .filter-container paper-checkbox,
          .main-container vaadin-split-layout .left-side-container .filters-container .filter-container casper-select,
          .main-container vaadin-split-layout .left-side-container .filters-container .filter-container casper-date-picker {
            width: 100%;
          }

          .main-container vaadin-split-layout .left-side-container .filters-container .filter-container paper-checkbox {
            margin-top: 25px;
          }

          .main-container vaadin-split-layout .left-side-container #active-sorters-container {
            display: flex;
            padding: 10px;
            padding-bottom: 0;
            font-size: 0.75em;
            align-items: center;
            box-sizing: border-box;
          }

          .main-container vaadin-split-layout .left-side-container #active-sorters-container strong {
            margin-right: 10px;
          }

          .main-container vaadin-split-layout .left-side-container #active-sorters-container casper-icon-button {
            height: 25px;
            padding: 4px 8px;
          }

          .main-container vaadin-split-layout .left-side-container #active-sorters-container casper-icon-button:not(:last-of-type) {
            margin-right: 8px;
          }

          /* Vaadin-grid */
          .main-container vaadin-split-layout .left-side-container .grid-no-items {
            left: 0;
            top: 36px;
            width: 100%;
            height: 100%;
            display: flex;
            font-size: 18px;
            font-weight: bold;
            position: absolute;
            text-align: center;
            align-items: center;
            flex-direction: column;
            justify-content: center;
            color: var(--status-gray);
            background: var(--no-grid--background-color, rgba(0, 0, 0, 0.1));
          }

          .main-container vaadin-split-layout .left-side-container .grid-no-items casper-icon {
            background: var(--no-grid--icon--background-color);
            padding: var(--no-grid--icon--padding);
            border-radius: var(--no-grid--icon--border-radius);
            border: var(--no-grid--icon--border);

            width: var(--no-grid--icon--width, '100px');
            height: var(--no-grid--icon--height, '100px');
            margin-bottom: 25px;
            color: var(--no-grid--icon--color, var(--status-gray));
          }

          .main-container vaadin-split-layout .left-side-container #spinner {
            width: 75px;
            height: 75px;
            position: absolute;
            pointer-events: none;
            top: calc(50% - 32.5px);
            left: calc(50% - 32.5px);
            --paper-spinner-stroke-width: 8px;
            --paper-spinner-layer-1-color: var(--primary-color);
            --paper-spinner-layer-2-color: var(--primary-color);
            --paper-spinner-layer-3-color: var(--primary-color);
            --paper-spinner-layer-4-color: var(--primary-color);
          }

          .main-container vaadin-split-layout .left-side-container #multi-selection-container {
            height: 0;
            flex-shrink: 0;
            overflow: hidden;
            transition: height 100ms linear;
          }

          .main-container vaadin-split-layout .left-side-container #multi-selection-container .grid-multiple-selection {
            display: flex;
            overflow: hidden;
            padding: 10px;
            align-items: center;
            background-color: #1A39601A;
            justify-content: space-between;
            transition: height 100ms linear;
          }

          .main-container vaadin-split-layout .left-side-container #multi-selection-container .grid-multiple-selection .grid-multiple-selection-label {
            font-size: 0.75em;
            margin-right: 10px;
            color: var(--primary-color);
          }

          .main-container vaadin-split-layout .left-side-container #multi-selection-container .grid-multiple-selection .grid-multiple-selection-icons {
            display: flex;
            flex-wrap: wrap;
            margin: -10px 0 0 0;
          }

          .main-container vaadin-split-layout .left-side-container .grid-container {
            flex-grow: 1;
            display: flex;
            margin-top: 10px;
            min-height: 250px;
            position: relative;
            flex-direction: column;
          }

          .main-container vaadin-split-layout .left-side-container .grid-container #floating-context-menu {
            height: 30px;
            display: none;
            padding: 0 5px;
            position: absolute;
            align-items: center;
            border-top-left-radius: 30px;
            border-bottom-left-radius: 30px;
          }

          .main-container vaadin-split-layout .left-side-container .grid-container #floating-context-menu casper-icon,
          .main-container vaadin-split-layout .left-side-container .grid-container #floating-context-menu slot[name="floating-context-menu-actions"]::slotted(casper-icon) {
            width: 25px;
            height: 25px;
            padding: 4px;
            border-radius: 50%;
            box-sizing: border-box;
            color: var(--primary-color);
          }

          .main-container vaadin-split-layout .left-side-container .grid-container #floating-context-menu casper-icon:hover,
          .main-container vaadin-split-layout .left-side-container .grid-container #floating-context-menu slot[name="floating-context-menu-actions"]::slotted(casper-icon:not([no-hover-animation]):hover) {
            z-index: 1;
            color: white;
            cursor: pointer;
            background-color: var(--primary-color);
          }

          .main-container vaadin-split-layout .left-side-container .grid-container vaadin-grid {
            border-top-left-radius: 5px;
            border-top-right-radius: 5px;
            overflow: hidden;
          }

          .main-container vaadin-split-layout .right-side-container .epaper-container {
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .epaper-transition-class {
            transition: width 700ms ease-in-out;
          }

        </style>
      `;
    }
  }
}
