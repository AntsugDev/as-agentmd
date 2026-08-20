import dayjs from "dayjs";
import {configStore, providers} from "../config.js";
import {AgentConfig, ProvidersInt, RawGeminiModel} from "../interface/myInterface.js";
import Conf from "conf";
import {Request, NextFunction, Response} from "express"
import {exec} from 'child_process';
import {getProviderModelUtility} from "../utility/utility.js";
import {ChatFe} from "./ChatFe.js";
import * as os from "node:os";
import path from "path";
import fs from "fs/promises";
import multer from "multer";
import {unlink} from "node:fs/promises";


interface Archive {
    uuid: string,
    name: string,
    title: string,
    data_content: [],
    time: string
}

export class ApiFe {

    protected app: any;
    protected router: any;
    protected config: Conf<AgentConfig> | null;
    protected upload: any | null;
    protected uploadMiddleware: any | null;

    constructor(app: any, router: any) {
        this.app = app
        this.router = router
        this.config = configStore

        this.isConfig = this.isConfig.bind(this);
        this.isUser = this.isUser.bind(this);
        const tmp = os.tmpdir();
        fs.mkdir(path.join(tmp, 'uploads'), {recursive: true})
        this.upload = multer({dest: path.join(tmp, 'uploads/')});
        this.uploadMiddleware = this.upload.array('files');
    }

    protected session() {
        const randomString: string = Math.random().toString(36).substring(2, 30);
        const expired: string = btoa(dayjs().add(12, 'hour').format('YYYYMMDDHHmmss'));
        return `${randomString}.${expired}`;
    }

    protected exception(resp: Response, error: string) {
        return resp.status(423).json(
            {
                error: error
            }
        )
    }

    protected isUser(req: Request, resp: Response, next: NextFunction) {
        try {
            const authHeader = req.headers['x-api-key'];
            if (!authHeader) {
                return resp.status(401).json({error: 'Session not found'});
            }
            const expired = dayjs(atob(authHeader.toString().split('.')[1]), 'YYYYMMDDHHmmss')
            const now = dayjs()
            if (now.isBefore(expired))
                next();
            else
                return resp.status(401).json({error: 'Session expired'});

        } catch (err: any) {
            next(err)
        }
    }

    protected isConfig(req: Request, resp: Response, next: NextFunction) {
        try {
            if (!this.config) return resp.json({
                error: "Config not found"
            }).status(404)
            next()
        } catch (err: any) {
            next(err)
        }
    }


    protected api_login() {

        this.router.get('/session', (req: Request, resp: Response) => {
            try {
                return resp.json({
                    'apiKey': this.session()
                })
            } catch (err: any) {
                return this.exception(resp, err.toString())
            }
        })

    }

    protected api_config() {

        this.router.get('/settings', [this.isUser, this.isConfig], (req: Request, resp: Response) => {
            try {
                if (this.config) {
                    const modelSelect = this.config.get('modelSelected')
                    const lastUpdated = this.config.get('lastUpdated') ? dayjs(this.config.get('lastUpdated'), 'YYYYMMDD').format('YYYY-MM-DD') : null
                    const providers = this.config.get('providers')
                    return resp.json({
                        modelSelected: modelSelect,
                        lastUpdated: lastUpdated,
                        providers: providers
                    })
                }
            } catch (err: any) {
                return this.exception(resp, err.toString())
            }
        })
    }

    protected api_model_select() {

        this.router.get('/settings/model', [this.isUser, this.isConfig], (req: Request, resp: Response) => {
            try {
                if (this.config) {
                    const modelSelect = this.config.get('modelSelected')
                    return resp.json({
                        modelSelected: modelSelect,
                    })
                }
            } catch (err: any) {
                return this.exception(resp, err.toString())
            }
        })
    }


    protected api_put_config() {
        this.router.put('/settings/:provider', [this.isUser, this.isConfig], (req: Request<{
            provider: string
        }, any, { apikey: string }>, resp: Response) => {
            try {
                const provider = req.params.provider
                if (this.config) {
                    if (provider && !providers().includes(provider))
                        return resp.json({
                            error: `Provider ${provider} not found`
                        }).status(404)
                    else {
                        const body = req.body
                        if (!body?.apikey || (body?.apikey && typeof body.apikey !== 'string'))
                            return resp.status(400).json({
                                error: `Bad request`
                            })
                        else {
                            const p: ProvidersInt = {
                                apiKey: body.apikey
                            }
                            this.config.set(`providers.${provider}`, p);
                            return resp.sendStatus(201);
                        }
                    }
                }
            } catch (err: any) {
                return this.exception(resp, err.toString())
            }
        })
    }

