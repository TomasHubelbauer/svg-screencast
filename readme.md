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

Web-based tools can be accessed by serving this repository with a web server and
clicking the respective link, e.g.:

```
python3 -m http.server
# http://localhost:8000
```

### Electron Generator

```sh
cd electron-generator
npx electron .
```

The generated screencast is written into [`screencast.svg`](screencast.svg) and
can be inspected with the [Inspector].

### Browser Generator (**Generator** link)

The generated screencast can be downloaded and inspected with the [Inspector].

### Converter (**Converter** link)

The converter allows for extracting screenshots - frames - of a video and using
them to generate a screencast. It is useful as a benchmark of both the fidelity
and performance of SVG Screencast.

The generated screencast can be downloaded and inspected with the [Inspector].

### Inspector (**Inspector** link)

The inspector allows viewing transitions from one screenshot of the screencast
to another and the patches that are applied to facilitate them.

[Inspector]: #inspector

### Tests

To run a particular test, go to `test/$test` and run `node .`. To run all tests,
refer to [`test.yml`](.github/workflows/test.yml).

### To-Do

#### Simplify `node-generator` once Electron supports ESM entry point

`main.cjs` will then be possible to merge into `index.js` and `main` will be
possible to remove in `package.json`.

#### Spike an optimized alternative to `patch.js` to use in the constructor

Techniques to explore:

- Keep merging overlapping, touching or even nearby patches as long as the
  length of the resulting SVG string is smaller than the length of the SVG
  string needed to represent the two individual patches.
- Detect motion of rectangular areas and signal a patch move and crop as opposed
  to patch replace. This will optimize scrolling of otherwise unchanged content.
  Use CSS animations to move and crop the patch instead of revealing it.
- Further the scrolling detection technique in case of scrolling changed content
  by detecting scroll candidate areas and then detecting change patches within
  them (as they move) and finding the optimal combination of scroll and patch
  signals which results in the shortest SVG string.
- Retrospect and calculate patches which are revealed progressively instead of
  all at once. E.g.: typing on a line would be a single patch whose slots would
  be revealed letter by letter (using CSS animation to control the crop points)
  instead of a set of individual patches for each letter.

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

#### Add a *Make test case* button to the Inspector to download before and after

This button will download the before and after screenshot and the JSON with the
regions which can then be copied to a directory in `test` and becomes a test
case. This will be useful to debug the frames which have patches which overlap
for some reason.

#### Compare SVG size with GIF size with GZIP compression and without

Find a way to serve the files with compression and use the browser developer
tools numbers to get the compression data.

#### Compare the SVG size where each style preceeds its patches and collected

Currently we place a `style` element before each frame's patches. What if we
instead collected all the rules in a single stylesheet at the end? It would
block the playback until the whole file is loaded (but do we play now while it
is loading?) but might decrease the file size.

#### Add an option to output the SVG and external images it links to

This will save space but will increase traffic overhead. This might be a
worthwhile tradeoff for some use-cases, so supporting it seems worth it.
