"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

(function () {
  function r(e, n, t) {
    function o(i, f) {
      if (!n[i]) {
        if (!e[i]) {
          var c = "function" == typeof require && require;
          if (!f && c) return c(i, !0);
          if (u) return u(i, !0);
          var a = new Error("Cannot find module '" + i + "'");
          throw a.code = "MODULE_NOT_FOUND", a;
        }

        var p = n[i] = {
          exports: {}
        };
        e[i][0].call(p.exports, function (r) {
          var n = e[i][1][r];
          return o(n || r);
        }, p, p.exports, r, e, n, t);
      }

      return n[i].exports;
    }

    for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
      o(t[i]);
    }

    return o;
  }

  return r;
})()({
  1: [function (require, module, exports) {
    /* global define, exports, module */
    (function () {
      var docElement = document.documentElement;
      var body = document.body;
      var max = Math.max;

      function Sizes() {
        if (!(this instanceof Sizes)) {
          return new Sizes();
        }

        this.view = this.getViewportAndElementSizes().view;
        this.size = this.getViewportAndElementSizes().size;
      }

      Sizes.prototype = {
        isRootContainer: function isRootContainer(el) {
          return el === docElement || el === body;
        },
        getHeight: function getHeight(el) {
          return max(el.scrollHeight, el.clientHeight, el.offsetHeight);
        },
        getWidth: function getWidth(el) {
          return max(el.scrollWidth, el.clientWidth, el.offsetWidth);
        },
        getSize: function getSize(el) {
          return {
            width: this.getWidth(el),
            height: this.getHeight(el)
          };
        },
        getViewportAndElementSizes: function getViewportAndElementSizes() {
          var el = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : body;
          var isRoot = this.isRootContainer(el);
          return {
            view: {
              width: isRoot ? Math.min(window.innerWidth, docElement.clientWidth) : el.clientWidth,
              height: isRoot ? window.innerHeight : el.clientHeight
            },
            size: isRoot ? {
              width: max(this.getWidth(body), this.getWidth(docElement)),
              height: max(this.getHeight(body), this.getHeight(docElement))
            } : this.getSize(el)
          };
        },
        destroy: function destroy() {}
      };
      window.Sizes = Sizes;

      if (typeof define === 'function' && define.amd) {
        define('Sizes', [], function () {
          return Sizes;
        });
      } else if (typeof exports !== 'undefined' && !exports.nodeType) {
        if (typeof module !== 'undefined' && !module.nodeType && module.exports) {
          // eslint-disable-next-line no-global-assign
          exports = module.exports = Sizes;
        }

        exports.default = Sizes;
      }
    })();
    /* eslint-disable no-console */

    /* global exports, define, module, history, cancelAnimationFrame, CustomEvent, InvalidCharacterError, Sizes*/


    (function () {
      'use strict';

      var fixedHeader;
      var headerHeight;
      var animationInterval;
      var siblingNavigation = null;
      var parentElement = null;
      var doc = document;
      var win = window;
      var body = doc.body;
      var docElement = doc.documentElement;
      /** Default settings */

      var settings = {
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
        updateURL: false,
        // true
        popstate: true,
        // Custom Events
        emitEvents: true,
        tracking: true,
        // отслеживаем попадание в область просмотра один раз
        // up and down buttons
        buttonClass: 'button-navigation',
        top: 100,
        bottom: 100,
        // navigation
        navigation: 'bottom'
      };

      var qerySelector = function qerySelector(name) {
        return doc.querySelector(name);
      };

      var floor = Math.floor;
      var max = Math.max;
      var min = Math.min;
      var ArrayProtoSlice = Array.prototype.slice;

      var $$ = function $$(selector) {
        return ArrayProtoSlice.call(!selector ? [] : doc.querySelectorAll(selector));
      };

      var isNumber = function isNumber(el) {
        return Object.prototype.toString.call(el) === '[object Number]';
      };

      var isArray = function isArray(obj) {
        return Array.isArray(obj);
      };

      var requestAnimationFrameShim = function requestAnimationFrameShim(callback) {
        win.setTimeout(callback, 1000 / 60);
      };

      var requestAnimationFrame = function requestAnimationFrame(callback) {
        var requestFn = win.requestAnimationFrame || win.mozRequestAnimationFrame || win.webkitRequestAnimationFrame || requestAnimationFrameShim;
        requestFn.call(win, callback);
      };

      var extend = function extend() {
        var merged = {};
        Array.prototype.forEach.call(arguments, function (obj) {
          for (var key in obj) {
            if (!obj.hasOwnProperty(key)) return;
            merged[key] = obj[key];
          }
        });
        return merged;
      };

      var initArguments = function initArguments(options, fn) {
        return {
          options: typeof options === 'function' || options === undefined ? settings : extend(settings, options),
          fn: typeof options === 'function' ? options : fn
        };
      };

      var insert = function insert(element, html) {
        return element.insertAdjacentElement('afterBegin', html);
      };

      var eventScroll = function eventScroll(fn) {
        return doc.addEventListener('scroll', fn);
      };

      var escapeCharacters = function escapeCharacters(id) {
        if (id.charAt(0) === '#') {
          id = id.substr(1);
        }

        var string = String(id);
        var length = string.length;
        var index = -1;
        var codeUnit;
        var result = '';
        var firstCodeUnit = string.charCodeAt(0);

        while (++index < length) {
          codeUnit = string.charCodeAt(index);

          if (codeUnit === 0x0000) {
            throw new InvalidCharacterError('Invalid character: the input contains U+0000.');
          }

          if (codeUnit >= 0x0001 && codeUnit <= 0x001F || codeUnit === 0x007F || index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039 || index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && firstCodeUnit === 0x002D) {
            result += '\\' + codeUnit.toString(16) + ' ';
            continue;
          }

          if (codeUnit >= 0x0080 || codeUnit === 0x002D || codeUnit === 0x005F || codeUnit >= 0x0030 && codeUnit <= 0x0039 || codeUnit >= 0x0041 && codeUnit <= 0x005A || codeUnit >= 0x0061 && codeUnit <= 0x007A) {
            result += string.charAt(index);
            continue;
          }

          result += '\\' + string.charAt(index);
        }

        return '#' + result;
      };

      var size = new Sizes();
      var viewportHeight = size.view.height;
      var heightBody = size.size.height;
      console.log('heightBody', heightBody);
      var positionTopClient = heightBody - viewportHeight;

      var getHeaderHeight = function getHeaderHeight(header) {
        return !header ? 0 : Sizes().getHeight(header) + header.offsetTop;
      };

      var getEasing = function getEasing(settings, time) {
        var pattern; // Default Easing Patterns

        if (settings.easing === 'easeInQuad') pattern = time * time;
        if (settings.easing === 'easeOutQuad') pattern = time * (2 - time);
        if (settings.easing === 'easeInOutQuad') pattern = time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time;
        if (settings.easing === 'easeInCubic') pattern = time * time * time;
        if (settings.easing === 'easeOutCubic') pattern = --time * time * time + 1;
        if (settings.easing === 'easeInOutCubic') pattern = time < 0.5 ? 4 * time * time * time : (time - 1) * (2 * time - 2) * (2 * time - 2) + 1;
        if (settings.easing === 'easeInQuart') pattern = time * time * time * time;
        if (settings.easing === 'easeOutQuart') pattern = 1 - --time * time * time * time;
        if (settings.easing === 'easeInOutQuart') pattern = time < 0.5 ? 8 * time * time * time * time : 1 - 8 * --time * time * time * time;
        if (settings.easing === 'easeInQuint') pattern = time * time * time * time * time;
        if (settings.easing === 'easeOutQuint') pattern = 1 + --time * time * time * time * time;
        if (settings.easing === 'easeInOutQuint') pattern = time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * --time * time * time * time * time;
        if (settings.customEasing) pattern = settings.customEasing(time);
        return pattern || time;
      };

      var updateURL = function updateURL(anchor, isNum, options) {
        if (isNum) return;
        if (!history.pushState || !options.updateURL) return;
        history.pushState({
          Scroll: JSON.stringify(options),
          anchor: anchor.id
        }, document.title, anchor === document.documentElement ? '#top' : '#' + anchor.id);
      };

      var getEndLocation = function getEndLocation(anchor, headerHeight, offset, clip) {
        var location = 0;

        if (anchor.offsetParent) {
          do {
            location += anchor.offsetTop;
            anchor = anchor.offsetParent;
          } while (anchor);
        }

        location = max(location - headerHeight - offset, 0);

        if (clip) {
          location = min(location, heightBody - win.innerHeight);
        }

        return location;
      };

      var emitEvent = function emitEvent(type, options, anchor, toggle) {
        if (!options.emitEvents || typeof win.CustomEvent !== 'function') return;
        var event = new CustomEvent(type, {
          bubbles: true,
          detail: {
            anchor: anchor,
            toggle: toggle
          }
        });
        document.dispatchEvent(event);
      };

      var cancelScroll = function cancelScroll(noEvent) {
        cancelAnimationFrame(animationInterval);
        animationInterval = null;
        if (noEvent) return;
        emitEvent('scrollCancel', settings);
      };

      var adjustFocus = function adjustFocus(anchor, endLocation, isNum) {
        if (anchor === 0) {
          body.focus();
        }

        if (isNum) return;
        anchor.focus();

        if (doc.activeElement !== anchor) {
          anchor.setAttribute('tabindex', '-1');
          anchor.focus();
          anchor.style.outline = 'none';
        }

        win.scrollTo(0, endLocation);
      };

      var getSpeed = function getSpeed(distance, settings) {
        var speed = settings.speedAsDuration ? settings.speed : Math.abs(distance / 1000 * settings.speed);
        if (settings.durationMax && speed > settings.durationMax) return settings.durationMax;
        if (settings.durationMin && speed < settings.durationMin) return settings.durationMin;
        return speed;
      };

      var cancelPosition = function cancelPosition(startPosition, endLocation, fn) {
        var currentPosition = win.pageYOffset;

        if (currentPosition === endLocation || (startPosition < endLocation && viewportHeight + currentPosition) >= heightBody) {
          if (fn) fn(currentPosition);
          return true;
        }

        return false;
      };

      var animateScroll = function animateScroll(anchor, toggle, options, fn) {
        var init = initArguments(options, fn);
        var _settings = init.options;
        var isNum = isNumber(anchor);
        var anchorElem = isNum || !anchor.tagName ? null : anchor;
        if (!isNum && !anchorElem) return;
        var startPosition = win.pageYOffset;

        if (_settings.header && !fixedHeader) {
          fixedHeader = qerySelector(_settings.header);
        }

        headerHeight = getHeaderHeight(fixedHeader);
        var endPosition = isNum ? anchor : getEndLocation(anchorElem, headerHeight, parseInt(typeof _settings.offset === 'function' ? _settings.offset(anchor, toggle) : _settings.offset, 10), _settings.clip);
        var distance = endPosition - startPosition;
        var speed = getSpeed(distance, _settings);
        var timeLapsed = 0;
        var start, percent, position;

        var stopAnimateScroll = function stopAnimateScroll(endLocation) {
          return cancelPosition(startPosition, endLocation, function () {
            cancelScroll(true);
            adjustFocus(anchor, endLocation, isNum);
            emitEvent('scrollStop', _settings, anchor, toggle);
            start = null;
            animationInterval = null;
          });
        };

        var loopAnimateScroll = function loopAnimateScroll(timestamp) {
          if (!start) start = timestamp;
          timeLapsed += timestamp - start;
          percent = timeLapsed / parseInt(speed, 10);
          percent = percent > 1 ? 1 : percent;
          position = startPosition + distance * getEasing(_settings, percent);
          win.scrollTo(0, floor(position));

          if (!stopAnimateScroll(endPosition)) {
            animationInterval = requestAnimationFrame(loopAnimateScroll);
            start = timestamp;
          } else {
            if (fn) init.fn(anchorElem, endPosition);
          }
        };

        if (win.pageYOffset === 0) {
          win.scrollTo(0, 0);
        }

        updateURL(anchor, isNum, _settings);
        emitEvent('scrollStart', _settings, anchor, toggle);
        cancelScroll(true);
        requestAnimationFrame(loopAnimateScroll);
      };

      var createElement = function createElement() {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            element = _ref.element,
            className = _ref.className,
            id = _ref.id;

        var el = doc.createElement(element);
        if (className) el.className = className;
        if (id) el.id = id;
        return el;
      };

      var insertButton = function insertButton(el, name) {
        var div = createElement({
          element: 'div',
          className: 'button-up-down',
          id: name
        });
        insert(el, div);
        return div;
      };

      var handlerButton = function handlerButton(position, el, settings, fn) {
        var init = initArguments(settings, fn);

        var clickFunc = function clickFunc() {
          animateScroll(position, docElement, init.options, init.fn);
        };

        el.addEventListener('click', clickFunc);
      };

      function siblings(element) {
        var ele = element.parentNode;
        var children = ArrayProtoSlice.call(ele.children);
        return children.filter(function (child) {
          return child !== element;
        });
      }

      var elementRemoveClass = function elementRemoveClass(arr, nameClass) {
        nameClass = nameClass || 'active';
        return arr.map(function (el) {
          el.classList.remove(nameClass);
          return el;
        });
      };

      function siblingsParent(element, selector) {
        var toggle = parentElement = parentElement || element.closest(selector);
        var sibling = siblingNavigation = siblingNavigation || siblings(element);
        var last = sibling.slice(-1).pop();
        var sibl = last ? sibling : ArrayProtoSlice.call(toggle.children);
        var parent = last ? element : element.parentNode;
        return {
          sibl: sibl,
          parent: parent
        };
      }

      function navigationMenu(element, selector) {
        var _siblingsParent = siblingsParent(element, selector),
            sibl = _siblingsParent.sibl,
            parent = _siblingsParent.parent;

        var elemFilter = sibl.filter(function (el) {
          return el !== parent;
        });
        parent.classList.add('active');
        elementRemoveClass(elemFilter);
        return parent;
      }

      var scrollViewButton = function scrollViewButton(el, top, bottom) {
        var display;
        var positionTop = docElement.scrollTop;
        var positionBottom = positionTopClient - bottom;
        display = el.id === 'top' ? positionTop < top ? 'none' : 'block' : positionBottom < positionTop ? 'none' : 'block';
        el.setAttribute('style', "display:".concat(display));
      };

      var navigationScroll = function navigationScroll(arr, selector, settings, fn) {
        var anchor = arr.querySelectorAll('a');
        var init = initArguments(settings, fn);
        var options = init.options;
        var currentActive = null;
        var parentAnkor = null;
        var top = null;
        var bottom = null;

        if (options.header && !fixedHeader) {
          fixedHeader = qerySelector(options.header);
        }

        headerHeight = getHeaderHeight(fixedHeader);
        var positions = ArrayProtoSlice.call(anchor).filter(function (element) {
          return element.hash !== '';
        }).map(function (elem) {
          var block = qerySelector(elem.hash);
          var rect = block.getBoundingClientRect();
          return {
            top: floor(rect.top),
            bottom: floor(rect.bottom),
            a: elem,
            block: block
          };
        });
        positions = positions.reverse();

        var ScrollViewNavigation = function ScrollViewNavigation() {
          var currentPosition = win.pageYOffset;

          for (var i = 0; i < positions.length; i++) {
            var currentElement = positions[i];
            var viewportTop = currentPosition + headerHeight;
            var viewportBottom = viewportHeight + currentPosition;
            var currentPositonView = options.navigation === 'top' && positionTopClient >= currentElement.top ? viewportTop : viewportBottom;

            if ((currentPosition < currentElement.top && currentPositonView) >= currentElement.top) {
              if (currentActive !== i) {
                currentActive = i;
                top = null;
                bottom = null;
                parentAnkor = navigationMenu(currentElement.a, selector);
                if (init.fn) init.fn(bottom, currentElement.a);
              }

              break;
            }

            if ((currentPosition < currentElement.bottom && viewportTop) >= currentElement.bottom) {
              if (bottom !== i) {
                parentAnkor.classList.remove('active');
                bottom = i;
                currentActive = null;
              }

              break;
            }

            if (currentActive === i && viewportBottom <= currentElement.top) {
              if (top !== i) {
                parentAnkor.classList.remove('active');
                top = i;
                currentActive = null;
              }
            }
          }
        };

        ScrollViewNavigation();
        eventScroll(ScrollViewNavigation);
      };
      /*
       * @classdesc [[Description]]
       *
       *
       */


      var Scroll =
      /*#__PURE__*/
      function () {
        /**
         *Creates an instance of Scroll.
         * @memberof Scroll
         */
        function Scroll() {
          _classCallCheck(this, Scroll);

          this._button = createElement({
            element: 'div',
            className: settings.buttonClass
          });
        }
        /**
         * Показывает текущюю позицию на экране
         * Gets the current scroll position of the scroll container.
         * @returns {number}
         */


        _createClass(Scroll, [{
          key: "to",
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
          value: function to(y, settings, fn) {
            animateScroll(y, docElement, settings, fn);
            return this;
          }
          /**
           * Scroll to an element.
           * @param {HTMLElement} el - The element to scroll to.
           * @param {Object} [settings] - The scroll options
           */

        }, {
          key: "toElement",
          value: function toElement(el, settings, fn) {
            el = qerySelector(el);
            animateScroll(el, docElement, settings, fn);
            return this;
          }
          /**
           * Прокрутка страницы в верх (в начало)
           * @param   {object} settings The scroll options
           * @returns this
           */

        }, {
          key: "top",
          value: function top(settings, fn) {
            animateScroll(0, docElement, settings, fn);
            return this;
          }
          /**
           * Прокрутка страницы в низ (конец)
           * @param   {object}   settings The scroll options
           * @returns {[[Type]]} [[Description]]
           */

        }, {
          key: "bottom",
          value: function bottom(settings, fn) {
            animateScroll(heightBody, docElement, settings, fn);
            return this;
          }
          /**
           * Кнопка прокрутки страницы в верх
           * @param   {object}   settings The scroll options
           * @param   {function} fn       Функция обратного вызова callback
           * @returns {[[Type]]} [[Description]]
           */

        }, {
          key: "up",
          value: function up(settings, fn) {
            var div = insertButton(body, 'top');
            var init = initArguments(settings, fn);
            scrollViewButton(div, init.top, init.bottom);
            eventScroll(scrollViewButton.bind(this, div, init.top, init.bottom));
            handlerButton(0, div, init.options, init.fn);
            return this;
          }
          /**
           * Кнопка прокрутки страницы в низ
           * @param   {object}   option The scroll options
           * @param   {function} fn     Функция обратного вызова callback
           * @returns {[[Type]]} [[Description]]
           */

        }, {
          key: "down",
          value: function down(settings, fn) {
            var div = insertButton(body, 'bottom');
            var init = initArguments(settings, fn);
            scrollViewButton(div, init.top, init.bottom);
            eventScroll(scrollViewButton.bind(this, div, init.top, init.bottom));
            handlerButton(heightBody, div, init.options, init.fn);
            return this;
          }
          /**
           * Установка кнопок прокритки страницы в верх и вниз
           * @param {object}   settings The scroll options
           * @param {function} fn       Функция обратного вызова callback
           */

        }, {
          key: "all",
          value: function all(settings, fn) {
            var _this = this;

            insert(body, this._button);
            var init = initArguments(settings, fn);
            var divTop = insertButton(this._button, 'top');
            var divBottom = insertButton(this._button, 'bottom');
            var initTop = init.options.top;
            var initBottom = init.options.bottom;
            scrollViewButton(divBottom, initTop, initBottom);

            var displayButton = function displayButton() {
              scrollViewButton(divTop, initTop, initBottom);
              scrollViewButton(divBottom, initTop, initBottom);
            };

            var clickHahdler = function clickHahdler(e) {
              var element = e.target;
              var id = element.id;

              _this[id](settings, fn);
            };

            scrollViewButton(divTop, initTop, initBottom);

            this._button.addEventListener('click', clickHahdler, false);

            eventScroll(displayButton);
            return this;
          }
          /**
           * По мере прокрутки страницы для выбранных элементов происходит срабатывание функции обратного вызова
           * @param   {object}   selector The scroll options
           * @param   {function} fn       Функция обратного вызова callback
           * @returns {[[Type]]} [[Description]]
           */

        }, {
          key: "view",
          value: function view(selector, settings, fn) {
            var init = initArguments(settings, fn);
            var arr = isArray(selector) ? selector : $$(selector);
            var positions = arr.map(function (elem) {
              var rect = elem.getBoundingClientRect();
              return {
                top: floor(rect.top),
                bottom: floor(rect.bottom),
                elem: elem
              };
            });

            var processScroll = function processScroll() {
              var currentPosition = win.pageYOffset;
              var length = positions.length;

              if (length > 0) {
                for (var i = 0; i < positions.length; i++) {
                  var currentElement = positions[i];
                  var viewportBottom = viewportHeight + currentPosition;

                  if ((currentPosition < currentElement.top && viewportBottom) >= currentElement.top) {
                    if (init.fn) init.fn(currentElement.elem, positions);
                    positions.shift(i);
                  }
                }
              } else if (length === 0) {
                doc.removeEventListener('scroll', processScroll);
              }
            };

            processScroll();
            eventScroll(processScroll);
            return this;
          }
          /**
           * Навигационое меню. При клике на пункт меню происходит плавная прокрутка к элементу указанному в анкоре. По мере прокрутки страницы в верх, или в низ, элемент достигший верха просматриваемой области, или пересёкший нижнюю границу просматриваемой области, в зависимости от настроек, происходит добавление класса к ссылке которая указывает на данный элемент, а также роисходит срабатывание функции обратного вызова, в которую будет передан блок и анкор, на котором произошло событие.
           * @param   {string}   selector class или id меню, для организации новигации по сайту
           * @param   {object}   settings The scroll options
           * @param   {function} fn       Функция обратного вызова callback
           * @returns {[[Type]]} [[Description]]
           */

        }, {
          key: "navigation",
          value: function navigation(selector, settings, fn) {
            var elementArray = $$(selector);

            var clickHandler = function clickHandler(e) {
              var element = e.target;

              if (/#/.test(element.href)) {
                e.preventDefault();
                var hash = escapeCharacters(element.hash);
                var anchor = hash === '#' ? docElement : qerySelector(hash);
                animateScroll(anchor, element, settings, fn);
                navigationMenu(element, selector);
              }
            };

            for (var i = 0; i < elementArray.length; i++) {
              elementArray[i].addEventListener('click', clickHandler, false);
              navigationScroll(elementArray[i], selector, settings, fn);
            }

            return this;
          }
        }, {
          key: "scrollPosition",
          get: function get() {
            return body.scrollTop || docElement.scrollTop;
          }
        }]);

        return Scroll;
      }();

      window.Scroll = Scroll;

      if (typeof define === 'function' && define.amd) {
        define('Scroll', [], function () {
          return Scroll;
        });
      } else if (typeof exports !== 'undefined' && !exports.nodeType) {
        if (typeof module !== 'undefined' && !module.nodeType && module.exports) {
          // eslint-disable-next-line no-global-assign
          exports = module.exports = Scroll;
        }

        exports.default = Scroll;
      }
    })();
  }, {}]
}, {}, [1]);
