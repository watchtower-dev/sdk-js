import axios, { AxiosInstance, AxiosPromise as AP } from "axios"

export const create = async ({
  id,
  secret
}: {
  id: string
  secret: string
}) => {
  const tok = await getToken(id, secret)
  const c = new Client(tok as string)
  c.root = (await c.getRoot()).data
  return c
}

export class Client {
  public root: IRootRes
  public token = ""
  private api: AxiosInstance

  constructor(token: string) {
    this.token = token
    this.root = {} as IRootRes
    this.api = axios.create({
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      timeout: 10000
    })
  }

  public async getRoot(): Promise<IWatchtowerRes<IRootRes>> {
    return await this.get<IRootRes>("https://api.watchtower.dev/")
  }

  public async del<TR = any>(url: string): Promise<IWatchtowerRes<TR>> {
    return await this.call<TR>(url, "DELETE")
  }

  public async get<TR = any>(url: string): Promise<IWatchtowerRes<TR>> {
    return await this.call<TR>(url)
  }

  public async post<T = object, TR = any>(
    url: string,
    data?: T
  ): Promise<IWatchtowerRes<TR>> {
    return await this.call<TR>(url, "POST", data as object | undefined)
  }

  private async call<TR>(
    url: string,
    method?: Method,
    data?: object
  ): Promise<IWatchtowerRes<TR>> {
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
  (await logError<AP<Token>>(() =>
    axios.post<Token>(
      "https://watchtower-test.auth0.com/oauth/token",
      {
        audience: "https://api.watchtower.dev/",
        client_id: id,
        client_secret: secret,
        grant_type: "client_credentials"
      },
      { headers: { "Content-Type": "application/json" } }
    )
  )).data.access_token

export const toBase64 = (input: string) => Buffer.from(input).toString("base64")

export const fromBase64 = (base64: string) =>
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

export interface IRootRes {
  links: {
    account: string
    monitors: string
  }
}

export interface IMonReq {
  content: Base64
  name: string
  schedule: ScheduleMin
}

export interface IMonRes {
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

export interface IMonsRes {
  links: { self: string }
  items: IMonRes[]
}

export interface INameValue extends ICommentable {
  name: string
  value: string
}

export interface IRunRes {
  links: { self: string }
  id: string
  created: string
  result: Result
}

export interface IRunsRes {
  links: { self: string }
  items: IRunRes[]
}

export interface IAssert {
  jsonPath: string
  equal?: boolean | number | object | string | null
  error?: string
  greaterThan?: number
  lessThan?: number
  regex?: string
  type?: string[]
}

export interface ICheckRes {
  entry: IEntry
  error?: string
  name: string
  assertions: IAssert[]
}

export interface IRunByIdRes {
  checks: ICheckRes[]
  created: string
  result: Result
}

export interface IWatchtowerRes<T> {
  data: T
  headers: any
  status: number
}

type Token = Readonly<{ access_token: string }>
type Base64 = string

interface ICommentable {
  comment?: string
}

interface ICookie extends INameValue {
  domain?: string
  expires?: string
  httpOnly?: boolean
  path?: string
  secure?: boolean
}

interface ICache extends ICommentable {
  afterRequest?: object
  beforeRequest?: object
}

interface ITimings extends ICommentable {
  blocked?: number
  connect?: number
  dns?: number
  receive: number
  send: number
  ssl?: number
  wait: number
}

interface IContent extends ICommentable {
  compression?: number
  encoding?: string
  mimeType?: string
  size?: number
  text?: string
}

interface IResponse extends ICommentable {
  bodySize?: number
  content: IContent
  cookies?: ICookie[]
  headers: INameValue[]
  headersSize?: number
  httpVersion?: string
  redirectURL?: string
  status: number
  statusText: string
}

type Method = "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT"

interface IPostData extends ICommentable {
  mimeType?: string
  params: INameValue[]
  text?: object | string
}

interface IRequest extends ICommentable {
  url: string
  bodySize?: number
  cookies?: INameValue[]
  headers?: INameValue[]
  headersSize?: number
  httpVersion?: string
  method?: Method
  postData?: IPostData
  queryString?: INameValue[]
}

interface IEntry extends ICommentable {
  cache?: ICache
  connection?: string
  pageref?: string
  request: IRequest
  response: IResponse
  serverIPAddress?: string
  startedDateTime: string
  time: number
  timings?: ITimings
}
