import dayjs from "dayjs";
import {configStore, providers} from "../config.js";
import {AgentConfig, ProvidersInt, RawGeminiModel} from "../interface/myInterface.js";
import Conf from "conf";
import {Request, NextFunction, Response} from "express"
import {exec} from 'child_process';
import {getProviderModelUtility} from "../utility/utility.js";
import {ChatFe} from "./ChatFe.js";

export class ApiFe {

    protected app: any;
    protected router: any;
    protected config: Conf<AgentConfig> | null;

    constructor(app: any, router: any) {
        this.app = app
        this.router = router
        this.config = configStore

        this.isConfig = this.isConfig.bind(this);
        this.isUser = this.isUser.bind(this);
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
        this.router.post('/chat/:status', [this.isUser, this.isConfig], async (req: Request<{
            status: 'init' | 'next'
        }, any, {
            message: string,
            uuid: string | null
        }>, resp: Response) => {
            try {
                const status = req.params.status
                const msg = req.body.message
                const provider = configStore.get('modelSelected')
                const uuid = (req.body.uuid ? req.body.uuid : Math.random().toString(36).substring(0, 10)).toString().replaceAll('.', '')

                if (status === 'init') {
                    const role = provider?.toString().indexOf('gemini') === -1 ? 'system': 'user'
                    let s = (status === 'init')
                    if(role === 'user') s = false
                    ChatFe.init(uuid, msg,role,s)
                } else if (status === 'next')
                    ChatFe.user(msg, uuid)

                const globalMsg: string | any[] = await ChatFe.getFile(uuid)
                const agent = await getProviderModelUtility(provider, globalMsg, msg)
                if (!agent) {
                    ChatFe.delStorage(uuid)
                    return resp.status(422).json(agent)
                }
                ChatFe.assistant(agent.m, uuid)
                return resp.status(200).json({
                    uuid: uuid, global: globalMsg.filter(e => {
                        return e.role !== 'system'
                    }), t: (agent.c?.token ?? null)
                })

            } catch (err: any) {
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
        } catch (err: any) {
            throw err;
        }
    }


}