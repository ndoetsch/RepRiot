import { useEffect, useState, type CSSProperties } from 'react'
import { BRAND, storageKey } from '../config/brand'
import { shareLink, useInstall, type Platform } from '../lib/install'

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share button" style={{ verticalAlign: '-3px' }}>
      <path d="M12 3v12M7 8l5-5 5 5" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-label="Menu button" style={{ verticalAlign: '-3px' }}>
      <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
    </svg>
  )
}

function Steps({ platform }: { platform: Platform }) {
  if (platform === 'ios') {
    return (
      <ol className="install-steps">
        <li>Tap the <b>Share</b> button <ShareIcon /> at the bottom of Safari (top right in Chrome).</li>
        <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
        <li>Tap <b>Add</b>. {BRAND.mascot.name} is now on your home screen.</li>
      </ol>
    )
  }
  if (platform === 'android') {
    return (
      <ol className="install-steps">
        <li>Tap the <b>menu</b> button <DotsIcon /> at the top right of your browser.</li>
        <li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
        <li>Tap <b>Install</b>. {BRAND.mascot.name} is now on your home screen.</li>
      </ol>
    )
  }
  return (
    <ol className="install-steps">
      <li>In Chrome or Edge, click the <b>install</b> icon at the right end of the address bar.</li>
      <li>Or open the browser <b>menu</b> and choose <b>Install {BRAND.name}</b> (in Chrome it's under <b>Cast, save and share</b>).</li>
      <li>On your phone it's even better: open this same link there.</li>
    </ol>
  )
}

/** Share the app's link with friends, or copy it if the phone can't share. */
export function ShareAppButton({ className = 'btn btn-ghost' }: { className?: string }) {
  const [copied, setCopied] = useState(false)
  async function share() {
    const url = shareLink()
    const text = `Come do quick workouts with me on ${BRAND.name}! Tap the link to install it.`
    if (navigator.share) {
      try {
        await navigator.share({ title: BRAND.name, text, url })
        return
      } catch {
        /* closed the share sheet: copy instead */
      }
    }
    await navigator.clipboard?.writeText(`${text} ${url}`).catch(() => undefined)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button type="button" className={className} onClick={share}>
      {copied ? 'Link copied' : `Send ${BRAND.name} to a friend`}
    </button>
  )
}

/** The how-to-install sheet, with the raccoon front and center. */
function Guide({ platform, onClose }: { platform: Platform; onClose: () => void }) {
  return (
    <div className="overlay sheet-wrap" role="dialog" aria-modal="true" aria-labelledby="install-h" onClick={onClose}>
      <div className="sheet stack" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ gap: 12 }}>
          <img src="/icons/icon-192.png" width={56} height={56} alt="" style={{ borderRadius: 14 }} />
          <div>
            <h2 id="install-h" style={{ fontSize: 20, margin: 0 }}>Install {BRAND.name}</h2>
            <p className="small muted" style={{ margin: 0 }}>Free, no app store, about 10 seconds.</p>
          </div>
        </div>
        <Steps platform={platform} />
        <button type="button" className="btn btn-primary" onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}

/**
 * A big "Install" button. Where the browser allows it, it opens the real
 * install window; otherwise it shows short steps. Hidden once installed.
 * With autoOpen, a link ending in ?install opens the steps straight away.
 */
export function InstallButton({ className = 'btn btn-primary', autoOpen = false }: { className?: string; autoOpen?: boolean }) {
  const install = useInstall()
  const [guide, setGuide] = useState(false)

  useEffect(() => {
    if (autoOpen && new URLSearchParams(window.location.search).has('install') && !install.installed) {
      const t = setTimeout(() => setGuide(true), 400)
      return () => clearTimeout(t)
    }
  }, [autoOpen, install.installed])

  if (install.installed) return null

  async function go() {
    if (install.canPrompt) {
      await install.prompt()
      return
    }
    setGuide(true)
  }

  return (
    <>
      <button type="button" className={className} onClick={go}>
        📲 Install {BRAND.name}
      </button>
      {guide && <Guide platform={install.platform} onClose={() => setGuide(false)} />}
    </>
  )
}

const DISMISSED = storageKey('installCardHidden')

/** A friendly card nudging people to install. They can hide it. */
export function InstallCard({ dismissable = false, style }: { dismissable?: boolean; style?: CSSProperties }) {
  const install = useInstall()
  const [hidden, setHidden] = useState(() => dismissable && localStorage.getItem(DISMISSED) === '1')
  if (install.installed || hidden) return null
  return (
    <section className="card stack install-card" aria-labelledby="install-card-h" style={style}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div className="row" style={{ gap: 12 }}>
          <img src="/icons/icon-192.png" width={44} height={44} alt="" style={{ borderRadius: 10 }} />
          <div>
            <h2 id="install-card-h" style={{ fontSize: 16, margin: 0 }}>Put {BRAND.name} on your home screen</h2>
            <p className="small muted" style={{ margin: 0 }}>Opens like a real app, and reminders work on every phone.</p>
          </div>
        </div>
        {dismissable && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-label="Hide this"
            onClick={() => {
              localStorage.setItem(DISMISSED, '1')
              setHidden(true)
            }}
          >
            ✕
          </button>
        )}
      </div>
      <InstallButton />
    </section>
  )
}
