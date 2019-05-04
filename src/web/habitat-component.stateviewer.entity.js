/**
 * TODOS: - add infomation of moduleId and maybe some of the the specification info
 *        - add 'last updater' (originator) info
 *
 */

import {LitElement, html} from 'lit-element';

    class HabitatComponent_Stateviewer_Entity extends LitElement {

      static get properties() {
        return {
          entityState : {type: Object},
          entity      : {type: Object}
        }
      }


      constructor() {
        super()
        this.entityState      = {}
        this.entity           = {}
        this.entity.id        = 'unknown'
        this.isRendered       = false
      }


      firstUpdated(){
        this.isRendered = true
        this.renderState(null, this.entityState)
      }


      updateState(_pathDetail, _entity, _entityState) {
        this.entityState  = _entityState
        this.entity       = _entity
        if(this.isRendered)
          this.renderState(_pathDetail, _entityState)
      }


      renderState(_pathDetail, _entityState) {
        if(_pathDetail && typeof _pathDetail.value === 'object')
          this.renderObject(_pathDetail.path, _pathDetail.value)
        else if(_pathDetail)
          this.renderPath(_pathDetail.path, _pathDetail.value)
        else
          this.renderObject('', _entityState)
      }


      renderObject(_path='', _object)
      {
        for (var property in _object)
        {
          if (_object.hasOwnProperty(property))
          {
            let curPath = _path + (_path ? '.' : '') + property
            if (typeof(_object[property]) === 'object')
              this.renderObject(curPath, _object[property])
            else
              this.renderPath(curPath, _object[property])
          }
        }
      }

      renderPath(_path, _value){
        const tableBodyElement = this.shadowRoot.querySelector('tbody')
        let   valueElementId   = _path.replace(/\./g, '-')
        let   pathValueElement = this.shadowRoot.querySelector('#' + valueElementId)
        let   newCellElement
        let   newTextElement
        let   signalElement

        if(pathValueElement)
          pathValueElement.innerHTML = _value.toString()
        else
        {
          const newRowElement = tableBodyElement.insertRow(tableBodyElement.rows.length)
          newCellElement  = newRowElement.insertCell(0)
          newTextElement  = document.createTextNode(_path)
          newCellElement.appendChild(newTextElement)

          newCellElement  = newRowElement.insertCell(1)
          newCellElement.setAttribute('id', valueElementId)
          newCellElement.classList.add('path')
          newTextElement  = document.createTextNode(_value)
          newCellElement.appendChild(newTextElement)
        }

        signalElement = pathValueElement ? pathValueElement : newCellElement

        // do some animation of the background so the user does see what has changed
        // for this we have to add some animation class and to trigger it again after change we hav to remove
        // the class and do some 'reflowing' stuff like 'signalElement.offsetHeight'. This may not be the best solution!
        // we may change this in future to use 'animationend' or any other better solution
        signalElement.classList.remove('signalAnimation')
        signalElement.offsetHeight
        signalElement.classList.add('signalAnimation')

      }


      render() {
        return html`
          <link type="text/css" rel="stylesheet" href="habitat-component.stateviewer.entity.css"/>
          <table>
            <thead>
              <tr>
                <th colspan="2" class="entity">${this.entity.id}</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        `
      }

    }

    customElements.define('habitat-stateviewer-entity', HabitatComponent_Stateviewer_Entity)