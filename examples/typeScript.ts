import {
  create,
  IMonReq,
  IMonRes,
  IRunByIdRes,
  IRunRes,
  IRunsRes,
  toBase64
} from "../src"

create({
  id: process.env.WATCHTOWER_ID,
  secret: process.env.WATCHTOWER_SEC
}).then(async client => {
  // `create` fetches an access token and GETs the root resource
  log(client.root)
  // => {"links":{"account":"https://api.watchtower.dev/accounts/xxx","monitors":"https://api.watchtower.dev/monitors"}}

  // Navigate Watchtower's API using `links`
  log((await client.get<IMonRes>(client.root.links.monitors)).data)
  // => {"links":{"self":"https://api.watchtower.dev/monitors"},"items":[]}

  // Create a monitor
  const monitor = (await client.post<IMonReq, IMonRes>(
    client.root.links.monitors,
    {
      content: toBase64(`
checks:
  getExample:
    request:
      url: https://www.example.com
    assertions:
      - jsonPath: response.status
        equal: 200`),
      name: "Example Monitor",
      schedule: 60
    }
  )).data
  log(monitor)
  // => {"links":{"self":"https://api.watchtower.dev/monitors"},"items":[{"links":{"runs":"https://api.watchtower.dev/monitors/xxx/runs","self":"https://api.watchtower.dev/monitors/xxx"},"content":"xxx...","created":"2020-01-01T00:00:00.000Z","id":"xxx","name":"Example Monitor","schedule":60}]}

  // Trigger it to run
  const run = (await client.post<IRunRes>(monitor.links.runs)).data
  log(run)
  // => {"links":{"self":"https://api.watchtower.dev/monitors/xxx/runs/xxx"},"created":"2020-01-01T00:00:00.000Z","id":"xxx","monitorId":"xxx","result":"pending"}

  // Get all runs
  log((await client.get<IRunsRes>(monitor.links.runs)).data)
  // => {"links":{"self":"https://api.watchtower.dev/monitors/xxx/runs"},"items":[{"links":{"self":"https://api.watchtower.dev/monitors/xxx/runs/xxx"},"created":"2020-01-01T00:00:00.000Z","id":"xxx","result":"passed"}]}

  // Or just one, which includes detailed response data
  log((await client.get<IRunByIdRes>(run.links.self)).data)
  // => {"links":{"self":"https://api.watchtower.dev/monitors/xxx/runs/xxx"},"created":"2020-01-01T00:00:00.000Z","id":"xxx","monitorId":"xxx","result":"passed","checks":[{"assertions":[{"jsonPath":"response.status","equal":200}],"entry":{"request":{"url":"https://www.example.com","method":"GET"},"response":{"content":{"text":"<!doctype html>\n<html>...</html>\n"},"headers":{"content-type":"text/html; charset=UTF-8"},"status":200,"statusText":"OK"},"startedDateTime":"2020-01-01T00:00:00.000Z","time":133.968674},"name":"getExample"}]}

  // Delete the monitor
  log((await client.del<IMonRes>(monitor.links.self)).data)
})

// tslint:disable-next-line
const log = (obj: object) => console.log(`${JSON.stringify(obj)}\n`)
