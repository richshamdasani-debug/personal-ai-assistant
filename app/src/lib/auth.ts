import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

// Inline admin client to keep this file self-contained (no circular imports)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type AppUser = User & { plan?: string };

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials): Promise<AppUser | null> {
      if (!credentials?.email || !credentials.password) return null;

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error || !data.user) return null;

      return {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name ?? null,
        image: data.user.user_metadata?.avatar_url ?? null,
        plan: data.user.user_metadata?.plan ?? "starter",
      };
    },
  }),
];

// Only add Google provider when credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, account }) {
      // Persist custom fields on first sign-in
      if (user) {
        token.id = user.id;
        token.plan = (user as AppUser).plan ?? "starter";
      }
      // For Google sign-ins: ensure/create the user in Supabase
      if (account?.provider === "google" && token.email) {
        const { data: existing, error } =
          await supabaseAdmin.auth.admin.listUsers();
        if (!error) {
          const match = existing.users.find((u) => u.email === token.email);
          if (match) {
            token.id = match.id;
            token.plan = match.user_metadata?.plan ?? "starter";
          } else {
            // First Google sign-in — create a Supabase user
            const { data: created } =
              await supabaseAdmin.auth.admin.createUser({
                email: token.email as string,
                email_confirm: true,
                user_metadata: {
                  name: token.name,
                  avatar_url: token.picture,
                  plan: "starter",
                  provider: "google",
                },
              });
            if (created?.user) {
              token.id = created.user.id;
              token.plan = "starter";
            }
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id as string;
        (session.user as Record<string, unknown>).plan =
          token.plan as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
