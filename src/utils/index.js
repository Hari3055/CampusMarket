// Simple central router map so we can generate URLs by page name.
// This keeps links consistent across the app.

const ROUTES = {
  Home: "/",
  CreateListing: "/sell",
  ListingDetails: "/listing",
  MyListings: "/my-listings",
  Messages: "/messages",
  Conversation: "/conversation",
  Login: "/login",
  Signup: "/signup",
  VerifyEmail: "/verify-email",
};

export function createPageUrl(name) {
  if (!name) return ROUTES.Home;
  return ROUTES[name] || ROUTES.Home;
}




