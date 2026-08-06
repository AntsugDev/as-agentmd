#!/usr/bin/env node

import {Command} from 'commander';
import {getAllModelsFlat, selectUnifiedModel, configStore} from './config.js';
import {syncModelsIfExpired} from './modelsFetcher.js';
import {runChatSession} from './runner.js';
import readline from 'readline';
import {csv} from "./utility/csv.js";

const program = new Command();

program
    .name('agentmd')
    .description('CLI personalizzata per automazione prompt e context engineering')
    .version('0.1.0');

// Esegui la sincronizzazione silenziosa ogni volta che lanci un comando
program.hook('preAction', async () => {
    await syncModelsIfExpired();
});

// Comando per impostare la chiave API
program
    .command('config')
    .description('Gestisci le configurazioni locali della CLI')
    .argument('<action>', 'Azione da eseguire (es: set-key)')
    .argument('<provider>', 'Il provider (es: gemini, openai)')
    .argument('[value]', 'La chiave API da salvare')
    .action((action, provider, value) => {
        if (action === 'set-key') {
            if (!value) {
                console.error('❌ Errore: Inserisci la tua API Key.');
                process.exit(1);
            }
            const p = provider.toLowerCase();
            configStore.set(`providers.${p}.apiKey`, value);
            console.log(`✅ Chiamata API salvata con successo per il provider: ${p}`);
        } else {
            console.log('Azione non riconosciuta. Usa: agentmd config set-key <provider> <key>');
        }
    });

// Comando per mostrare la configurazione attuale
program
    .command('show-config')
    .description('Mostra le configurazioni correnti e la lista dei modelli')
    .action(() => {
        console.log('\n⚙️  Configurazione Attuale:\n');
        console.dir(configStore.store, {depth: null});
    });

// Comando per forzare la sincronizzazione dei modelli
program
    .command('sync-models')
    .description('Forza la sincronizzazione della lista modelli dal cloud')
    .action(async () => {
        console.log('🔄 Sincronizzazione modelli in corso...');
        const result = await syncModelsIfExpired(true);
        if (result) {
            console.log('✅ Lista modelli aggiornata con successo!');
        } else {
            console.log('ℹ️ Nessun aggiornamento necessario o chiave API mancante.');
        }
    });

program
    .command('list-models')
    .description('Mostra tutti i modelli disponibili con descrizioni e limiti di token')
    .option('-p, --provider <provider>', 'Filtra per provider (es: gemini)', 'gemini')
    .action((options) => {
        const p = options.provider.toLowerCase();
        const providerConfig = configStore.get(`providers.${p}`) as any;

        if (!providerConfig) {
            console.log(`❌ Provider "${p}" non trovato.`);
            return;
        }

        console.log(`\n🤖 Modelli disponibili per [${p.toUpperCase()}]:\n`);

        if (providerConfig.modelsDetails && providerConfig.modelsDetails.length > 0) {
            providerConfig.modelsDetails.forEach((m: any) => {
                const isDefault = m.id === providerConfig.defaultModel ? ' (Default ⭐)' : '';
                console.log(`📌 \x1b[36m${m.id}\x1b[0m${isDefault}`);
                console.log(`   └─ \x1b[90m${m.description}\x1b[0m`);

                const inLimit = m.inputTokenLimit ? m.inputTokenLimit.toLocaleString() : 'N/A';
                const outLimit = m.outputTokenLimit ? m.outputTokenLimit.toLocaleString() : 'N/A';

                console.log(`   └─ 📥 Max Input Context:  \x1b[33m${inLimit}\x1b[0m token`);
                console.log(`   └─ 📤 Max Output Response: \x1b[33m${outLimit}\x1b[0m token\n`);
            });
        } else {
            providerConfig.models.forEach((m: string) => {
                console.log(`• ${m}`);
            });
            console.log('\n💡 Tip: Lancia "agentmd sync-models" per scaricare i dettagli aggiornati.');
        }
    });
program
    .command('run-chat')
    .argument('[message...]', 'Messaggio di testo iniziale per la chat')
    .description('Avvia una sessione di chat interattiva nel terminale')
    .action(async (message) => {
        await runChatSession(message);
    });

program
    .command('set-model')
    .argument('[modelOrIndex]', 'Numero dalla lista o ID del modello (opzionale)')
    .description('Seleziona il modello attivo da una lista unificata di tutti i provider')
    .action(async (modelOrIndex) => {
        const allModels = getAllModelsFlat();

        if (allModels.length === 0) {
            console.log(`\n⚠️ Nessun modello trovato nelle configurazioni.`);
            console.log(`👉 Esegui prima: \x1b[36magentmd sync-models\x1b[0m per sincronizzare le liste!\n`);
            return;
        }
        if (!modelOrIndex)
            csv(allModels)

        // Caso 1: L'utente ha passato l'argomento diretto (es: agentmd set-model 2 o agentmd set-model gemini-2.5-flash)
        if (modelOrIndex) {
            const numChoice = parseInt(modelOrIndex, 10);
            let selected = !isNaN(numChoice)
                ? allModels.find((m) => m.index === numChoice)
                : allModels.find((m) => m.id.toLowerCase() === modelOrIndex.toLowerCase());

            if (selected) {
                selectUnifiedModel(selected);
                printSelectionSuccess(selected);
                return;
            } else {
                console.log(`\n❌ Modello o numero "${modelOrIndex}" non valido.`);
            }
        }

        // Caso 2: Nessun parametro passato -> Mostra lista numerata ed entra in modalità interattiva!
        console.log(`\n🤖 \x1b[36mSeleziona il Modello di Default (Tutti i Provider):\x1b[0m\n`);

        allModels.forEach((m) => {
            const badgeDefault = m.isCurrentDefault ? ' \x1b[33m[ATTIVO ⭐]\x1b[0m' : '';
            const inLimit = m.inputTokenLimit ? `${m.inputTokenLimit.toLocaleString()} in` : 'N/A';
            const outLimit = m.outputTokenLimit ? `${m.outputTokenLimit.toLocaleString()} out` : 'N/A';

            console.log(`\x1b[36m[${m.index}]\x1b[0m \x1b[1m${m.id}\x1b[0m (\x1b[35m${m.provider.toUpperCase()}\x1b[0m)${badgeDefault}`);
            console.log(`    └─ ${m.description}`);
            console.log(`    └─ 📊 Limiti: 📥 ${inLimit} | 📤 ${outLimit}\n`);
        });

        // Prompt di input
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('👉 Inserisci il numero del modello desiderato: ', (answer) => {
            rl.close();
            const choice = parseInt(answer.trim(), 10);
            const selected = allModels.find((m) => m.index === choice);

            if (selected) {
                selectUnifiedModel(selected);
                printSelectionSuccess(selected);
            } else {
                console.log(`\n❌ Scelta non valida. Operazione annullata.\n`);
            }
        });
    });

function printSelectionSuccess(selected: any) {
    console.log(`\n✅ Modello attivo aggiornato con successo!`);
    console.log(`📌 Modello:  \x1b[32m${selected.id}\x1b[0m`);
    console.log(`🌐 Provider: \x1b[35m${selected.provider.toUpperCase()}\x1b[0m`);
    console.log(`📝 Info:     ${selected.description}\n`);
}

program.parse(process.argv);