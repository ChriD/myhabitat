/**
 * TODOS: - add filter for entityIs, entityModule and/or path
 *
 */

import {LitElement, html} from 'lit-element';

    class HabitatComponent_Stateviewer extends LitElement {

      static get properties() {
        return {
        }
      }


      constructor() {
        super()
      }


      updateState(_entityId, _entity, _pathDetail, _entityState) {
        // check if we do have a state entity object for the given entity.
        // If so update it, otherwise we have to create a new one
        let entityElementId = 'stateEntity-' + _entityId
        let entityStateViewerElement = this.shadowRoot.querySelector('#' + entityElementId)
        if(!entityStateViewerElement)
        {
          let stateViewerEntityContainerElement = this.shadowRoot.querySelector('.stateViewerEntityContainer')
          entityStateViewerElement = document.createElement('habitat-stateviewer-entity')
          entityStateViewerElement.setAttribute("id", entityElementId)
          stateViewerEntityContainerElement.appendChild(entityStateViewerElement)
        }
        // update the state on the found or created entity state viewer element
        entityStateViewerElement.updateState(_pathDetail, _entity, _entityState)
      }


      render() {
        return html`
          <link type="text/css" rel="stylesheet" href="habitat-component.stateviewer.css"/>
          <div class="stateViewerEntityContainer"></div>
        `
      }

    }

    customElements.define('habitat-stateviewer', HabitatComponent_Stateviewer)