# Document containing important decisions as to why certain stuff is the way it is in case I forget (again)

## Why tauri?

- React Native - Native UI is inconsistent across platforms, it will look different!!!!! import of code is not supported
  so eval must be used which adds complexity, harder to learn for plugin devs and smaller ecosystem
- Electron - Slow, no android support still not good
- Kotlin Multiplatform - Code injection using kotlin is not possible (at-least not on every platform), JavaScript code
  can be added but there are severe limitations and libraries are not maintained for that anymore

## Why is everything a handler?

- Any amount of args, return and config can be easily added and keeping minimal API is easier to handle

## Why use zustand?

- Redux - Not designed for MVVM use case and things that are automatically handled in mobx are not there which
  will read to accidental re-renders or worse,
- Jotai - Zustand seems more mature, smaller, and has smaller api
- Mobx - Big api, Big size, complex

## Why have 2 plugin loaders (from code which persists and plugin which doesn't)

- Because plugins like stremio ones are dynamic and deriving javascript code from that to persist is very difficult if
  not impossible, if there is a way the code one is preferred and the other one will be deprecated

## Why not encode plugins and other data to Base64 or maybe even WASM? it will be faster when storing!

- It will be faster but the user won't be able to read the code and Base64 will need to be decoded to js probably so
  don't think it will make much difference, WASM may be good idea in the future BUT hashes must be compared with the
  code
  of the plugin in case the user decided to manually change it which is lot of complexity

## Why force users to bundle code?

- To avoid complexity and reduce app size, the plugins will have to be bundled any way or another anyway since it will
  be far too much complexity
