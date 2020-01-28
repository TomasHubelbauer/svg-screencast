# SVG Screencast

[**DEMO**](https://tomashubelbauer.github.io/svg-screencast/screencast.svg.html)

![](screencast.svg)

> SVG Screencast is a tool for creating animated SVGs using CSS animations and
> a series of 

SVG Screencast is a project which generates animated SVG files by using CSS
animations to reveal elements.

In its current form, it is demonstrated using an Electron window, which is
continuously screenshot and the last and next screenshots are compared to find
the region of change, which is then cropped out of the screenshot and used as a
patch for the background. By revealing the patches and timing them accodingly,
an animation, a screencast of the Electron window, is created.

## Running

`npm start` (`electron .`)

## Testing

`npm test` (`node test`)

## To-Do

### Fix the issue with the diff going crazy (returning a lot of regions) when scrolled

Not only the moment the scroll bar appears, but each subsequent screenshot after the
first scroll generates more and more regions.

### Consider using SVG crop to successively reveal portions of a patch

If we have successive patches in for example typing on a line
where each letter is its own patch, we could have a heuristic
where we merge these baby patches into a single bigger patch
and use CSS crop filter to reveal the portions of the larger
patch successively until it is revealed in full.

This should save space by not including many small Base64 PNGs
but instead one bigger one which is just animated in a smart
way.

### Consider recognizing basic motion, such as scrolling

This could be done by for each pixel finding the nearest pixel of that exact
color (say in only horizontal or vertical position) and seeing if in the changes
they all have the same distance (meaning a movement of the entire shape in the
same direction by the same amount), then taking the boundary box of that,
clipping it and patching with it.

### Consider looking into headless software rendering just because

https://medium.com/@mohamedmansour/how-to-run-electron-js-in-software-rendering-headless-49601b87961e

### See if looping would be possible to do in the CSS animation

Would probably have to play around with the animation delay and duration or use
a two step animation for each frame.

### Add an option to flip back to the first frame at the end of the video

Do this by creating a CSS rule targetting all images with IDs and hiding them
using an animation.

### Consider optionally adding a scrubbar or another animation length indicator

### Capture the cursor and include it in the animation as a standalone image

Move the image using CSS animations.
Use `electron.screen.getCursorScreenPoint` and subtract the window position from
it. Introduce a new method `point` distinct from `cast` which emits the `style`
element for moving the cursor. If the cursor tracking and rendering was enabled,
on the first frame, also emit the initial cursor `image` element and hide the
cursor off screen before it is first moved to the viewport.

This will not capture various different cursor states, to have that, we'd either
need to query the system to find the current cursor style or add a `mouseMove`
hook to the client page and relay the cursor state information to the main
process assuming the client page's JavaScript can tell what's the current cursor
state.

### Display keystrokes in the animation optionally

Display keys being pressed and shortcuts being used like some screenrecording
software does.

### Extract the code out to a library and allow feeding it frames

Preserve the ability to feed it Electon NativeImage instances and extend it to
allow also passing in blobs so that it can be used in both Node and the browser,
where it might be useful for generating animations in the browser.

### Build a full-screen recorder by using the platform APIs to take a screenshot

I tried to use FFI and GYP, but it's so stupidly non-straightforward to install
that I have given up on it. It is not worth figuring it out, because it is too
fragile.

I also tried using `dotnet script` and do the screnshooting logic in C#, but
Omnisharp is a pain in the ass and that's not worth figuring out either.

It will probably be best to write this directly this program in C or Rust and
send the frames to the JS library.

The library itself will remain written in JavaScript so that it can be used in
CI/CD scenarios to record Electron UI tests etc.