    protected api_del_config() {
        this.router.delete('/settings/:provider', [this.isUser, this.isConfig], (req: Request<{
            provider: string
        }, any, { apikey: string }>, resp: Response) => {
            try {
                const provider = req.params.provider
                if (this.config) {
                    if (provider && !providers().includes(provider))
                        return resp.json({
                            error: `Provider ${provider} not found`
                        }).status(404)
                    else {
                        const p: ProvidersInt = {
                            apiKey: null
                        }
                        this.config.set(`providers.${provider}`, p);
                        return resp.sendStatus(204);
                    }
                }
            } catch (err: any) {
                return this.exception(resp, err.toString())
            }
        })
    }

    protected sincro() {
        this.router.get('/sincro', [this.isUser, this.isConfig], (req: Request, resp: Response) => {
            try {
                const command = `agentmd sync`
                const c = exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Errore nell'esecuzione del comando: ${error.message}`);
                        return;
                    }
                    console.log(`Output del comando: ${stdout}`);
                })

                return resp.json({
                    msg: "La sincronizzazione è stata avviata con successo.",
                    pid: (c ? c.pid : null)
                })
            } catch (err: any) {
                return this.exception(resp, err.toString())
            }
        })
    }

    protected select_model() {
        this.router.get('/select_models/:model', [this.isUser, this.isConfig], (req: Request<{
            model: string
        }>, resp: Response) => {
            try {
                if (this.config) {
                    const model = req.params.model
                    this.config.set('modelSelected', model)
                    return resp.sendStatus(204)
                }
            } catch (err: any) {
                return this.exception(resp, err.toString())
            }
        })
    }

    protected get_models() {
        this.router.get('/models', [this.isUser, this.isConfig], (req: Request<{ model: string }>, resp: Response) => {
            try {
                const models: any[] = []
                if (this.config) {
                    Object.entries(this.config.get('providers')).map(([provider, data]) => {
                        if (data?.models) {
                            data.models.map((e: RawGeminiModel) => {
                                models.push({
                                    value: `${provider}|${e.name.toString().replace('models/', '')}`,
                                    text: `${provider} - ${e.displayName}`
                                })
                            })
                        }
                    })
                    return resp.json(models)
                }
            } catch (err: any) {
                return this.exception(resp, err.toString())
            }
        })
    }

    protected chat() {
        this.router.post('/chat/:status', [this.isUser, this.isConfig, this.uploadMiddleware], async (req: Request<{
            status: 'init' | 'next'
        }, any, {
            message: string,
            uuid: string | null,
            time: string | null
        }, any, {
            name_file: string | null
        }>, resp: Response) => {
            try {
                let time = req.body.time;
                const status = req.params.status
                const msg = req.body.message
                const provider = configStore.get('modelSelected')
                const uuid = (req.body.uuid ? req.body.uuid : Math.random().toString(36).substring(0, 10)).toString().replaceAll('.', '')

                const files = req.files as Express.Multer.File[] || [];

                const nameFile = req.query.name_file
                if (status === 'init') {
                    const role = provider?.toString().indexOf('gemini') === -1 ? 'system' : 'user'
                    let s = (status === 'init')
                    if (role === 'user') s = false
                    await ChatFe.init(uuid, msg, role, s)
                } else if (status === 'next')
                    await ChatFe.user(msg, uuid)

                const globalMsg: string | any[] = ChatFe.getFile(uuid)
                const agent = await getProviderModelUtility(provider, globalMsg, msg, files)
                if (!agent) {
                    ChatFe.delStorage(uuid)
                    await ChatFe.del_archive(uuid, time)
                    return resp.status(422).json(agent)
                }
                ChatFe.assistant(agent.m, uuid)
                time = await ChatFe._archive(globalMsg, uuid, nameFile)
                return resp.status(200).json({
                    uuid: uuid, global: globalMsg.filter(e => {
                        return e.role !== 'system'
                    }), t: (agent.c?.token ?? null),
                    time: time
                })

            } catch (err: any) {
                return this.exception(resp, err.toString())
            }
        })
    }

    protected archive() {
        this.router.get('/archive/:uuid', [this.isUser, this.isConfig], async (req: Request<{
            uuid: string
        }>, resp: Response) => {
            try {
                const uuid: string = req.params.uuid
                const globalMsg: string | any[] = await ChatFe.getFile(uuid)
                if (globalMsg) {
                    const c = await ChatFe._archive(globalMsg, uuid)
                    if (c) return resp.sendStatus(201)
                    else throw c
                } else
                    throw new Error("Chat not archived")
            } catch (err: any) {
                return this.exception(resp, err.toString())
            }
        })
    }

    protected get_archive() {
        this.router.get('/archive', [this.isUser, this.isConfig], async (req: Request, resp: Response) => {
            try {
                const tmp = os.tmpdir()
                const directory = path.join(tmp, 'chat')
                const files: string[] = await fs.readdir(directory)
                let response: Archive[] = []
                for (let r = 0; r < files.length; r++) {
                    const e = files[r]
                    const time = dayjs(e.toString().split('_')[1].toString().replace('.json', ''), 'YYYYMMDD')
                    const now = dayjs()
                    const filePath = path.join(directory, e);
                    const content = await fs.readFile(filePath, 'utf8');
                    if (content) {
                        let parser = JSON.parse(content)
                        parser = parser.filter((i: { role: string, content: string }) => {
                            return i.role !== 'system'
                        })
                        if (now.diff(time, 'day') <= 3)
                            response.push({
                                uuid: e.toString().split('_')[0],
                                name: e,
                                title: `${parser[0].content.toString().substring(0, 30)} ...`,
                                data_content: parser,
                                time: time.format('YYYY-MM-DD')
                            })
                    }
                }
                response = response.sort((a: Archive, b: Archive): number => {
                    const tA = dayjs(a.time, 'YYYY-MM-DD')
                    const tB = dayjs(b.time, 'YYYY-MM-DD')

                    if (tB.isAfter(tA)) return 1
                    if (tA.isAfter(tB)) return -1
                    return 0
                }).slice(0, 10)
                return resp.json(response)

            } catch (err: any) {
                return this.exception(resp, err.toString())
            }
        })
    }

    protected download() {
        this.router.get('/download', [this.isUser, this.isConfig], async (req: Request, resp: Response) => {
            try {
                const p = providers() ?? []
                if (p.length === 0) throw new Error("List providers not found")
                const headers = "PROVIDERS;NAME;DESCRIPTION;INPUT TOKEN;OUTPUT TOKEN"
                const directory = path.join(os.tmpdir(), 'uploads');
                const file = path.join(directory, 'providers_models.csv');
                await fs.writeFile(file, headers, 'utf-8');
                for (let r = 0; r < p.length; r++) {
                    const e = p[r]
                    if (!this.config) return;
                    const models: RawGeminiModel[] = this.config.get(`providers.${e}.models`) ?? []
                    for (let i = 0; i < models.length; i++) {
                        const ei: RawGeminiModel = models[i]
                        const row = `\n${e};${ei.displayName};${(ei.description ? ei.description : '')};${(ei.inputTokenLimit ? ei.inputTokenLimit : '')};${(ei.outputTokenLimit ? ei.outputTokenLimit : '')}`
                        await fs.appendFile(file, row, 'utf-8')
                    }
                }
                const stat = await fs.stat(file)
                if (!stat.isFile()) {
                    throw new Error("File not found")
                }

                const send = resp
                    .setHeader('Content-Type', 'text/csv')
                    .setHeader('Content-Disposition', `attachment; filename="providers_models.csv"`)
                    .download(file, (e) => {
                        if (e) throw e;
                    })
                resp.on('finish', () => {
                    unlink(file)
                })
                return send;
            } catch (err: any) {
                console.log(err)
                return this.exception(resp, err.toString())
            }
        })
    }


    public api() {
        try {
            this.app.use('/api', this.router);
            this.api_login();
            this.api_config();
            this.api_model_select();
            this.api_put_config()
            this.api_del_config()
            this.sincro()
            this.select_model()
            this.get_models()
            this.chat()
            this.archive()
            this.get_archive()
            this.download()
        } catch (err: any) {
            throw err;
        }
    }


}