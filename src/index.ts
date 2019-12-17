import axios, { AxiosInstance, AxiosPromise as AP } from "axios"

export const create = async ({
  id,
  secret
}: {
  id: string
  secret: string
}): Promise<Client> => {
  const tok = await getToken(id, secret)
  const c = new Client(tok as string)
  c.root = (await c.getRoot()).data
  return c
}

export class Client {
  public root: RootRes
  public token = ""
  private api: AxiosInstance

  constructor(token: string) {
    this.token = token
    this.root = {} as RootRes
    this.api = axios.create({
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      timeout: 10000
    })
  }

  public async getRoot(): Promise<WatchtowerRes<RootRes>> {
    return await this.get<RootRes>("https://api.watchtower.dev/")
  }

  public async del<TR = unknown>(url: string): Promise<WatchtowerRes<TR>> {
    return await this.call<TR>(url, "DELETE")
  }

  public async get<TR = unknown>(url: string): Promise<WatchtowerRes<TR>> {
    return await this.call<TR>(url)
  }

  public async post<T = object, TR = unknown>(
    url: string,
    data?: T
  ): Promise<WatchtowerRes<TR>> {
    return await this.call<TR>(url, "POST", data as object | undefined)
  }

  private async call<TR>(
    url: string,
    method?: Method,
    data?: object
  ): Promise<WatchtowerRes<TR>> {
    const r = await logError<AP<TR>>(() =>
      this.api.request<TR>({
        data,
        headers: { Authorization: `Bearer ${this.token}` },
        method: method || "GET",
        url
      })
    )
    return {
      data: r.data,
      headers: r.headers,
      status: r.status
    }
  }
}

const getToken = async (id: string, secret: string): Promise<string> =>
  (
    await logError<AP<Token>>(() =>
      axios.post<Token>(
        "https://watchtower-test.auth0.com/oauth/token",
        {
          audience: "https://api.watchtower.dev/",
          // eslint-disable-next-line
          client_id: id,
          // eslint-disable-next-line
          client_secret: secret,
          // eslint-disable-next-line
          grant_type: "client_credentials"
        },
        { headers: { "Content-Type": "application/json" } }
      )
    )
  ).data.access_token

export const toBase64 = (input: string): string =>
  Buffer.from(input).toString("base64")

export const fromBase64 = (base64: string): string =>
  Buffer.from(base64, "base64").toString("utf8")

async function logError<TR>(fn: () => TR): Promise<TR> {
  try {
    return await fn()
  } catch (err) {
    // tslint:disable-next-line
    console.error(err)
    throw err
  }
}

export type ScheduleMin = 0 | 1 | 5 | 15 | 30 | 60 | 1440

export type Result = "passed" | "failed" | "pending"

export interface RootRes {
  links: {
    account: string
    monitors: string
  }
}

export interface MonReq {
  content: Base64
  name: string
  schedule: ScheduleMin
}

export interface MonRes {
  links: {
    runs: string
    self: string
  }
  id: string
  content: Base64
  created: string
  name: string
  schedule: ScheduleMin
}

export interface MonsRes {
  links: { self: string }
  items: MonRes[]
}

export interface NameValue extends Commentable {
  name: string
  value: string
}

export interface RunRes {
  links: { self: string }
  id: string
  created: string
  result: Result
}

export interface RunsRes {
  links: { self: string }
  items: RunRes[]
}

export interface Assert {
  jsonPath: string
  equal?: boolean | number | object | string | null
  error?: string
  greaterThan?: number
  lessThan?: number
  regex?: string
  type?: string[]
}

export interface CheckRes {
  entry: Entry
  error?: string
  name: string
  assertions: Assert[]
}

export interface RunByIdRes {
  checks: CheckRes[]
  created: string
  result: Result
}

export interface WatchtowerRes<T> {
  data: T
  headers: unknown
  status: number
}

type Token = Readonly<{ access_token: string }>
type Base64 = string

interface Commentable {
  comment?: string
}

interface Cookie extends NameValue {
  domain?: string
  expires?: string
  httpOnly?: boolean
  path?: string
  secure?: boolean
}

interface Cache extends Commentable {
  afterRequest?: object
  beforeRequest?: object
}

interface Timings extends Commentable {
  blocked?: number
  connect?: number
  dns?: number
  receive: number
  send: number
  ssl?: number
  wait: number
}

interface Content extends Commentable {
  compression?: number
  encoding?: string
  mimeType?: string
  size?: number
  text?: string
}

interface Response extends Commentable {
  bodySize?: number
  content: Content
  cookies?: Cookie[]
  headers: NameValue[]
  headersSize?: number
  httpVersion?: string
  redirectURL?: string
  status: number
  statusText: string
}

type Method = "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT"

interface PostData extends Commentable {
  mimeType?: string
  params: NameValue[]
  text?: object | string
}

interface Request extends Commentable {
  url: string
  bodySize?: number
  cookies?: NameValue[]
  headers?: NameValue[]
  headersSize?: number
  httpVersion?: string
  method?: Method
  postData?: PostData
  queryString?: NameValue[]
}

interface Entry extends Commentable {
  cache?: Cache
  connection?: string
  pageref?: string
  request: Request
  response: Response
  serverIPAddress?: string
  startedDateTime: string
  time: number
  timings?: Timings
}
