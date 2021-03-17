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

### Allows the caller to provide screenshots in real time or bulk using the API

SVG Screencast has only a single argument: an asynchronous iterator providing
screenshots as quickly or slowly as the caller wants. The stamps of the frames
are independent of real-time and if the caller provides screenshots faster than
SVG screencast can process them, a runtime cache will hold onto them so that
they all get processed in order eventually.

### Determines and replaces the damange area with shortest SVG representation

SVG Screencast optimizes the generated file size by using an algorithm for
change detection in the screenshots which results in small patches from one
screenshot to the next instead of a whole screenshot each time. Additionally,
SVG Screencast will look for combinations of patches whose cummulative sizes
are smaller than the individual patches, ensuring the optimal combination is
chosen, resulting in a small file size.

More improvements to the motion detection algorithm are underway.

### Produces SVGs than play in HTML and in GitHub & VS Code MarkDown/SVG preview

SVG Screencast deliberately uses only the most basic SVG and CSS features
ensuring that support for the general files is wide and stable. You can use the
generated SVGs wherever an image is accepted in MarkDown or HTML documents.

### Produces very nicely compressible text files taking little space to transmit

The SVG format is a text-based one and that makes it very suitable for GZIP
compression utilized by many web servers today. Normally, a SVG Screencast file
will take only half its size to transmit over the network when compressed.

## Non-Goals / Limitations

### Does not offer screen recording or video conversion out of the box by design

SVG Screencast has a video conversion tool in its developer tools, but it is
only rudimentary. Officially, it is recommended to pre-process the source media
into screenshots either ahead of time or on the fly using a dedicated and well
suited tool.

### Does not have interactivity of any kind (play/pause, restart, fade scrubbar)

The SVG Screencast generated files should be thought of as images, not videos,
so they do not offer any UI or interactivity. They also do not support sounds.

This is both a design choice and a technical limitation, as SVGs embedded thru
an `img` element will not run JavaScript - they have to be embedded directly in
the HTML for that.

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

The generated screencast is written into [`screencast.svg`](screencast.svg).

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

#### Make runnable through a CLI for video to screencast conversion feature

Reuse the `electron-generator` code to build a feature where when called using
`npm tomashubelbauer/svg-screencast screencast.mp4`, a `screencast.svg` file
would get generated in the same directory. Maybe also generate `screencast.html`
which would be the `inspector` application with the SVG pre-loaded or hard-coded
in it for debugging. This will make this project useful as a CLI tool.

#### Run the encoding in a worker to not stutter the capturing on main thread

I've inserted a few `setImmediate`s to make sure the main thread is not hogged
by the encoding all of the time, but the real solution is to decouple the main
thread capturing and the encoding by using a different thread, or in Node land,
by using a worker for the whole of encoding.

#### Simplify `node-generator` once Electron supports ESM entry point

`main.cjs` will then be possible to merge into `index.js` and `main` will be
possible to remove in `package.json`.

#### Consider the whole SVG string not just the data URL part in `optimize.js`

#### Return a whole new frame in `optimize.js` if better than the shortest patch

#### Add an optimization pass that would run after the patching and minimize

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

#### Compare SVG size with GIF size with GZIP compression and without

Use FFMPEG to generate a GIF of the same scene as the SVG screencast is showing
and capture the sizes of both as well as their GZIPped sizes using:

```sh
npx gzip-size-cli screencast.svg
```

#### Add an option to output the SVG and external images it links to

This will save space but will increase traffic overhead. This might be a
worthwhile tradeoff for some use-cases, so supporting it seems worth it.
