import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
        }),
        EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM || "noreply@easemyprompt.ai",
            sendVerificationRequest: async ({ identifier, url, provider }) => {
                const { host } = new URL(url);
                try {
                    // Use standard fetch to completely bypass Render's strict SMTP port blocking
                    const res = await fetch("https://api.resend.com/emails", {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            // If you haven't verified a domain in Resend, you MUST use 'onboarding@resend.dev'
                            // AND you can only send emails to the address you signed up to Resend with!
                            from: "onboarding@resend.dev",
                            to: identifier,
                            subject: `Sign in to ${host}`,
                            text: `Sign in to ${host}\n${url}\n\n`,
                            html: `
<body style="background: #f9f9f9;">
  <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: #ffffff; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center" style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: #333;">
        Sign in to <strong>${host}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="#FF4D00"><a href="${url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 10px 20px; display: inline-block; font-weight: bold;">Sign in</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: #888;">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`
                        })
                    });

                    if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(JSON.stringify(errorData));
                    }
                } catch (error) {
                    console.error("Resend API Error:", error);
                    throw new Error(`Failed to send email: ${error}`);
                }
            }
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }
                await connectToDatabase();
                const user = await User.findOne({ email: credentials.email });
                if (!user || !user.password) {
                    // Try to catch OAuth only users silently or error
                    throw new Error("No password found. Use Google or Magic Link to sign in.");
                }
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    throw new Error("Incorrect password");
                }
                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    image: user.image,
                } as any;
            }
        }),
    ],
    pages: {
        signIn: '/login', // Custom sign-in page
        verifyRequest: '/login?verify=1', // Used for check email message
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                // Attach the user ID from the database to the session
                (session.user as any).id = token.sub;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
