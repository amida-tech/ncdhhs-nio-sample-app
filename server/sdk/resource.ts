import axios, { AxiosError, AxiosRequestConfig } from "axios";
import moment from "moment";
import { BlueButton } from "./index";
import { AuthorizationToken } from "./entities/AuthorizationToken";
import { refreshAuthToken } from "./auth";
import { SDK_HEADERS } from "./enums/environments";

// also serves as central registry for supported resource paths

export enum FhirResourceType {
  Condition = "fhir/Condition",
  Coverage = "fhir/Coverage",
  DiagnosticReport = "fhir/DiagnosticReport",
  Encounter = "fhir/Encounter",
  ExplanationOfBenefit = "fhir/ExplanationOfBenefit",
  HealthcareService = "fhir/HealthcareService",
  InsurancePlan = "fhir/InsurancePlan",
  Location = "fhir/Location",
  MedicationRequest = "fhir/MedicationRequest",
  Observation = "fhir/Observation",
  Organization = "fhir/Organization",
  OrganizationAffiliation = "fhir/OrganizationAffiliation",
  Patient = "fhir/Patient",
  Profile = "connect/userinfo",
  Practitioner = "fhir/Practitioner",
  PractitionerRole = "fhir/PractitionerRole",
  Procedure = "fhir/Procedure",
  ServiceRequest = "fhir/ServiceRequest"
}

export function sleep(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

function isRetryable(error: AxiosError, bb2: BlueButton) {
  return (
    error.response &&
    bb2.retrySettings.total > 0 &&
    bb2.retrySettings.statusForcelist.includes(error.response.status)
  );
}

async function doRetry(
  fhirUrl: string,
  config: AxiosRequestConfig,
  bb2: BlueButton
) {
  let resp;

  for (let i = 0; i < bb2.retrySettings.total; i++) {
    const waitInSec = bb2.retrySettings.backoffFactor * 2 ** (i - 1);
    await sleep(waitInSec * 1000);
    try {
      resp = await axios.get(fhirUrl, config);
      break;
    } catch (error: unknown | AxiosError) {
      if (axios.isAxiosError(error)) {
        resp = error.response;
        if (!isRetryable(error, bb2)) {
          // break out if error is not retryable
          break;
        }
      } else {
        throw error;
      }
    }
  }

  return resp;
}

export async function getFhirResourceByPath(
  resourcePath: string,
  authToken: AuthorizationToken,
  bb2: BlueButton,
  axiosConfig: AxiosRequestConfig
) {
  let newAuthToken = authToken;

  // now the on demand token refresh can be disabled
  if (bb2.tokenRefreshOnExpire) {
    // rare edge case: access token in authToken become expired right after below check
    // and before subsequent fhir end point call, in that case, a correctional action
    // by the app logic might be a recommended practice.
    if (moment(authToken.expiresAt).isBefore(moment())) {
      newAuthToken = await refreshAuthToken(authToken, bb2);
    }
  }

  const fhirUrl = resourcePath.startsWith(bb2.baseUrl)
    ? resourcePath
    : `${String(bb2.baseUrl)}/${resourcePath}`;

  let resp = null;

  const config = {
    ...axiosConfig,
    headers: {
      ...axiosConfig.headers,
      Authorization: `Bearer ${newAuthToken.accessToken}`,
      ...SDK_HEADERS,
    },
  };

  try {
    resp = await axios.get(fhirUrl, config);
  } catch (error: unknown | AxiosError) {
    if (axios.isAxiosError(error)) {
      if (isRetryable(error, bb2)) {
        resp = await doRetry(fhirUrl, config, bb2);
      } else {
        // a response attribute expected on an AxiosError
        resp = error.response;
      }
    } else {
      // other errors - likely axios internal exception etc.
      throw error;
    }
  }
  return {
    token: newAuthToken,
    response: resp,
  };
}

export async function getFhirResource(
  resourceType: FhirResourceType,
  authToken: AuthorizationToken,
  bb2: BlueButton,
  axiosConfig: AxiosRequestConfig
) {
  return await getFhirResourceByPath(
    `${resourceType}`,
    authToken,
    bb2,
    axiosConfig
  );
}
