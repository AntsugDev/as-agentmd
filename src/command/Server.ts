import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import express from "express";
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
import {ApiFe} from "../fe/ApiFe.js";
import {ChatFe} from "../fe/ChatFe.js";
import {Request, Response} from "express"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Server extends AbstractProgram {
    private app: any | null;
    private port: number;
    private server: any | null;
    private router: any | null;

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
                this.server = this.app.listen(this.port, async () => {
                    try {
                        const url = `http://localhost:${this.port}`;
                        console.log(`Dashboard avviata con successo su: ${url}`);
                        ChatFe.clearAll()
                        await ChatFe.clear_archive(false)
                        await ChatFe.clear_uploads()
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