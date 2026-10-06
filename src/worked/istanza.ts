import Piscina from 'piscina';

// @ts-ignore
const pool = new Piscina({
    filename: new URL('./index.js', import.meta.url).href,
    minThreads:2,
    maxThreads:5,
    maxQueue:10
});

export default pool;