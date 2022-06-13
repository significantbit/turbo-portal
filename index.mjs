/**
 * Set state on turbo-frame fetch response
 * @param {Event} event 
 * @returns {void}
 */
 const beforePortalFetchResponse = (event) => {
  if (!event.detail.fetchResponse.succeeded)
    return

  /** @type {HTMLElement} */
  const form = event.target
  const turboFrame = form.closest('[data-portal]')
  const portal = turboFrame.parentElement

  // Do not react to initial fetch
  if (turboFrame.dataset.rendered !== 'true')
    return

  // Skip normal turbo behavior since we do not want to replace anything
  event.preventDefault()

  // Reset state
  turboFrame.removeAttribute('src')
  turboFrame.dataset.rendered = 'false'
  turboFrame.innerHTML = ''

  portal.dispatchEvent(new Event('turbo-portal:unload', { bubbles: true }))
}

/**
 * Set state on turbo-frame render
 * @param {Event} event 
 */
const onPortalFrameRender = (event) => {
  const form = event.target
  const turboFrame = form.closest('[data-portal]')
  const portal = turboFrame.parentElement
  turboFrame.dataset.rendered = 'true'
  
  // Do not re-trigger load event on form errors etc inside the portal
  if (event.detail.fetchResponse.succeeded)
    portal.dispatchEvent(new Event('turbo-portal:load', { bubbles: true }))
}

/**
 * Load or reload turbo frame spawned inside the portal
 * @param {HTMLDialogElement} portal 
 * @param {string} href 
 * @param {string} remoteTargetId 
 */
const loadTurboFrame = (portal, href, remoteTargetId) => {
  let turboFrame = portal.querySelector(':scope turbo-frame')

  // Setup turbo-frame inside portal
  if (!turboFrame) {
    turboFrame = document.createElement('turbo-frame')
    portal.appendChild(turboFrame)
  }

  turboFrame.id = remoteTargetId
  turboFrame.dataset.portal = 'true'
  turboFrame.dataset.rendered = 'false'
  turboFrame.removeAttribute('src')
  turboFrame.setAttribute('src', href)

  // Prevent multiple listeners on the same event
  turboFrame.removeEventListener('turbo:before-fetch-response', beforePortalFetchResponse)
  turboFrame.removeEventListener('turbo:frame-render', onPortalFrameRender)

  // Add event listeners
  turboFrame.addEventListener('turbo:before-fetch-response', beforePortalFetchResponse)
  turboFrame.addEventListener('turbo:frame-render', onPortalFrameRender)
}

/**
 * Reload dependent turbo frames which may have changed
 * specified using data-local-target="target1 target2"
 * @param {string} localTargetId 
 */
const reloadLocalTurboFrames = (portal, localTargetId) => {
  portal.addEventListener('turbo-portal:unload', () => {
    (localTargetId || '')
      .split(' ')
      .filter(id => id)
      .forEach(id => {
        const frame = document.querySelector(`turbo-frame#${id}`)

        // Trigger turbo-frame reload
        if (frame?.src)
          frame.reload()
        else if (frame)
          frame.src = location.href
      })
  }, { once: true })
}

/**
 * Listener on all click events on page
 * @param {Event} event 
 * @returns {void}
 */
const interceptClickEvents = (event) => {
  /** @type {HTMLAnchorElement} */
  const element = event.target
  const portalId = element.target
  const remoteTargetId = element?.dataset?.remoteTarget
  const localTargetId = element?.dataset?.localTarget

  if (!portalId)
    return

  const portal = document.querySelector(`#${portalId}`)
  if (!portal || !remoteTargetId)
    return

  // Now we know this event should be handled by the portal
  event.preventDefault()

  loadTurboFrame(portal, element.href, remoteTargetId)
  reloadLocalTurboFrames(portal, localTargetId)
}

/**
 * Enable turbo-portal
 */
export const start = () => {
  addEventListener('click', interceptClickEvents)
}

export default { start }