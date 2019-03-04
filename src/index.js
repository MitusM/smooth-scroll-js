<<<<<<< Updated upstream
/* global J, exports, define, module, history, cancelAnimationFrame, CustomEvent, InvalidCharacterError */
=======
/* global exports, define, module, history, cancelAnimationFrame, CustomEvent, InvalidCharacterError*/
/* eslint-disable no-console */
>>>>>>> Stashed changes
(function () {
  'use strict'

  // let escapeCharacters = require('./escapecharacters');
  // let v = require('./var')
  // console.log('v', v)
  // let size = require('./getViewportAndElementSizes')
  // let getViewportAndElementSizes = size.getViewportAndElementSizes
  // let getHeight = size.getHeight
  let fixedHeader
  let headerHeight
  let animationInterval

  /** 
   * Массив из одноуровневых элементов, если их нет то [] 
   * @param {Array} 
   * */
  let siblingNavigation = null

  /** родительский элемент внутри которого происходит поиск одноуровневых соседей элемента, или его родителя */
  let parentElement = null

  /** @param {HTMLElement} document */
  let doc = document
  /** @param {HTMLElement} window */
  let win = window
  /**
   * @param {HTMLElement} document.body
   * @private
   */
  let body = doc.body
  /** @param {HTMLElement} document.documentElement */
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

  /**
   * Находим элемент в DOM
   * @param {String} name имя id
   * @private
   */
  // let Id = (name) => doc.getElementById(name)

  let qerySelector = (name) => doc.querySelector(name)
  let floor = Math.floor
  let max = Math.max
  let min = Math.min
  /** @param {Array} Array.prototype.slice */
  let ArrayProtoSlice = Array.prototype.slice
  /** document.querySelectorAll */
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

  /**
   * [[Description]]
   * @param {[[Type]]} callback [[Description]]
   */
  let requestAnimationFrame = function (callback) {
    var requestFn = win.requestAnimationFrame ||
      win.mozRequestAnimationFrame ||
      win.webkitRequestAnimationFrame ||
      requestAnimationFrameShim
    requestFn.call(win, callback)
  }

  /**
   * Объединяем два или больше объектов вместе. Merge two or more objects together.
   * @param   {Object}   objects  The objects to merge together
   * @returns {Object}            Merged values of defaults and options
   * @private
   */
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
    // Remove leading hash
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
      // Note: thereтАЩs no need to special-case astral symbols, surrogate
      // pairs, or lone surrogates.

      // If the character is NULL (U+0000), then throw an
      // `InvalidCharacterError` exception and terminate these steps.
      if (codeUnit === 0x0000) {
        throw new InvalidCharacterError(
          'Invalid character: the input contains U+0000.'
        )
      }

      if (
        // If the character is in the range [\1-\1F] (U+0001 to U+001F) or is
        // U+007F, [тАж]
        (codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit === 0x007F ||
        // If the character is the first character and is in the range [0-9]
        // (U+0030 to U+0039), [тАж]
        (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        // If the character is the second character and is in the range [0-9]
        // (U+0030 to U+0039) and the first character is a `-` (U+002D), [тАж]
        (
          index === 1 &&
          codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
          firstCodeUnit === 0x002D
        )
      ) {
        // http://dev.w3.org/csswg/cssom/#escape-a-character-as-code-point
        result += '\\' + codeUnit.toString(16) + ' '
        continue
      }

      // If the character is not handled by one of the above rules and is
      // greater than or equal to U+0080, is `-` (U+002D) or `_` (U+005F), or
      // is in one of the ranges [0-9] (U+0030 to U+0039), [A-Z] (U+0041 to
      // U+005A), or [a-z] (U+0061 to U+007A), [тАж]
      if (
        codeUnit >= 0x0080 ||
        codeUnit === 0x002D ||
        codeUnit === 0x005F ||
        (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (codeUnit >= 0x0041 && codeUnit <= 0x005A) ||
        (codeUnit >= 0x0061 && codeUnit <= 0x007A)
      ) {
        // the character itself
        result += string.charAt(index)
        continue
      }

      // Otherwise, the escaped character.
      // http://dev.w3.org/csswg/cssom/#escape-a-character
      result += '\\' + string.charAt(index)
    }

    // Return sanitized hash
    return '#' + result
  }

  /**
   * Проверяет является ли заданный элемент document.body или document.documentElement
   * @param   {object}  el элемент
   * @returns {boolean}
   */
  let isRootContainer = function (el) {
    return (el === docElement || el === body)
  }

  /**
   * Высота (height)
   * @param   {object} el элемент
   * @returns {number}
   */
  let getHeight = function (el) {
    return (max(el.scrollHeight, el.clientHeight, el.offsetHeight))
  }

  /**
   * Ширина (weight)
   * @param   {object} el элемент
   * @returns {number}
   */
  let getWidth = function (el) {
    return (max(el.scrollWidth, el.clientWidth, el.offsetWidth))
  }
  /**
   * Высота и ширина указанного элемента
   * @param   {object} el элемент
   * @returns {object} {width: ..., height: ...}
   */
  let getSize = function (el) {
    return ({
      width: getWidth(el),
      height: getHeight(el)
    })
  }

  /**
   * Получение высоты и ширины элемента. Если не задан элемент то получаем высоту и ширину просматриваемой области и высоту с шириной страницы
   * @param   {object} el = document.body элемент. Если не задан то используется по умолчанию
   * @returns {object} {view:  просматриваемая область экрана ,size: страница}, если элемент !== document.body или document.documentElement то view идентичен size . {view: width:height:},size:{width:height:}}
   */
  let getViewportAndElementSizes = function (el = body) {
    var isRoot = isRootContainer(el)
    return {
      /** Высота и ширина просматриваемой области */
      view: {
        width: isRoot ?
          min(win.innerWidth, docElement.clientWidth) : el.clientWidth,
        height: isRoot ?
          win.innerHeight : el.clientHeight
      },
      /** размер страницы или элемента */
      size: isRoot ? {
        width: max(getWidth(body), getWidth(docElement)),
        height: max(getHeight(body), getHeight(docElement))
      } : getSize(el)
    }
  }


  /**
   *
   * @param {HTMLElement} el элемент
   * @private
   */
  let getBoundingClientRect = (el) => el.getBoundingClientRect()
  /** Высота области просмотра */
  let viewportHeight = getViewportAndElementSizes().view.height
  /** высота страницы */
  let heightBody = getViewportAndElementSizes().size.height
  /** верхняя позиция последнего просматриваемого экрана */
  let positionTopClient = heightBody - viewportHeight

  /**
   * Get the height of the fixed header
   * @param  {Node}   header The header
   * @return {Number}        The height of the header
   */
  let getHeaderHeight = function (header) {
    return !header ? 0 : (getHeight(header) + header.offsetTop)
  }

  let getEasing = function (settings, time) {
    let pattern
    // Default Easing Patterns
    if (settings.easing === 'easeInQuad') pattern = time * time // accelerating from zero velocity
    if (settings.easing === 'easeOutQuad') pattern = time * (2 - time) // decelerating to zero velocity
    if (settings.easing === 'easeInOutQuad') pattern = time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time // acceleration until halfway, then deceleration
    if (settings.easing === 'easeInCubic') pattern = time * time * time // accelerating from zero velocity
    if (settings.easing === 'easeOutCubic') pattern = (--time) * time * time + 1 // decelerating to zero velocity
    if (settings.easing === 'easeInOutCubic') pattern = time < 0.5 ? 4 * time * time * time : (time - 1) * (2 * time - 2) * (2 * time - 2) + 1 // acceleration until halfway, then deceleration
    if (settings.easing === 'easeInQuart') pattern = time * time * time * time // accelerating from zero velocity
    if (settings.easing === 'easeOutQuart') pattern = 1 - (--time) * time * time * time // decelerating to zero velocity
    if (settings.easing === 'easeInOutQuart') pattern = time < 0.5 ? 8 * time * time * time * time : 1 - 8 * (--time) * time * time * time // acceleration until halfway, then deceleration
    if (settings.easing === 'easeInQuint') pattern = time * time * time * time * time // accelerating from zero velocity
    if (settings.easing === 'easeOutQuint') pattern = 1 + (--time) * time * time * time * time // decelerating to zero velocity
    if (settings.easing === 'easeInOutQuint') pattern = time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * (--time) * time * time * time * time // acceleration until halfway, then deceleration

    // Custom Easing Patterns
    if (settings.customEasing) pattern = settings.customEasing(time)

    return pattern || time // no easing, no acceleration
  }

  var updateURL = function (anchor, isNum, options) {
    // Bail if the anchor is a number
    if (isNum) return

    // Verify that pushState is supported and the updateURL option is enabled
    if (!history.pushState || !options.updateURL) return

    // Update URL
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
    // Is scrolling to top of page, blur
    if (anchor === 0) {
      body.focus()
    }
    // Don't run if scrolling to a number on the page
    if (isNum) return
    // Otherwise, bring anchor element into focus
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

  /**
   * Проверка было ли достигнуто указанное местоположение на странице (позиция по Y), или конец документа
   * @param   {number}   startPosition   позиция с котрой началась прокрутка
   * @param   {number}   endLocation     конечная позиция которую необходимо достичь
   * @param   {[[Type]]} currentLocation текущая позиция на странице округлённая до целого числа в меньшую сторону
   * @param   {function} fn              функция обратного вызова, которая срабатывает когда была достигнута заданная позиция, или конец документа. В которую будет сброшена текущая позиция на момент её срабатывания
   * @returns {boolean}  [[Description]]
   */
  let cancelPosition = function (startPosition, endLocation, fn) {
    // Get the current position
    var currentPosition = win.pageYOffset
    if (currentPosition === endLocation || ((startPosition < endLocation && viewportHeight + currentPosition) >= heightBody)) {
      if (fn) fn(currentPosition)
      return true
    }
    return false
  }

  let animateScroll = function (anchor, toggle, options, fn) {
    let init = initArguments(options, fn) // Merge user options with defaults
    let _settings = init.options
    // Selectors and variables
    let isNum = isNumber(anchor)
    let anchorElem = isNum || !anchor.tagName ? null : anchor
    if (!isNum && !anchorElem) return
    let startPosition = win.pageYOffset // Current location on the page
    if (_settings.header && !fixedHeader) {
      // Get the fixed header if not already set
      fixedHeader = qerySelector(_settings.header)
    }
    headerHeight = getHeaderHeight(fixedHeader)
    let endPosition = isNum ? anchor : getEndLocation(anchorElem, headerHeight, parseInt((typeof _settings.offset === 'function' ? _settings.offset(anchor, toggle) : _settings.offset), 10), _settings.clip) // Location to scroll to
    let distance = endPosition - startPosition // distance to travel
    let speed = getSpeed(distance, _settings)
    let timeLapsed = 0
    let start, percent, position

    /**
     * Stop the scroll animation when it reaches its target (or the bottom/top of page)
     * @param {Number} endLocation Scroll to location
     * @param {Number} animationInterval How much to scroll on this loop
     */
    var stopAnimateScroll = function (endLocation) {
      return cancelPosition(startPosition, endLocation, function () {
        cancelScroll(true)
        // Bring the anchored element into focus
        adjustFocus(anchor, endLocation, isNum)
        // Emit a custom event
        emitEvent('scrollStop', _settings, anchor, toggle)
        // Reset start
        start = null
        animationInterval = null
      })
    }

    /**
     * Loop scrolling animation
     */
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

    /**
     * Reset position to fix weird iOS bug
     * @link https://github.com/cferdinandi/smooth-scroll/issues/45
     */
    if (win.pageYOffset === 0) {
      win.scrollTo(0, 0)
    }
    // Update the URL
    updateURL(anchor, isNum, _settings)
    // Emit a custom event
    emitEvent('scrollStart', _settings, anchor, toggle)
    // Start scrolling animation
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


  /**
   * Возвращает набор одноуровневых элементов
   * @param   {object} element элемент соседей которого находим
   * @returns {Array}  массив в который не входит сам элемент, только одноуровневые элементы
   */
  function siblings(element) {
    let ele = element.parentNode
    let children = ArrayProtoSlice.call(ele.children)
    return children.filter((child) => {
      return child !== element
    })
  }

  /**
   * Обрабатываем массив элементов, для удалаления class="active", если он присутствует у какого либо элемента
   * @param   {Array} arr массив в котором происходит удаление class="active"
   * @returns {Array} массив элементов
   */
  let elementRemoveClass = (arr, nameClass) => {
    nameClass = nameClass || 'active'
    return arr.map(el => {
      el.classList.remove(nameClass)
      return el
    })
  }

  /**
   * Находи одноуровневых соседей элемента, если их нет, то находим одноуровненых соседей родительского элемента
   * @param   {object} element  элемент у которого находим одноуровневых соседей, или соседей его родителя
   * @param   {string} selector селектор внутри которого происходит поиск одноуровневых соседей элемента, или его родителя
   * @returns {Array}  массив одноуровневых элементов, за исключением самого элемента или его родителя
   */
  function siblingsParent(element, selector) {
    let toggle = parentElement = parentElement || element.closest(selector)
    /** находим одноуровневые элементы */
    let sibling = siblingNavigation = siblingNavigation || siblings(element)
    /** последний элемент массива, если массив пуст [] вернёт undefined */
    let last = sibling.slice(-1).pop()
    /**
     * если одноуровневых элементов нет, берём дочерние элементы указанного селектора
     * @param {HTMLCollection} sibl
     * */
    let sibl = last ? sibling : ArrayProtoSlice.call(toggle.children)
    /** находим родителя элемента по которому произошел клик */
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
    /** отфилтровываем массив убирая из него сам элемент, или его родителя */
    let elemFilter = sibl.filter(el => el !== parent)
    parent.classList.add('active')
    elementRemoveClass(elemFilter)
    return parent
  }

  /**
   * Метод который будет вызван при прокрутки страницы, для отслеживания отображения кнопки вверх или вниз
   * @param {HTMLElement} el
   * @private
   */
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
    /** какая позиция достигнута */
    let currentActive = null
    let parentAnkor = null
    let top = null
    let bottom = null
    if (options.header && !fixedHeader) {
      // Get the fixed header if not already set
      fixedHeader = qerySelector(options.header)
    }
    headerHeight = getHeaderHeight(fixedHeader)
    /** Массив из позиций "якорных" блоков и ссылки из меню */
    let positions = ArrayProtoSlice.call(anchor).filter(element => {
      return element.hash !== ''
    }).map(elem => {
      let block = qerySelector(elem.hash)
      let rect = getBoundingClientRect(block)
      return {
        /** верхняя позиция "якорных" блоков */
        top: floor(rect.top),
        /** нижняя позиция блока */
        bottom: floor(rect.bottom),
        /** @param {HTMLElement} a  */
        a: elem,
        /** @param {HTMLElement} block - "якорный" блок */
        block: block
      }
    })

    positions = positions.reverse()

    let ScrollViewNavigation = () => {
      /** текущая позиция */
      let currentPosition = win.pageYOffset
      for (var i = 0; i < positions.length; i++) {
        let currentElement = positions[i]
        /** верхняя позиция области просмотра */
        let viewportTop = currentPosition + headerHeight
        /** нижняя позиция области просмотра */
        let viewportBottom = viewportHeight + currentPosition
        /** зона реакции */
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
          /** нижняя граница блока покинула верх просматриваемой области */
        }
        if ((currentPosition < currentElement.bottom && viewportTop) >= currentElement.bottom) {
          if (bottom !== i) {
            parentAnkor.classList.remove('active')
            bottom = i
            currentActive = null
          }
          break
          /** верхняя граница пересекла низ просматриваемой области */
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

  /* === === === === === === === === === === === ==
  /* === === === === === === === === === === === ==
   * @classdesc [[Description]]
   * === === === === === === === === === === === ==
   * === === === === === === === === === === === ==
   */
  class Scroll {
    constructor() {
      this._el = body
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

    /**
     * Размеры просматриваемой области page
     * @returns {number}
     */
    get viewPort() {
      return getViewportAndElementSizes().view
    }

    /**
     * размер страницы
     * @returns {number}
     */
    get page() {
      return getViewportAndElementSizes().size
    }

    /**
     * Scrolls the element until it's scroll properties match the coordinates provided.
     * @param {Number} y - The pixel along the vertical axis of the element that you want displayed in the upper left.
     * @param {Object} [settings] - Scroll options
     * @param {Number} [options.duration]- The amount of time for the animation
     * @param {string} [options.easing] - The easing function to use
     * @return {Promise}
     */
    to(y, settings, fn) {
      animateScroll(y, docElement, settings, fn)
    }

    /**
     * Scroll to an element.
     * @param {HTMLElement} el - The element to scroll to.
     * @param {Object} [settings] - The scroll options
     */
    toElement(el, settings, fn) {
      el = qerySelector(el)
      animateScroll(el, docElement, settings, fn)
    }

    /**
     * [[Description]]
     * @param   {object}   settings [[Description]]
     * @returns {[[Type]]} [[Description]]
     */
    top(settings, fn) {
      animateScroll(0, docElement, settings, fn)
      return this
    }

    /**
     * [[Description]]
     * @param   {[[Type]]} settings [[Description]]
     * @returns {[[Type]]} [[Description]]
     */
    bottom(settings, fn) {
      animateScroll(heightBody, docElement, settings, fn)
      return this
    }

    /**
     * [[Description]]
     * @param   {[[Type]]} settings [[Description]]
     * @param   {[[Type]]} fn     [[Description]]
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
     * [[Description]]
     * @param   {[[Type]]} option [[Description]]
     * @param   {[[Type]]} fn     [[Description]]
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
     * [[Description]]
     * @param {[[Type]]} settings = setOption [[Description]]
     * @param {[[Type]]} fn                  [[Description]]
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
    }

    /**
     * [[Description]]
     * @param   {[[Type]]} selector [[Description]]
     * @param   {[[Type]]} fn [[Description]]
     * @returns {[[Type]]} [[Description]]
     */
    view(selector, settings, fn) {
      // let arrlength
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
        /** текущая позиция */
        let currentPosition = win.pageYOffset
        let length = positions.length
        if (length > 0) {
          for (let i = 0; i < positions.length; i++) {
            let currentElement = positions[i]
            /** нижняя позиция области просмотра */
            let viewportBottom = viewportHeight + currentPosition
            if ((currentPosition < currentElement.top && viewportBottom) >= currentElement.top) {
              if (init.fn) init.fn(currentElement.elem, positions)
              positions.shift(i)
            }
          }
        } else if (length === 0) {
          // console.log('!!!!')
          doc.removeEventListener('scroll', processScroll)
        }
      }
      /** Если элемент попал на первый экран */
      processScroll()
      eventScroll(processScroll)
      return this
    }

    /**
     * [[Description]]
     * @param   {[[Type]]} selector          [[Description]]
     * @param   {[[Type]]} settings          [[Description]]
     * @param   {[[Type]]} fn                [[Description]]
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


  // if (J) {
  //   J.Scroll = Scroll
  //   if (J.jQueryLoaded) {
  //     J.initializeJqueryWrapper(
  //       Scroll,
  //       'actionScroll',
  //       'J_Scroll'
  //     )
  //   }
  // } else {
  //   window.Scroll = Scroll
  // }

  window.Scroll = Scroll

  if (typeof define === 'function' && define.amd) {
    define('Scroll', [], function () {
      return Scroll
    })
    // Common JS
  } else if (typeof exports !== 'undefined' && !exports.nodeType) {
    if (typeof module !== 'undefined' && !module.nodeType && module.exports) {
      // eslint-disable-next-line no-global-assign
      exports = module.exports = Scroll
    }
    exports.default = Scroll
  }
})()
