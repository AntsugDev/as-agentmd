import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import express from "express";
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
import {randomInt} from "node:crypto";
import {ApiFe} from "../fe/ApiFe.js";
import listEndpoints from 'express-list-endpoints';
import fs from "fs";
import {ChatFe} from "../fe/ChatFe.js";

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
                exposedHeaders: ['x-api-key'],
            }))
            this.app.use(express.static(path.join(__dirname, '../public')));
            this.getDataAll()
            this.getRouter()
        } catch (e: any) {
            throw e;
        }
    }

    private getRouter() {
        try {
            const l = listEndpoints(this.router);
            fs.writeFile('./files/router.json', JSON.stringify(l, null, 2), 'utf-8', (e) => {
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
    }

    setData(): void {
    }

}