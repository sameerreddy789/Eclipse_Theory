import { auth } from "./firebase-admin";

/**
 * Verifies the Firebase Auth ID Token from the Authorization header.
 * @param {Request} request 
 * @returns {Promise<{uid: string, email: string} | null>}
 */
export async function verifyAuth(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
}
