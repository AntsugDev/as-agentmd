import Database from "better-sqlite3";

export const activeScheduler = (db: Database.Database | undefined, inCreate: boolean, status: number = 1) => {
    try {
        if(!db) throw new Error("Database not found (activeScheduler)")
        let query = "";
        if (inCreate) {
            query = "UPDATE LOCK SET VALUE = ? WHERE KEY = 'ACTIVE_SCHED';"
            db?.prepare(query).run([status])
        } else {
            query = "SELECT COUNT(*) as TOTAL FROM LOCK WHERE KEY = 'ACTIVE_SCHED' AND VALUE = 1"
            const result: any = db?.prepare(query).get()
            if (result && result.TOTAL === 1) return true
            else return false;
        }
        return true
    } catch (err: any) {
        console.log(`activeScheduler exception:`, err)
        return true
    }
}