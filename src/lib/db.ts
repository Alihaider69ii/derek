/* eslint-disable no-var */
import dns from "dns";
import mongoose from "mongoose";

// Some hosts (Render, certain sandboxed/CI networks) ship a default DNS
// resolver that can't answer the SRV queries `mongodb+srv://` needs, which
// makes every DB-backed route fail with `querySrv ECONNREFUSED` even though
// the Atlas cluster itself is reachable. Pointing Node at public resolvers
// fixes it without needing to hardcode the cluster's shard hostnames.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/easemyprompt";

if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI missing, using local default:", MONGODB_URI);
}

declare global {
    var mongooseGlobal: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    } | undefined;
}

let cached = global.mongooseGlobal;

if (!cached) {
    cached = global.mongooseGlobal = { conn: null, promise: null };
}

async function connectToDatabase(retrying = false): Promise<typeof mongoose> {
    if (cached?.conn) {
        return cached.conn;
    }

    if (!cached?.promise) {
        const opts = {
            bufferCommands: false,
        };
        cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (error) {
        cached!.promise = null;
        // The very first SRV lookup after dns.setServers() above can fail
        // once while the resolver settles, even though retries succeed
        // immediately after — so one bounded retry avoids surfacing a
        // transient DNS hiccup as a user-facing 500.
        if (!retrying && (error as any)?.code === "ECONNREFUSED") {
            return connectToDatabase(true);
        }
        throw error;
    }

    return cached!.conn;
}

export default connectToDatabase;
