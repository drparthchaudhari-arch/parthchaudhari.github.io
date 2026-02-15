/* ============================================
   IQ GAME EMBED WRAPPER
   ============================================ */

const IQChallenge = {
  iframe: null,

  init(container, level) {
    this.cleanup()
    const safeLevel = Number.isFinite(level) ? level : 1
    container.innerHTML = `
            <div class="embedded-game-shell" style="background:#050508;">
                <iframe
                    title="IQ Challenge"
                    src="iq.html?level=${encodeURIComponent(String(safeLevel))}"
                    style="width:100%;height:100%;border:0;display:block;background:#050508;"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                ></iframe>
            </div>
        `

    this.iframe = container.querySelector('iframe')
  },

  showHint() {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(
        { type: 'game-hint', game: 'iq' },
        '*'
      )
    }
  },

  cleanup() {
    if (this.iframe) {
      this.iframe.src = 'about:blank'
      this.iframe = null
    }
  },
}
