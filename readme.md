# [SVG Screencast](https://tomashubelbauer.github.io/svg-screencast)

![](https://github.com/tomashubelbauer/svg-screencast/actions/workflows/test.yml/badge.svg)

![](screencast.svg)

SVG Screencast is a project which generates animated SVG files by using CSS
animations to reveal elements. Feed it an array of screenshots and stamps and it
will determine the changes between frames and output an animated SVG screencast.

## Installation & Usage

Not ready for general use yet, if interested, check out [Development] below.

[Development]: #development

## Features

- Allows accepting screenshots either ahead of time (bulk) or streamed real-time
- Updates the changed regions only (primitive pixel-diff algorithm as of now)
- Produces SVGs playable in MarkDown/SVG preview on GitHub and in VS Code
- Uses standard SVG and CSS features resulting in great support (even Safari)

## Limitations

- Does not produce minimal file sizes yet, a smarter algorithm is in the works
- Does not have interactivity of any kind (play/pause, restart, fade scrubbar
  based on pointer hover), SVG embedded through `img` won't run JavaScript
- Does not show the mouse cursor at the moment (a solution is in the works tho)

## Development

SVG Screencast works both in browser and in Node. Development and testing is
facilitated using so called *generators*.

Generators are programs which use SVG Screencast at their core, but produce the
screencast from screenshots using platform-specific APIs for image manipulation
(generating/capturing, cropping, saving etc.).

### Electron Generator

```sh
cd electron-generator
npx electron .
```

The generated screencast is written into [`screencast.svg`](screencast.svg) and
can be inspected with the [Inspector].

### Browser Generator / Converter / Inspector

Web-based tools can be accessed by serving this repository with a web server and
clicking the respective link, e.g.:

```
python3 -m http.server
# http://localhost:8000
```

### Tests

```
cd test
npm install
node .
```

### To-Do

#### Simplify `node-generator` once Electron supports ESM entry point

`main.cjs` will then be possible to merge into `index.js` and `main` will be
possible to remove in `package.json`.

#### Add an optimization pass that would run after the patching and minimize

- For each frame, check the patches, their total SVG string length and see if
  merging them group-wise recursively finds a combination which is smaller than
  the individual patches
- Detect patches which are just horizontal/vertical shifts of some rectangular
  area and represent them using an SVG animation instead of the patches
  - Add support for detecting cropping to enable animation of content moved by
    a scrollbar
- Detect patches which are progressive unfolding of a larger area, for example
  like typing on a line, and animate that using a crop of a single, big patch
  instead of the multiple individual patches
- Detect parts of patches which are solid color rectangles and break down the
  patch into several such that the solid color rectangle becomes an SVG element
  and not image data if the total SVG string length savings are worth it
  - Do the same for patches which have big areas which are all unchanged pixels
    (like something changing border color but not content)
- Remove patches which negated themselves instead of replacing with the original
  background (must check that the considered area was not used by other patches)

#### See if playback looping would be possible to do in the CSS animation

I think this should be doable by making all animation durations equal to the
overall duration of the screencast and then calculating a keyframe percentage
that corresponds to the desired duration and animating from hidden, to visible
(at the percentage keyframe) to hidden again. If this rule was played in a loop
(using `infinite`), it should theoretically reveal everything, then hide it all
again and then pick up again.

The naive implementation of this would be to ditch streaming otherwise we could
not compute the ratio of the desired and total duration. Maybe putting all the
frame styles at the end when the total duration is known could be a solution for
looping which preserves the streaming API?

#### Consider optionally adding a scrubbar or another animation length indicator

Need to go with a low-key muted bar at the bottom edge to not interfere with the
content as the scrubbar can't be toggled depending on the pointer state without
JavaScript.

#### Consider adding support for cursor, keystrokes and annotations

These would be extra elements intertwined with the frames. The cursor would be a
standalone image whose coordinates would be obtained using `electron.screen`'s
method `getCursorScreenPoint` adjusted to the window coordinate system. Cursor
icons would not be supported (unless we want to query those in Electron and save
that information, too, in which case they could be and quite trivially, too.).

Keystrokes would be just a `rect` and `text` combo which would pop up at a pre-
determined location and disappear once replaced with another keystroke or once
expired, whichever comes first. A stack of last keystrokes could be kept to make
them available for a guaranteed interval in case of fast typing / shortcut use.

This whole problem generalizes to intertwining custom elements with the frames,
the approaches needed to support cursor and keystrokes are probable capable such
that they could also support custom annotations of any kind, so look into that.

#### Build a full-screen recorder by using the platform screenshot capture API

I tried to use FFI and GYP, but it's so stupidly non-straightforward to install
that I have given up on it. It is not worth figuring it out, because it is too
fragile. This functionality can already be supported by just loading up a bunch
of screenshots, but I wonder what could be done to make it also usable in real-
time screenshot streaming.

#### Compare SVG size with GIF size with GZIP compression and without

Find a way to serve the files with compression and use the browser developer
tools numbers to get the compression data.

```sh
pip3 install httpcompressionserver
python3 -m httpcompressionserver`
```

#### Add an option to output the SVG and external images it links to

This will save space but will increase traffic overhead. This might be a
worthwhile tradeoff for some use-cases, so supporting it seems worth it.
