# [SVG Screencast](https://tomashubelbauer.github.io/svg-screencast)

![](https://github.com/tomashubelbauer/svg-screencast/actions/workflows/test.yml/badge.svg)

![](demo.svg)

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

### Node Generator

The Node sample uses Electron to generate screenshots and Node to generate the
screencast. The screenshot generation in Electron and screencast generation in
Node steps are split into two commands, because Electron does not support ES
Modules: https://github.com/electron/electron/issues/21457

```sh
cd node-generator

# Generate screenshots
npx electron .
# *.png screenshots

# TODO: Delete the latest screenshot (generates broken, known issue)

cd esm

# Install Sharp
npm install

# Generate screencast
node .
# ../../demo.svg screencast
```

The screencast is now ready. It can be inspected with the [Inspector].

### Browser Generator

SVG Screencast works both in Node and the browser. To try the browser example,
serve this repository (e.g.: `python3 -m http.server` and http://localhost:8000)
and click on *Generator*.

The generated screencast can be downloaded and inspected with the [Inspector].

### Inspector

The inspector allows viewing transitions from one from to another and the patch
that happen on each transition. To access it, serve this repository (e.g.:
`python3 -m http.server` and http://localhost:8000) and click on *Inspector*.

[Inspector]: #inspector

### Tests

To run tests:

```sh
for f in *.test.js;
do
  echo "$f"
  node $f
done
```

### To-Do

#### Demonstrate real-time usage once Electron supports ESM modules

https://github.com/electron/electron/issues/21457

```js
import electron from 'electron';
import screencast from '../screencast.js';

electron.app.once('ready', async () => {
  const window = new electron.BrowserWindow({ width: 600, height: 400 });
  window.loadFile('./index.html');

  async function* screenshot() {
    while (!window.isDestroyed()) {
      const nativeImage = await window.capturePage();
      yield { stamp: new Date(), buffer: nativeImage.toPNG() };
    }
  }

  window.webContents.once('dom-ready', async () => {
    await screencast('../realtime-demo.svg', screenshot());
  });
});
```

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

#### Add a mode to the demo app UI to load a video, extract frames and generate

Add multiple scripts to the browser generator application and make one of them
load a video file from the user and then extract its frames and feed them to the
algorithm to convert a video to a screencast through the frames - screenshots.

This will work best for screen recordings where it could beat GIF at lower size
and better quality, especially if we account for the GZIP compression of the SVG
in transit.

#### Fix the last screenshot generating broken in the Electron `demo` app

It won't preview correctly in VS Code and Sharp crashes parsing it. It probably
doesn't serialize fast enough to disk as the Electron process exits.

#### Do some research on comparison with GIF size accounting for GZIP and none

#### Compare the SVG size where each style preceeds its patches and collected

Currently we place a `style` element before each frame's patches. What if we
instead collected all the rules in a single stylesheet at the end? It would
block the playback until the whole file is loaded (but do we play now while it
is loading?) but might decrease the file size.

#### Fix the broken tests

The tests are broken again, due to the missing Sharp dependency which was
moved.
