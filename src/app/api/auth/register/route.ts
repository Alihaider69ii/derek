import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";

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

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
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
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
