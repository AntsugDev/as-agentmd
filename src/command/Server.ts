import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import express from "express";
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
import {ApiFe} from "../fe/ApiFe.js";
import {ChatFe} from "../fe/ChatFe.js";
import {Request, Response} from "express"
import pool from "../worked/istanza.js";
import dayjs from "dayjs";
import {ClearDirectory} from "../scheduler/clearDirectory.js";
import {isActiveEmbending} from "../scheduler/Embindings.js";
import {isActiveScheduler} from "../scheduler/Scheduler.js";
import {log_worked, logger} from "../utility/storage.js";
import Database from "better-sqlite3";
import {db} from "../database/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Server extends AbstractProgram {
    private app: any | null;
    private port: number;
    private server: any | null;
    private router: any | null;

    public complete: boolean = false;

    private cTimeout: any | null = null;

    constructor(program: Command) {
        super(program);
        this.app = express()
        this.router = express.Router()
        this.port = 1010
        this.server = null;
    }

    private init() {
        try {
            this.app.use(express.json());
            this.app.use(cors({
                origin: 'http://localhost:5173',
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATH', 'OPTIONS'],
                allowedHeaders: ['x-api-key', 'Content-Type', 'Authorization'],
                exposedHeaders: ['x-api-key', 'Content-Disposition'],
            }))
            this.app.use(express.static(path.join(__dirname, '../public')));
            this.getDataAll()
        } catch (e: any) {
            throw e;
        }
    }

    protected async intervalChunck(_db:Database.Database |undefined) {
        try {
            const delay = 2 * 60 * 1000
            setInterval(async () => {
                try {
                    log_worked('INFO',`Check action the scheduler of the chunks ${isActiveEmbending && isActiveScheduler ? 'START' :'BLOCKED'} `,_db,'INTERVAL CHUNK')
                    if (!isActiveEmbending && !isActiveScheduler) {
                        await pool.run('CHUNK')
                    }
                } catch (ec: any) {
                    throw ec;
                }
            }, delay)
        } catch (e: any) {
            throw e;
        }
    }

    protected async intervalEmb(_db:Database.Database|undefined) {
        try {
            const delay = 3 * 60 * 1000
            setInterval(async () => {
                try {
                    log_worked('INFO',`Check action the scheduler of the embeddings ${isActiveEmbending && isActiveScheduler ? 'START' :'BLOCKED'} `,_db,'INTERVAL EMBEDDINGS')
                    if (!isActiveEmbending && !isActiveScheduler) {
                        await pool.run('EMB')
                    }
                } catch (eM: any) {
                    throw eM;
                }
            }, delay)
        } catch (e: any) {
            throw e;
        }
    }

    protected _clear() {
        if (this.cTimeout) {
            clearTimeout(this.cTimeout)
            this.cTimeout = null
        }
    }


    protected startWorker(_db:Database.Database |undefined): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                const delay = 30 * 1000
                setTimeout(async () => {
                    try {
                        if (!this.complete) {
                            log_worked('INFO','Start worked ...',_db,'START')
                            this.complete = true
                            await this.intervalChunck(_db)
                            await this.intervalEmb(_db)
                            this._clear()
                            resolve(true)
                        } else {
                            this._clear()
                            await this.startWorker(_db)
                            resolve(false)
                        }
                    } catch (er: any) {
                        throw er;
                    } finally {
                        //await ClearDirectory.worked()
                    }
                }, delay)
            } catch (e: any) {
                reject(e)
            }
        })
    }


    getData(): void {
        this.program.command('server').description("Start server").action(() => {
            try {
                this.init();
                process.on('uncaughtException', (err) => {
                    console.error('ERRORE CRITICO NON GESTITO:', err);
                });

                process.on('unhandledRejection', (reason, promise) => {
                    console.error('PROMISE REJECTED NON GESTITA:', reason);
                });
                process.on('SIGTERM', async () => {
                    console.log('Shutdown...');

                    this.server.close(async () => {
                        await pool.destroy();
                        process.exit(0);
                    });
                });

                this.server = this.app.listen(this.port, async () => {
                    try {
                        const url = `http://localhost:${this.port}`;
                        console.log(`Dashboard avviata con successo su: ${url}`);
                        ChatFe.clearAll()
                        await ChatFe.clear_archive(false)
                        await ChatFe.clear_uploads()
                        await this.startWorker(db)
                    } catch (err: any) {
                        console.log('Server not started', err)
                    }
                }).on('err', (err: any) => {
                    if (err.code === 'EADDRINUSE') {
                        console.error(`La porta ${this.port} è già in uso! Chiudi l'altro processo.`);
                    } else {
                        console.error('Errore del server:', err);
                    }
                });
            } catch (err: any) {
                console.error("Server not started", err)
            }
        })

    }

    getDataAll(): void {
        this.app.get('/up', (req: any, resp: any) => {
            return resp.json({
                status: 'ok'
            })
        })
        const api = new ApiFe(this.app, this.router)
        api.api()
        this.app.get('/{*splat}', (req: Request, resp: Response) => {
            return resp.sendFile(path.join(__dirname, '../public/index.html'));
        });

    }

    setData(): void {
    }

}