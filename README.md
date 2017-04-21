# pwabuilder-win32

## PWA Builder Windows Desktop Platform

Win32 platform module for [PWA Builder](https://github.com/manifoldjs/ManifoldJS), a tool for creating hosted web applications based on a [W3C Web App manifest](http://www.w3.org/TR/appmanifest/).

## Documentation
To get started, visit our [wiki](https://github.com/manifoldjs/ManifoldJS/wiki).

## Installation

Make sure PWA Builder is installed. If not, install using:

```
npm install -g pwabuilder
```

Add macOS platform by

```
pwabuilder platform add win32 pwabuilder-win32
```

## Usage

```
pwabuilder http://travelcontoso.azurewebsites.net -p win32
```

You can also convert your win32 app into a Windows Store app using [electron-windows-store](https://github.com/felixrieseberg/electron-windows-store)

## Future work
*   Package into zip and installer formats

## Screenshot

![](http://i.imgur.com/HilqIJe.gif)

## License

> pwabuilder-win32

> Copyright (c) Microsoft Corporation

> All rights reserved.

> MIT License

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the ""Software""), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

> THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
