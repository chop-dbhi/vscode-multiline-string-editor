# Multiline String Editor

Easily edit multiline strings that need to be encoded as single-line strings (for example, JSON strings that contain literal `\n` characters).

## Features

Open new column for editing stringified JSON in JSON, and update JSON on save.

![how_to_use](./assets/how_to_use.gif)

## How to Use

![how_to_use](./assets/how_to_use.gif)

1. Move caret to the target string.

![caret_on_target](./assets/caret_on_target.png)

2. Open command palette and select `Edit as multiline string`.

3. Edit opened `stringified.txt`.

## Developing

1. Clone the repository, and install its dependencies:

```
git clone <this repository>
cd <this directory>
npm install
code .
```

2. Run `npm run compile`.
3. Press `F5` to launch a development window.
4. You can refresh the development window (from within the development window) with `Cmd + Shift + P` -> `Developer: Reload Window`.
