# SVG Screencast

![](screencast.svg)

## Running

`npm start` (`electron .`)

## Resources

- [Electron Quick Start](https://electronjs.org/docs/tutorial/first-app)

## Considerations

I tried to use FFI and GYP, but it's so stupidly non-straightforward to install
that I have given up on it. It is not worth figuring it out, because it is too
fragile. I also tried using `dotnet script` and do the screnshooting logic in
C#, but Omnisharp is a pain in the ass and that's not worth figuring out either.

In the end I've decided for now using the Electron API for capturing the page
area only and will find a solution for full screen shooting later on, probably
using just bare C or Rust and doing the system API calls directly from it.

## To-Do

### Fix the diff misidentifying the coordinates of the changed pixels
