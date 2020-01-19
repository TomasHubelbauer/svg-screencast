# SVG Screencast

![](screencast.svg)

SVG Screencast is a project which generates animated SVG files by using CSS
animations to reveal elements.

In its current form, it is demonstrated using an Electron window, which is
continuously screenshot and the last and next screenshots are compared to find
the region of change, which is then cropped out of the screenshot and used as a
patch for the background. By revealing the patches and timing them accodingly,
an animation, a screencast of the Electron window, is created.

## Running

`npm start` (`electron .`)

## To-Do

### Consider optionally adding a scrubbar or another animation length indicator

### Capture the cursor and include it in the animation as a standalone image

Move the image using CSS animations.

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
