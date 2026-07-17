const { renderToString } = require("react-dom/server")

/** @type {import("gatsby").GatsbySSR["replaceRenderer"]} */
exports.replaceRenderer = ({ bodyComponent, replaceBodyHTMLString }) => {
  replaceBodyHTMLString(renderToString(bodyComponent))
}
