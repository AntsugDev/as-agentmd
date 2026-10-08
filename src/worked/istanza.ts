import Piscina from 'piscina';

// @ts-ignore
export const poolScheduler = new Piscina({
    filename: new URL('./index.js', import.meta.url).href,
    minThreads:2,
    maxThreads:5,
    maxQueue:10
});

//@ts-ignore
export const poolEmb = new Piscina({
    filename: new URL('./index.js', import.meta.url).href,
    minThreads:2,
    maxThreads:5,
    maxQueue:10
});