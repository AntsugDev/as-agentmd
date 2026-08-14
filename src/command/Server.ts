import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import express, {response} from "express";
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';
import {randomInt} from "node:crypto";
import {ApiFe} from "../fe/ApiFe.js";
import listEndpoints from 'express-list-endpoints';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Server extends AbstractProgram {
    private app: any | null;
    private port:number;
    private server:any|null;
    private router:any|null;

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
            this.app.use(express.static(path.join(__dirname, '../public')));
            this.getDataAll()
            console.log('-----------------ROUTER--------------------')
            console.log(listEndpoints(this.router))
            console.log('-------------------------------------')
        } catch (e: any) {
            throw e;
        }
    }

    getData(): void {
        this.program.command('server').description("Start server").action(() => {
            try{
                this.init();
                this.server = this.app.listen(this.port,async () => {
                    const actualPort = this.server.address().port;
                    const url = `http://localhost:${actualPort}`;
                    console.log(`Dashboard avviata con successo su: ${url}`);
                })
                this.server.on('error', (err:any) => {
                    if (err.code === 'EADDRINUSE') {
                        console.log(`La porta ${this.port} è già occupata. Ne cerco una casuale libera...`);
                        this.port = randomInt(4)
                        this.getData();
                        return;
                    } else {
                        console.error('Errore imprevisto nell\'avvio del server:', err);
                    }
                });
            }catch (err:any){
                console.error("Server not started",err)
            }
        })

    }

    getDataAll(): void {
        this.app.get('/up', (req:any, resp:any) => {
            return resp.json({
                status:'ok'
            })
        })
        const api = new ApiFe(this.app,this.router)
        console.log('api',api)
        api.api()
        //set api key
        // get config
        // get models
        // chat

    }

    setData(): void {
    }

}