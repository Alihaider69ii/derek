import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";

export async function POST(req: Request) {
    try {
        const { firstName, lastName, email, password } = await req.json();

        if (!email || !password || !firstName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

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
