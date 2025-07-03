/**
 * auth.ts - Provides auth related methods for the Bluebutton class
 */
import axios from "axios";
import crypto from "crypto";
import qs from "qs";

import { BlueButton } from "./index";
import { AuthorizationToken } from "./entities/AuthorizationToken";
import { SDK_HEADERS } from "./enums/environments";
import { Errors } from "./enums/errors";
import { URLSearchParams } from "url";

type PkceData = {
  codeChallenge: string;
  verifier: string;
};

function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function sha256(str: string): Buffer {
  return crypto.createHash("sha256").update(str).digest();
}

function generatePkceData(): PkceData {
  const verifier = base64URLEncode(crypto.randomBytes(32));
  return {
    codeChallenge: base64URLEncode(sha256(verifier)),
    verifier: verifier,
  };
}

function generateRandomState(): string {
  return base64URLEncode(crypto.randomBytes(32));
}

/**
 * Complex type holding PKCE verifier, code challenge, and state
 */
export type AuthData = {
  codeChallenge: string;
  verifier: string;
  state: string;
};

export type TokenPostData = {
  client_id: string;
  code?: string;
  grant_type: string;
  redirect_uri: string;
  code_verifier: string;
};

export function generateAuthData(): AuthData {
  const PkceData = generatePkceData();
  return {
    codeChallenge: PkceData.codeChallenge,
    verifier: PkceData.verifier,
    state: generateRandomState(),
  };
}

async function getAuthorizationUrl(bb: BlueButton): Promise<string> {
  const resp = await axios.get(`${bb.baseUrl}/fhir/.well-known/smart-configuration`)
  return resp.data.authorization_endpoint;
}

export async function generateAuthorizeUrl(
  bb: BlueButton,
  AuthData: AuthData,
  patientScope: string
): Promise<string> {

  const pkceParams = `code_challenge_method=S256&code_challenge=${AuthData.codeChallenge}`;
bb.baseUrl
  const audParam = qs.stringify( {'aud': `https://${bb.baseUrl}/fhir`});

  let scopesArray = [
    "openid", 
    "launch/patient", 
    "fhirUser", 
    "offline_access",
    "profile",
    "patient/Condition.read",
    "patient/Coverage.read", 
    "patient/DiagnosticReport.read",
    "patient/DiagnosticOrder.read",
    "patient/Encounter.read",
    "patient/ExplanationOfBenefit.read", 
    "patient/InsurancePlan.read", 
    "patient/Location.read", 
    "patient/MedicationRequest.read",
    "patient/Observation.read",
    "patient/Organization.read",
    "patient/OrganizationAffiliation.read",
    "patient/Patient.read",
    "patient/Practitioner.read",
    "patient/PractitionerRole.read",
    "patient/Procedure.read"
  ]

  // optionally add in patient scope to request for authorized representatives.
  if (patientScope.length > 0) {
    scopesArray.push(patientScope)
  }

  const scopesString = scopesArray.toString().replace(/,/g, " ");

  const scopeParam = qs.stringify( {'scope': scopesString})

  const authURL = await getAuthorizationUrl(bb);

  const fullRequest = `${authURL}?client_id=${bb.clientId}&redirect_uri=${bb.callbackUrl
    }&state=${AuthData.state}&${audParam}&${scopeParam}&response_type=code&${pkceParams}`;

  return fullRequest
}

//  Generates post data for call to access token URL
export function generateTokenPostData(
  bb: BlueButton,
  authData: AuthData,
  callbackCode?: string
): TokenPostData {
  return {
    client_id: bb.clientId,
    code: callbackCode,
    grant_type: "authorization_code",
    redirect_uri: bb.callbackUrl,
    code_verifier: authData.verifier,
  };
}

function validateCallbackRequestQueryParams(
  authData: AuthData,
  callbackCode?: string,
  callbackState?: string,
  callbackError?: string
) {
  // Check state from callback here?
  if (callbackError === "access_denied") {
    throw new Error(Errors.CALLBACK_ACCESS_DENIED);
  }

  if (!callbackCode) {
    throw new Error(Errors.CALLBACK_ACCESS_CODE_MISSING);
  }

  if (!callbackState) {
    throw new Error(Errors.CALLBACK_STATE_MISSING);
  }

  if (callbackState != authData.state) {
    throw new Error(Errors.CALLBACK_STATE_DOES_NOT_MATCH);
  }
}

export async function getAccessTokenUrl(bb: BlueButton): Promise<string> {
  const resp = await axios.get(`${bb.baseUrl}/fhir/.well-known/smart-configuration`)
  return resp.data.token_endpoint;
}

// Get an access token from callback code & state
export async function getAuthorizationToken(
  bb: BlueButton,
  authData: AuthData,
  callbackRequestCode?: string,
  callbackRequestState?: string,
  callbackRequestError?: string
) {
  validateCallbackRequestQueryParams(
    authData,
    callbackRequestCode,
    callbackRequestState,
    callbackRequestError
  );

  const authHeader = Buffer.from(`${bb.clientId}:${bb.clientSecret}`).toString('base64');
  const authorizationHeaders = {
    Authorization: `Basic ${authHeader}`
  }

  const postData = generateTokenPostData(bb, authData, callbackRequestCode);


    const resp = await doPost(await getAccessTokenUrl(bb), postData, {
      headers: authorizationHeaders,
    });


  if (resp.data) {
    const authToken = new AuthorizationToken(resp.data);
    return authToken;
  } else {
    throw Error(Errors.AUTH_TOKEN_URL_RESPONSE_DATA_MISSING);
  }
}

/**
 * Refresh the access token in the given AuthorizationToken instance
 *
 * @param authToken auth token instance to be refreshed
 * @param bb - instance of the SDK facade class
 * @returns new auth token instance with refreshed access token
 */
export async function refreshAuthToken(
  authToken: AuthorizationToken,
  bb: BlueButton
) {
  const postData = {
    grant_type: "refresh_token",
    client_id: bb.clientId,
    refresh_token: authToken.refreshToken,
  };

  const resp = await doPost(await getAccessTokenUrl(bb), postData, {
    headers: SDK_HEADERS,
    auth: {
      username: bb.clientId,
      password: bb.clientSecret,
    },
  });

  return new AuthorizationToken(resp.data);
}

/**
 *
 * @param url helper
 * @param postData - data to be posted
 * @param config - axios config
 * @returns the response
 */
async function doPost(url: string, postData: any, config: any) {

  /**
  try {
    await axios.post(url, new URLSearchParams(postData), config);
  } catch (err) {
    console.log(err);
  }
  */


  return await axios.post(url, new URLSearchParams(postData), config);
}