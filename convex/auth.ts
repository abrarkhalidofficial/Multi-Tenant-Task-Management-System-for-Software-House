import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
});

export { auth, signIn, signOut, store };
