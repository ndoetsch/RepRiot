import type { ComponentType } from 'react'
import type { Feature } from '../config/features'
import type { Exercise } from '../lib/types'

/** What a channel gets while someone is doing a set. */
export type ChannelViewProps = {
  exercise: Exercise
  /**
   * Read text out loud, if the person turned that on. Pass now = true when the
   * person tapped a speaker button, to read it even when read-aloud is off.
   */
  say: (text: string, lang?: string, now?: boolean) => void
}

/**
 * A channel is one thing to watch, read or hear while doing reps.
 * To add one: make a file in src/channels/, export a Channel, and list it in registry.ts.
 */
export type Channel = {
  id: string
  name: string
  emoji: string
  /** One line shown in the picker. */
  blurb: string
  shelf: 'Move' | 'Learn' | 'Laugh' | 'Stay current'
  View: ComponentType<ChannelViewProps>
  /** Called after a set is logged with this channel on, e.g. to move a lesson track forward. */
  onSetLogged?: () => void
  /** Hide the channel when this feature switch is off. */
  feature?: Feature
}
