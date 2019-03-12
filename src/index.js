/* eslint-disable no-console */
/* global exports, define, module, history, cancelAnimationFrame, CustomEvent, InvalidCharacterError, Sizes*/
(function () {
  'use strict'

  let fixedHeader
  let headerHeight
  let animationInterval
  let siblingNavigation = null
  let parentElement = null
  let doc = document
  let win = window
  let body = doc.body
  let docElement = doc.documentElement
  /** Default settings */
  let settings = {
    // Selectors
    header: null,
    topOnEmptyHash: true,

    // Speed & Duration
    speed: 1000,
    speedAsDuration: false,
    durationMax: null,
    durationMin: null,
    clip: true,
    offset: 0,

    // Easing
    easing: 'easeInOutCubic',
    customEasing: false,

    // History
    updateURL: false, // true
    popstate: true,

    // Custom Events
    emitEvents: true,

    tracking: true, // отслеживаем попадание в область просмотра один раз

    // up and down buttons
    buttonClass: 'button-navigation',
    top: 100,
    bottom: 100,

    // navigation
    navigation: 'bottom'

  }

  let qerySelector = (name) => doc.querySelector(name)
  let floor = Math.floor
  let max = Math.max
  let min = Math.min
  let ArrayProtoSlice = Array.prototype.slice
  let $$ = (selector) => {
    return (ArrayProtoSlice.call((!selector ? [] : doc.querySelectorAll(selector))))
  }

  let isNumber = (el) => Object.prototype.toString.call(el) === '[object Number]'
  let isArray = function (obj) {
    return Array.isArray(obj)
  }
  let requestAnimationFrameShim = (callback) => {
    win.setTimeout(callback, 1000 / 60)
  }

  let requestAnimationFrame = function (callback) {
    var requestFn = win.requestAnimationFrame ||
      win.mozRequestAnimationFrame ||
      win.webkitRequestAnimationFrame ||
      requestAnimationFrameShim
    requestFn.call(win, callback)
  }

  let extend = function () {
    let merged = {}
    Array.prototype.forEach.call(arguments, function (obj) {
      for (let key in obj) {
        if (!obj.hasOwnProperty(key)) return
        merged[key] = obj[key]
      }
    })
    return merged
  }

  let initArguments = (options, fn) => {
    return {
      options: typeof options === 'function' || options === undefined ?
        settings : extend(settings, options),
      fn: typeof options === 'function' ?
        options : fn
    }
  }

  let insert = (element, html) => element.insertAdjacentElement('afterBegin', html)

  let eventScroll = (fn) => doc.addEventListener('scroll', fn)

  var escapeCharacters = function (id) {
    if (id.charAt(0) === '#') {
      id = id.substr(1)
    }

    var string = String(id)
    var length = string.length
    var index = -1
    var codeUnit
    var result = ''
    var firstCodeUnit = string.charCodeAt(0)
    while (++index < length) {
      codeUnit = string.charCodeAt(index)
      if (codeUnit === 0x0000) {
        throw new InvalidCharacterError(
          'Invalid character: the input contains U+0000.'
        )
      }

      if (
        (codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit === 0x007F ||
        (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (
          index === 1 &&
          codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
          firstCodeUnit === 0x002D
        )
      ) {
        result += '\\' + codeUnit.toString(16) + ' '
        continue
      }

      if (
        codeUnit >= 0x0080 ||
        codeUnit === 0x002D ||
        codeUnit === 0x005F ||
        (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (codeUnit >= 0x0041 && codeUnit <= 0x005A) ||
        (codeUnit >= 0x0061 && codeUnit <= 0x007A)
      ) {
        result += string.charAt(index)
        continue
      }

      result += '\\' + string.charAt(index)
    }

    return '#' + result
  }

  let size = new Sizes()
  let viewportHeight = size.getViewportAndElementSizes().view.height
  let heightBody = size.getViewportAndElementSizes().size.height
  let positionTopClient = heightBody - viewportHeight
  let getBoundingClientRect = (el) => el.getBoundingClientRect()

  let getHeaderHeight = function (header) {
    return !header ? 0 : (Sizes().getHeight(header) + header.offsetTop)
  }

  let getEasing = function (settings, time) {
    let pattern
    // Default Easing Patterns
    if (settings.easing === 'easeInQuad') pattern = time * time
    if (settings.easing === 'easeOutQuad') pattern = time * (2 - time)
    if (settings.easing === 'easeInOutQuad') pattern = time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time
    if (settings.easing === 'easeInCubic') pattern = time * time * time
    if (settings.easing === 'easeOutCubic') pattern = (--time) * time * time + 1
    if (settings.easing === 'easeInOutCubic') pattern = time < 0.5 ? 4 * time * time * time : (time - 1) * (2 * time - 2) * (2 * time - 2) + 1
    if (settings.easing === 'easeInQuart') pattern = time * time * time * time
    if (settings.easing === 'easeOutQuart') pattern = 1 - (--time) * time * time * time
    if (settings.easing === 'easeInOutQuart') pattern = time < 0.5 ? 8 * time * time * time * time : 1 - 8 * (--time) * time * time * time
    if (settings.easing === 'easeInQuint') pattern = time * time * time * time * time
    if (settings.easing === 'easeOutQuint') pattern = 1 + (--time) * time * time * time * time
    if (settings.easing === 'easeInOutQuint') pattern = time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * (--time) * time * time * time * time

    if (settings.customEasing) pattern = settings.customEasing(time)

    return pattern || time
  }

  var updateURL = function (anchor, isNum, options) {
    if (isNum) return
    if (!history.pushState || !options.updateURL) return

    history.pushState({
        Scroll: JSON.stringify(options),
        anchor: anchor.id
      },
      document.title,
      anchor === document.documentElement ? '#top' : '#' + anchor.id
    )
  }

  var getEndLocation = function (anchor, headerHeight, offset, clip) {
    var location = 0
    if (anchor.offsetParent) {
      do {
        location += anchor.offsetTop
        anchor = anchor.offsetParent
      } while (anchor)
    }
    location = max(location - headerHeight - offset, 0)
    if (clip) {
      location = min(location, heightBody - win.innerHeight)
    }
    return location
  }

  let emitEvent = function (type, options, anchor, toggle) {
    if (!options.emitEvents || typeof win.CustomEvent !== 'function') return
    let event = new CustomEvent(type, {
      bubbles: true,
      detail: {
        anchor: anchor,
        toggle: toggle
      }
    })
    document.dispatchEvent(event)
  }

  let cancelScroll = function (noEvent) {
    cancelAnimationFrame(animationInterval)
    animationInterval = null
    if (noEvent) return
    emitEvent('scrollCancel', settings)
  }

  let adjustFocus = function (anchor, endLocation, isNum) {
    if (anchor === 0) {
      body.focus()
    }
    if (isNum) return
    anchor.focus()
    if (doc.activeElement !== anchor) {
      anchor.setAttribute('tabindex', '-1')
      anchor.focus()
      anchor.style.outline = 'none'
    }
    win.scrollTo(0, endLocation)
  }

  let getSpeed = function (distance, settings) {
    let speed = settings.speedAsDuration ? settings.speed : Math.abs(distance / 1000 * settings.speed)
    if (settings.durationMax && speed > settings.durationMax) return settings.durationMax
    if (settings.durationMin && speed < settings.durationMin) return settings.durationMin
    return speed
  }

  let cancelPosition = function (startPosition, endLocation, fn) {
    var currentPosition = win.pageYOffset
    if (currentPosition === endLocation || ((startPosition < endLocation && viewportHeight + currentPosition) >= heightBody)) {
      if (fn) fn(currentPosition)
      return true
    }
    return false
  }

  let animateScroll = function (anchor, toggle, options, fn) {
    let init = initArguments(options, fn)
    let _settings = init.options
    let isNum = isNumber(anchor)
    let anchorElem = isNum || !anchor.tagName ? null : anchor
    if (!isNum && !anchorElem) return
    let startPosition = win.pageYOffset
    if (_settings.header && !fixedHeader) {
      fixedHeader = qerySelector(_settings.header)
    }
    headerHeight = getHeaderHeight(fixedHeader)
    let endPosition = isNum ? anchor : getEndLocation(anchorElem, headerHeight, parseInt((typeof _settings.offset === 'function' ? _settings.offset(anchor, toggle) : _settings.offset), 10), _settings.clip)
    let distance = endPosition - startPosition
    let speed = getSpeed(distance, _settings)
    let timeLapsed = 0
    let start, percent, position

    var stopAnimateScroll = function (endLocation) {
      return cancelPosition(startPosition, endLocation, function () {
        cancelScroll(true)
        adjustFocus(anchor, endLocation, isNum)
        emitEvent('scrollStop', _settings, anchor, toggle)
        start = null
        animationInterval = null
      })
    }

    var loopAnimateScroll = function (timestamp) {
      if (!start) start = timestamp
      timeLapsed += timestamp - start
      percent = (timeLapsed / parseInt(speed, 10))
      percent = (percent > 1) ? 1 : percent
      position = startPosition + (distance * getEasing(_settings, percent))
      win.scrollTo(0, floor(position))
      if (!stopAnimateScroll(endPosition)) {
        animationInterval = requestAnimationFrame(loopAnimateScroll)
        start = timestamp
      } else {
        if (fn) init.fn(anchorElem, endPosition)
      }
    }

    if (win.pageYOffset === 0) {
      win.scrollTo(0, 0)
    }
    updateURL(anchor, isNum, _settings)
    emitEvent('scrollStart', _settings, anchor, toggle)
    cancelScroll(true)
    requestAnimationFrame(loopAnimateScroll)
  }

  let createElement = ({
    element,
    className,
    id
  } = {}) => {
    let el = doc.createElement(element)
    if (className) el.className = className
    if (id) el.id = id
    return el
  }

  let insertButton = (el, name) => {
    let div = createElement({
      element: 'div',
      className: 'button-up-down',
      id: name
    })
    insert(el, div)
    return div
  }

  let handlerButton = (position, el, settings, fn) => {
    let init = initArguments(settings, fn)
    let clickFunc = () => {
      animateScroll(position, docElement, init.options, init.fn)
    }
    el.addEventListener('click', clickFunc)
  }

  function siblings(element) {
    let ele = element.parentNode
    let children = ArrayProtoSlice.call(ele.children)
    return children.filter((child) => {
      return child !== element
    })
  }

  let elementRemoveClass = (arr, nameClass) => {
    nameClass = nameClass || 'active'
    return arr.map(el => {
      el.classList.remove(nameClass)
      return el
    })
  }

  function siblingsParent(element, selector) {
    let toggle = parentElement = parentElement || element.closest(selector)
    let sibling = siblingNavigation = siblingNavigation || siblings(element)
    let last = sibling.slice(-1).pop()
    let sibl = last ? sibling : ArrayProtoSlice.call(toggle.children)
    let parent = last ? element : element.parentNode
    return {
      sibl,
      parent
    }
  }

  function navigationMenu(element, selector) {
    let {
      sibl,
      parent
    } = siblingsParent(element, selector)
    let elemFilter = sibl.filter(el => el !== parent)
    parent.classList.add('active')
    elementRemoveClass(elemFilter)
    return parent
  }

  let scrollViewButton = (el, top, bottom) => {
    let display
    let positionTop = docElement.scrollTop
    let positionBottom = positionTopClient - bottom
    display = el.id === 'top' ?
      positionTop < top ? 'none' : 'block' :
      positionBottom < positionTop ? 'none' : 'block'
    el.setAttribute('style', `display:${display}`)
  }

  let navigationScroll = (arr, selector, settings, fn) => {
    let anchor = arr.querySelectorAll('a')
    let init = initArguments(settings, fn)
    let options = init.options
    let currentActive = null
    let parentAnkor = null
    let top = null
    let bottom = null
    if (options.header && !fixedHeader) {
      fixedHeader = qerySelector(options.header)
    }
    headerHeight = getHeaderHeight(fixedHeader)
    let positions = ArrayProtoSlice.call(anchor).filter(element => {
      return element.hash !== ''
    }).map(elem => {
      let block = qerySelector(elem.hash)
      let rect = getBoundingClientRect(block)
      return {
        top: floor(rect.top),
        bottom: floor(rect.bottom),
        a: elem,
        block: block
      }
    })

    positions = positions.reverse()

    let ScrollViewNavigation = () => {
      let currentPosition = win.pageYOffset
      for (var i = 0; i < positions.length; i++) {
        let currentElement = positions[i]
        let viewportTop = currentPosition + headerHeight
        let viewportBottom = viewportHeight + currentPosition
        let currentPositonView = (options.navigation === 'top' && positionTopClient >= currentElement.top) ? viewportTop : viewportBottom
        if ((currentPosition < currentElement.top && currentPositonView) >= currentElement.top) {
          if (currentActive !== i) {
            currentActive = i
            top = null
            bottom = null
            parentAnkor = navigationMenu(currentElement.a, selector)
            if (init.fn) init.fn(bottom, currentElement.a)
          }
          break
        }
        if ((currentPosition < currentElement.bottom && viewportTop) >= currentElement.bottom) {
          if (bottom !== i) {
            parentAnkor.classList.remove('active')
            bottom = i
            currentActive = null
          }
          break
        }
        if (currentActive === i && viewportBottom <= currentElement.top) {
          if (top !== i) {
            parentAnkor.classList.remove('active')
            top = i
            currentActive = null
          }
        }


      }
    }
    ScrollViewNavigation()
    eventScroll(ScrollViewNavigation)
  }

  /*
   * @classdesc [[Description]]
   *
   *
   */
  class Scroll {
    /**
     *Creates an instance of Scroll.
     * @memberof Scroll
     */
    constructor() {
      this._button = createElement({
        element: 'div',
        className: settings.buttonClass
      })
    }

    /**
     * Показывает текущюю позицию на экране
     * Gets the current scroll position of the scroll container.
     * @returns {number}
     */
    get scrollPosition() {
      return body.scrollTop || docElement.scrollTop
    }

    // /**
    //  * Размеры просматриваемой области page
    //  * @returns {number}
    //  */
    // get viewPort() {
    //   return size.getViewportAndElementSizes().view
    // }

    // /**
    //  * размер страницы
    //  * @returns {number}
    //  */
    // get page() {
    //   return size.getViewportAndElementSizes().size
    // }

    /**
     * Scrolls the element until it's scroll properties match the coordinates provided.
     * @param {Number} y - The pixel along the vertical axis of the element that you want displayed in the upper left.
     * @param {Object} [settings] - Scroll options
     * @param {Number} [settings.duration]- The amount of time for the animation
     * @param {string} [settings.easing] - The easing function to use
     * @return {Promise}
     */
    to(y, settings, fn) {
      animateScroll(y, docElement, settings, fn)
      return this
    }

    /**
     * Scroll to an element.
     * @param {HTMLElement} el - The element to scroll to.
     * @param {Object} [settings] - The scroll options
     */
    toElement(el, settings, fn) {
      el = qerySelector(el)
      animateScroll(el, docElement, settings, fn)
      return this
    }

    /**
     * Прокрутка страницы в верх (в начало)
     * @param   {object} settings The scroll options
     * @returns this
     */
    top(settings, fn) {
      animateScroll(0, docElement, settings, fn)
      return this
    }

    /**
     * Прокрутка страницы в низ (конец)
     * @param   {object}   settings The scroll options
     * @returns {[[Type]]} [[Description]]
     */
    bottom(settings, fn) {
      animateScroll(heightBody, docElement, settings, fn)
      return this
    }

    /**
     * Кнопка прокрутки страницы в верх
     * @param   {object}   settings The scroll options
     * @param   {function} fn       Функция обратного вызова callback
     * @returns {[[Type]]} [[Description]]
     */
    up(settings, fn) {
      let div = insertButton(body, 'top')
      let init = initArguments(settings, fn)
      scrollViewButton(div, init.top, init.bottom)
      eventScroll(scrollViewButton.bind(this, div, init.top, init.bottom))
      handlerButton(0, div, init.options, init.fn)
      return this
    }

    /**
     * Кнопка прокрутки страницы в низ
     * @param   {object}   option The scroll options
     * @param   {function} fn     Функция обратного вызова callback
     * @returns {[[Type]]} [[Description]]
     */
    down(settings, fn) {
      let div = insertButton(body, 'bottom')
      let init = initArguments(settings, fn)
      scrollViewButton(div, init.top, init.bottom)
      eventScroll(scrollViewButton.bind(this, div, init.top, init.bottom))
      handlerButton(heightBody, div, init.options, init.fn)
      return this
    }

    /**
     * Установка кнопок прокритки страницы в верх и вниз
     * @param {object}   settings The scroll options
     * @param {function} fn       Функция обратного вызова callback
     */
    all(settings, fn) {
      insert(body, this._button)
      let init = initArguments(settings, fn)
      let divTop = insertButton(this._button, 'top')
      let divBottom = insertButton(this._button, 'bottom')
      let initTop = init.options.top
      let initBottom = init.options.bottom
      scrollViewButton(divBottom, initTop, initBottom)
      let displayButton = () => {
        scrollViewButton(divTop, initTop, initBottom)
        scrollViewButton(divBottom, initTop, initBottom)
      }
      let clickHahdler = (e) => {
        let element = e.target
        let id = element.id
        this[id](settings, fn)
      }
      scrollViewButton(divTop, initTop, initBottom)
      this._button.addEventListener('click', clickHahdler, false)
      eventScroll(displayButton)
      return this
    }

    /**
     * По мере прокрутки страницы для выбранных элементов происходит срабатывание функции обратного вызова
     * @param   {object}   selector The scroll options
     * @param   {function} fn       Функция обратного вызова callback
     * @returns {[[Type]]} [[Description]]
     */
    view(selector, settings, fn) {
      let init = initArguments(settings, fn)
      let arr = isArray(selector) ? selector : $$(selector)
      let positions = arr.map(elem => {
        let rect = getBoundingClientRect(elem)
        return {
          top: floor(rect.top),
          bottom: floor(rect.bottom),
          elem: elem
        }
      })

      let processScroll = () => {
        let currentPosition = win.pageYOffset
        let length = positions.length
        if (length > 0) {
          for (let i = 0; i < positions.length; i++) {
            let currentElement = positions[i]
            let viewportBottom = viewportHeight + currentPosition
            if ((currentPosition < currentElement.top && viewportBottom) >= currentElement.top) {
              if (init.fn) init.fn(currentElement.elem, positions)
              positions.shift(i)
            }
          }
        } else if (length === 0) {
          doc.removeEventListener('scroll', processScroll)
        }
      }
      processScroll()
      eventScroll(processScroll)
      return this
    }

    /**
     * Навигационое меню. При клике на пункт меню происходит плавная прокрутка к элементу указанному в анкоре. По мере прокрутки страницы в верх, или в низ, элемент достигший верха просматриваемой области, или пересёкший нижнюю границу просматриваемой области, в зависимости от настроек, происходит добавление класса к ссылке которая указывает на данный элемент, а также роисходит срабатывание функции обратного вызова, в которую будет передан блок и анкор, на котором произошло событие.
     * @param   {string}   selector class или id меню, для организации новигации по сайту
     * @param   {object}   settings The scroll options
     * @param   {function} fn       Функция обратного вызова callback
     * @returns {[[Type]]} [[Description]]
     */
    navigation(selector, settings, fn) {
      const elementArray = $$(selector)
      let clickHandler = (e) => {
        let element = e.target
        if (/#/.test(element.href)) {
          e.preventDefault()
          let hash = escapeCharacters(element.hash)
          let anchor = hash === '#' ? docElement : qerySelector(hash)
          animateScroll(anchor, element, settings, fn)
          navigationMenu(element, selector)
        }
      }
      for (let i = 0; i < elementArray.length; i++) {
        elementArray[i].addEventListener('click', clickHandler, false)
        navigationScroll(elementArray[i], selector, settings, fn)
      }
      return this
    }
  }


  window.Scroll = Scroll

  if (typeof define === 'function' && define.amd) {
    define('Scroll', [], function () {
      return Scroll
    })
  } else if (typeof exports !== 'undefined' && !exports.nodeType) {
    if (typeof module !== 'undefined' && !module.nodeType && module.exports) {
      // eslint-disable-next-line no-global-assign
      exports = module.exports = Scroll
    }
    exports.default = Scroll
  }
})()