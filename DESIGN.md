# Kiwu Club · the pass

## Concept Card

```
Idea:        Kiwu Club runs on the pass. Every order is a paper slip on the rail
             between counter and bar: the guest holds their slip, the bar works
             the rail, the menu is the board above it.
Metaphor:    the ticket rail of a coffee bar
Signature:   placing an order tears the slip out of the cart, clips it to the
             rail, and the rail becomes the tracking screen
Emotion:     brisk, warm, a little theatrical. A bar that is proud of its craft
Motion verb: clip, slide, stamp, tear
Screenshot:  the rail with three slips on it, one freshly stamped READY
```

The concept is anchored on a real object of this shop (the pass), not on a trend. It
derives layout (slips, rails, perforations, ticket columns), motion (clip and slide,
stamp), type (mono for data, display for the brand), copy (on the pass, clipped,
torn, stamped) and details (order numbers as rubber stamps, timestamps, serrated
edges, clip hardware).

## Assumptions (mock everything external)

- Payment terminal is mocked: a sheet that reads "Acerca la tarjeta", runs a 1.6 s
  approval and returns an approved state. No Stripe, no SumUp.
- Ticket printer is mocked: a print preview sheet and a "printed" toast.
- Loyalty QR is a deterministic dot matrix, not a scannable code.
- Wait estimates come from the live queue, not from a kitchen model.
- Happy hour is a table in the database, seeded with a plausible window.
- Staff accounts and roles exist in `user_roles`; the roles screen edits that table.

## Art direction

Palette, by role. Ground and ink come from the brand board; paper is the slip.

| role | value | use |
|---|---|---|
| ground | `#F3EBDD` oat milk | page |
| ink | `#302820` espresso | text, stamps |
| muted | `#73665A` | secondary text |
| line | `rgb(48 40 32 / 12%)` | hairlines, perforations |
| paper | `#FFFDF8` | the slip |
| accent | `#A66B48` caramel | primary action, clip |
| ready | `#78816A` sage | ready stamp |
| stamp | `#B3261E` | cancelled, sold out |

Type: Lilita One is the brand voice, used only for the wordmark, drink names and
order numbers. DM Sans is the UI. Geist Mono carries every piece of ticket data:
order numbers, times, prices in the rail, table numbers, codes. Mono is the tell
that something is a record, not a label.

Grid: 12 columns, gutter `clamp(1rem, 0.6rem + 1.6vw, 2.5rem)`. Slips hang from a
rail line; nothing is centred except the confirmation. Radius rule: 1.25rem on
slips, 9999px on pills. The serrated top edge is a CSS mask, never an image.

Motion: one ease family, `cubic-bezier(0.16, 1, 0.3, 1)`. Slips slide in from the
rail direction, stamps land with a 1.06 overshoot, tears are a clip-path wipe.
Idle: the rail breathes, the dog's ears drift, the clock ticks.

## Screens

- `/kiosk` the board: categories, dietary filters, carousel, cart, order sheet
  (table, pickup time, tip, code, payment mock), idle attract, ES/EN, large text.
- `/order/[number]` the guest's slip, live status, polled.
- `/status` the ready board for the room.
- `/loyalty` stamp card, phone, reward.
- `/staff` the rail: three columns, aging, timers, sound, 86 panel.
- `/staff/menu` menu admin: prices, availability, allergens, categories, options.
- `/staff/roles` role admin.
- `/staff/stats` sales, top drinks, hourly.
- `/staff/history` history, search, reprint mock.
- `not-found` a slip that fell off the rail.

## Non-goals

No real payment, no real printer, no offline PWA, no test suite, no monitoring.
