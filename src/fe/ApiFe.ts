import dayjs from "dayjs";
import {configStore, providers} from "../config.js";
import {AgentConfig, ProvidersInt} from "../interface/myInterface.js";
import Conf from "conf";
import {Request, NextFunction, Response} from "express"
import {exec} from 'child_process';
import {ChildProcess} from "node:child_process";

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


    public api() {
        try {
            this.app.use('/api', this.router);
            this.api_login();
            this.api_config()
            this.api_put_config()
            this.api_del_config()
            this.sincro()
        } catch (err: any) {
            throw err;
        }
    }


}