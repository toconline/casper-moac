/*
  - Copyright (c) 2014-2016 Cloudware S.A. All rights reserved.
  -
  - This file is part of casper-moac.
  -
  - casper-moac is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as published by
  - the Free Software Foundation, either version 3 of the License, or
  - (at your option) any later version.
  -
  - casper-moac  is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with casper-moac.  If not, see <http://www.gnu.org/licenses/>.
  -
 */

import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

class CasperMoac extends PolymerElement {

  static get is () {
    return 'casper-moac';
  }

  static get properties () {
    return {
      // The page that is currently displayed.
      page: {
        type: Number,
        value: 1,
      },
      // Number of results that will be displayed per page.
      resultsPerPage: {
        type: Number,
        value: 50,
      },
      // The JSON API resource name that will be used to build the URL.
      resourceName: String,
      // List of attributes that should be displayed on the iron-list.
      resourceListAttributes: Array,
      // Attribute that will be used to order the JSON API results.
      resourceOrderAttribute: String
    };
  }
}
