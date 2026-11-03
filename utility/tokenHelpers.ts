// @ts-nocheck
import createUserAgent from "./userAgent";
import { handleServerError } from "./serverHelpers";

// Stored as the access token when the user signed in on the iNaturalist website in a
// WebView instead of through Seek's OAuth app; the API token then comes from the web
// session's cookies, which React Native's fetch shares with the WebView.
const WEB_SESSION_LOGIN = "web-session";

const fetchJSONWebTokenFromWebSession = async ( site: string ): Promise<string | undefined> => {
  const r = await fetch( `${site}/users/api_token`, {
    headers: {
      Accept: "application/json",
      "User-Agent": createUserAgent(),
    },
    credentials: "include",
  } );
  // a signed-out session is redirected to the login page instead
  if ( !r.ok || !( r.headers.get( "content-type" ) || "" ).includes( "json" ) ) {
    return undefined;
  }
  const parsedResponse = await r.json();
  return parsedResponse.api_token;
};

const fetchJSONWebToken = async ( loginToken: string ): Promise<string | {
  error: {
    type: string;
    errorText?: string;
    numOfHours?: number;
  };
}> => {
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": createUserAgent(),
    Authorization: `Bearer ${loginToken}`,
  };

  const site = "https://www.inaturalist.org";

  try {
    if ( loginToken === WEB_SESSION_LOGIN ) {
      return await fetchJSONWebTokenFromWebSession( site );
    }
    const r = await fetch( `${site}/users/api_token`, { headers } );
    const parsedResponse = await r.json();
    return parsedResponse.api_token;
  } catch ( e: any ) {
    if ( e.response && e.response.status && e.response.status === 503 ) {
      // not 100% sure if this is working
      return {
        error: {
          type: "downtime",
          errorText: e.message,
          numOfHours: handleServerError( e ),
        },
      };
    }
    if ( e.message === "timeout" ) {
      return {
        error: {
          type: "timeout",
        },
      };
    }
    return {
      error: {
        type: "login",
        errorText: e.message,
      },
    };
  }
};

export { fetchJSONWebToken, WEB_SESSION_LOGIN };
