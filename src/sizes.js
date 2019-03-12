/* global define, exports, module */
(function () {
  let docElement = document.documentElement
  let body = document.body
  let max = Math.max

  function Sizes() {
    if (!(this instanceof Sizes)) {
      return new Sizes()
    }
    this.view = this.getViewportAndElementSizes().view
    this.size = this.getViewportAndElementSizes().size
  }

  Sizes.prototype = {
    isRootContainer: function (el) {
      return (el === docElement || el === body)
    },

    getHeight: function (el) {
      return (max(el.scrollHeight, el.clientHeight, el.offsetHeight))
    },

    getWidth: function (el) {
      return (max(el.scrollWidth, el.clientWidth, el.offsetWidth))
    },

    getSize: function (el) {
      return ({
        width: this.getWidth(el),
        height: this.getHeight(el)
      })
    },

    getViewportAndElementSizes: function (el = body) {
      var isRoot = this.isRootContainer(el)
      return {
        view: {
          width: isRoot ?
            Math.min(window.innerWidth, docElement.clientWidth) : el.clientWidth,
          height: isRoot ?
            window.innerHeight : el.clientHeight
        },
        size: isRoot ? {
          width: max(this.getWidth(body), this.getWidth(docElement)),
          height: max(this.getHeight(body), this.getHeight(docElement))
        } : this.getSize(el)
      }
    },
    destroy: function () {}

  }



  window.Sizes = Sizes

  if (typeof define === 'function' && define.amd) {
    define('Sizes', [], function () {
      return Sizes
    })
  } else if (typeof exports !== 'undefined' && !exports.nodeType) {
    if (typeof module !== 'undefined' && !module.nodeType && module.exports) {
      // eslint-disable-next-line no-global-assign
      exports = module.exports = Sizes
    }
    exports.default = Sizes
  }
})()