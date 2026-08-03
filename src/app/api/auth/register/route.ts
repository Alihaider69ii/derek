import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import connectToDatabase from "@/lib/db";
import clientPromise from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { getAdminSettings } from "@/lib/adminSettings";
import { logApiError } from "@/lib/apiErrorLog";

const PROVIDER_LABELS: Record<string, string> = {
    google: "Google",
    github: "GitHub",
};

export async function POST(req: Request) {
    try {
        const { firstName, lastName, email: rawEmail, password } = await req.json();

        if (!rawEmail || !password || !firstName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        // Normalize so this always matches how OAuth providers (Google, GitHub)
        // return emails — otherwise a credentials account and an OAuth account
        // with the same address but different casing look like two different
        // users to the DB adapter's getUserByEmail lookup, which is what
        // actually drives account linking on OAuth sign-in.
        const email = rawEmail.trim().toLowerCase();

        await connectToDatabase();

        const settings = await getAdminSettings();
        if (settings.maintenanceMode) {
            return NextResponse.json({ error: settings.maintenanceMessage }, { status: 503 });
        }
        if (!settings.featureFlags.signupsEnabled) {
            return NextResponse.json({ error: "New signups are temporarily disabled." }, { status: 403 });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            if (existingUser.password) {
                return NextResponse.json(
                    {
                        error: "An account with this email already exists. Please sign in with your password.",
                        code: "EMAIL_EXISTS_CREDENTIALS",
                    },
                    { status: 409 }
                );
            }

            // No password on file means this user was created by an OAuth
            // provider — look up which one so the message can name it.
            const client = await clientPromise;
            const linkedAccount = await client
                .db()
                .collection("accounts")
                .findOne({ userId: new ObjectId(existingUser._id.toString()) });

            const provider = linkedAccount?.provider;
            const providerLabel = provider ? PROVIDER_LABELS[provider] : undefined;

            return NextResponse.json(
                {
                    error: providerLabel
                        ? `An account with this email already exists. Please sign in with ${providerLabel}.`
                        : "An account with this email already exists. Please sign in with your original sign-in method.",
                    code: "EMAIL_EXISTS_OAUTH",
                    provider,
                },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const name = `${firstName} ${lastName || ""}`.trim();

        const newUser = new User({
            email,
            password: hashedPassword,
            name,
        });

        await newUser.save();

        return NextResponse.json({ success: true, message: "User registered safely." }, { status: 201 });
    } catch (error: any) {
        console.error("Registration Error", error);
        await logApiError("/api/auth/register", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
