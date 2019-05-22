# sdk-js

[![npm](https://img.shields.io/npm/v/@watchtower-dev/sdk-js.svg)](https://www.npmjs.com/package/@watchtower-dev/sdk-js)
[![Build Status](https://travis-ci.org/watchtower-dev/sdk-js.svg)](https://travis-ci.org/watchtower-dev/sdk-js)
[![license](https://img.shields.io/github/license/watchtower-dev/sdk-js.svg)]()

Watchtower's TypeScript/JavaScript/Node SDK.

## Usage

Install with `npm install --save @watchtower-dev/sdk-js`

Get a list of your monitors:

```js
const { create } = require("@watchtower-dev/sdk-js")

create(process.env.WATCHTOWER_ID, process.env.WATCHTOWER_SEC)
  .then(async client => {
    const monitors = (await client.get(client.root.links.monitors)).data
    console.log(JSON.stringify(monitors, null, 2))
  })
```

Create a new monitor:

```js
const { create, toBase64 } = require("@watchtower-dev/sdk-js")

watchtower(process.env.WATCHTOWER_ID, process.env.WATCHTOWER_SEC)
  .then(async client => {
    const res = (await client.post(client.root.links.monitors, {
      content: toBase64(`
version: 1
checks:
  getExample:
    request:
      url: https://www.example.com
    assertions:
      - jsonPath: response.status
        equal: 200`),
      name: "Example Monitor",
      schedule: 60
    })).data
    console.log(JSON.stringify(res, null, 2))
  })
```
