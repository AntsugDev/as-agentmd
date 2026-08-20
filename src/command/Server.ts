import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import express from "express";
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
import {ApiFe} from "../fe/ApiFe.js";
import listEndpoints from 'express-list-endpoints';
import fs from "fs";
import * as fs_promise from "fs/promises";
import {ChatFe} from "../fe/ChatFe.js";
import * as os from "node:os";
import {Request,  Response} from "express"

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
                exposedHeaders: ['x-api-key','Content-Disposition'],
            }))
            this.app.use(express.static(path.join(__dirname, '../public')));
            this.getDataAll()
            this.getRouter()
        } catch (e: any) {
            throw e;
        }
    }

    private async getRouter() {
        try {
            const l = listEndpoints(this.router);
            const tmp = os.tmpdir()
            const directory = path.join(tmp, 'files')
            await fs_promise.mkdir(directory, {recursive: true})
            const file = path.join(directory, 'router.json');
            fs.writeFile(file, JSON.stringify(l, null, 2), 'utf-8', (e) => {
                if (e)
                    console.log(`Eccezione nella creazione delle rotte`, e)
            });
            console.log(`Rotte aggiornate vedi il file into files/router.json`)
        } catch (err: any) {
            console.error(`Lista rotte errore ${err.toString()}`)
        }
    }


    getData(): void {
        this.program.command('server').description("Start server").action(() => {
            try {
                this.init();
                this.server = this.app.listen(this.port, async () => {
                    const actualPort = this.server.address().port;
                    const url = `http://localhost:${actualPort}`;
                    console.log(`Dashboard avviata con successo su: ${url}`);
                    ChatFe.clearAll()
                    ChatFe.clear_archive(false)
                    ChatFe.clear_uploads()
                })
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
        this.app.get('/{*splat}', (req:Request, resp:Response) => {
           return resp.sendFile(path.join(__dirname, '../public/index.html'));
        });

    }

    setData(): void {
    }

}