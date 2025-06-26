import fs from "fs";
import { cwd } from "process";
import { Environments } from "./enums/environments";
import { Errors } from "./enums/errors";
import { AuthData } from "./auth";
import {
  refreshAuthToken,
  generateAuthData,
  generateAuthorizeUrl,
  getAuthorizationToken,
} from "./auth";
import {
  FhirResourceType,
  getFhirResource,
  getFhirResourceByPath,
} from "./resource";
import { AuthorizationToken } from "./entities/AuthorizationToken";
import { AxiosRequestConfig } from "axios";

export {
  AuthorizationTokenData,
  AuthorizationToken,
} from "./entities/AuthorizationToken";
export { AuthData } from "./auth";
export { Environments } from "./enums/environments";
export { Errors };

const DEFAULT_CONFIG_FILE_LOCATION = `${cwd()}/.bluebutton-config.json`;
const LOCAL_BASE_URL = "http://localhost:8000";
const TEST_BASE_URL = "https://test.patient-api.connect.medicaid.ncdhhs.gov";
const SANDBOX_BASE_URL = "https://sandbox.patient-api.connect.medicaid.ncdhhs.gov";
const PRODUCTION_BASE_URL = "https://patient-api.connect.medicaid.ncdhhs.gov";

/**
 * FHIR end point retry configuration
 */
export type RetryConfig = {
  total: number;
  backoffFactor: number;
  statusForcelist: number[];
};

/**
 * Configuration parameters for a Blue Button API application
 */
export type BlueButtonJsonConfig = {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  version?: string;
  environment?: Environments;
  retrySettings?: RetryConfig;
  tokenRefreshOnExpire?: boolean;
};

export type BlueButtonConfig = string | BlueButtonJsonConfig;

/**
 * BlueButton - the main SDK class
 */
export class BlueButton {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  version: string;
  baseUrl: string;
  retrySettings: RetryConfig;
  tokenRefreshOnExpire: boolean;

  constructor(config?: BlueButtonConfig) {
    let bbJsonConfig;
    this.retrySettings = {
      backoffFactor: 5,
      total: 3,
      statusForcelist: [500, 502, 503, 504],
    };
    if (!config) {
      try {
        const rawdata = fs.readFileSync(DEFAULT_CONFIG_FILE_LOCATION);
        const jsonConfig = JSON.parse(rawdata.toString());
        bbJsonConfig = this.normalizeConfig(jsonConfig);
      } catch (e) {
        throw new Error(
          `Failed to load config file at: ${DEFAULT_CONFIG_FILE_LOCATION}, ${e}`
        );
      }
    } else if (typeof config === "string") {
      try {
        const rawdata = fs.readFileSync(config);
        const jsonConfig = JSON.parse(rawdata.toString());
        bbJsonConfig = this.normalizeConfig(jsonConfig);
      } catch (e) {
        throw new Error(`Failed to load config file at: ${config}, ${e}`);
      }
    } else {
      bbJsonConfig = this.normalizeConfig(config);
    }

    if (!bbJsonConfig.clientId) {
      throw new Error("clientId is required");
    }

    if (!bbJsonConfig.clientSecret) {
      throw new Error("clientSecret is required");
    }

    if (!bbJsonConfig.callbackUrl) {
      throw new Error("callbackUrl is required");
    }

    if (
      bbJsonConfig.retrySettings?.backoffFactor ||
      bbJsonConfig.retrySettings?.backoffFactor === 0
    ) {
      if (bbJsonConfig.retrySettings?.backoffFactor <= 0) {
        throw new Error(
          `Invalid retry settings parameter backoffFactor = ${bbJsonConfig.retrySettings?.backoffFactor}: must be > 0`
        );
      }
      this.retrySettings.backoffFactor =
        bbJsonConfig.retrySettings?.backoffFactor;
    }

    if (
      bbJsonConfig.retrySettings?.total ||
      bbJsonConfig.retrySettings?.total === 0
    ) {
      this.retrySettings.total = bbJsonConfig.retrySettings?.total;
    }

    if (bbJsonConfig.retrySettings?.statusForcelist) {
      this.retrySettings.statusForcelist =
        bbJsonConfig.retrySettings?.statusForcelist;
    }

    this.baseUrl = bbJsonConfig.baseUrl;
    this.clientId = bbJsonConfig.clientId;
    this.callbackUrl = bbJsonConfig.callbackUrl;
    this.clientSecret = bbJsonConfig.clientSecret;
    this.version = bbJsonConfig.version;
    this.tokenRefreshOnExpire = bbJsonConfig.tokenRefreshOnExpire;
  }

  normalizeConfig(config: BlueButtonJsonConfig) {
    if (
      config.environment &&
      !Object.values(Environments).includes(config.environment)
    ) {
      throw new Error(
        `Invalid environment (='${config.environment}'): must be ${Environments.PRODUCTION
        } or ${Environments.SANDBOX} or ${`Environments.TEST`} or ${Environments.LOCAL
        }`
      );
    }

    return {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      callbackUrl: config.callbackUrl,
      retrySettings: config.retrySettings,
      version: config.version ? config.version : "2",
      tokenRefreshOnExpire:
        config?.tokenRefreshOnExpire == null
          ? true
          : config.tokenRefreshOnExpire,
      baseUrl:
        config.environment === Environments.PRODUCTION
          ? PRODUCTION_BASE_URL
          : config.environment === Environments.TEST
            ? TEST_BASE_URL
            : config.environment === Environments.LOCAL
              ? LOCAL_BASE_URL
              : SANDBOX_BASE_URL,
    };
  }

  /**
   * Returns the Condition data resources for the authorized beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Bundle of Condition resources
   */
  async getConditionData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.Condition,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the Coverage data resources for the authorized beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Bundle of Coverage resources
   */
  async getCoverageData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.Coverage,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the DiagnosticReport data resources for the authorized beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Bundle of DiagnosticReport resources
   */
  async getDiagnosticReportData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.DiagnosticReport,
      authToken,
      this,
      config
    );
  }

  /**
  * Returns the Encounter data resources for the authorized beneficiary
  * @param authToken - AuthorizationToken with access token info
  * @param config - extra request parameters
  * @returns authToken and Fhir Bundle of Encounter resources
  */
  async getEncounterData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.Encounter,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the ExplanationOfBenefit data resources for the authorized beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Bundle of ExplanationOfBenefit resources
   */
  async getExplanationOfBenefitData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.ExplanationOfBenefit,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the HealthcareService data resources for the authorized beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Bundle of HealthcareService resources
   */
  async getHealthcareServiceData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.HealthcareService,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the InsurancePlan data resources for the authorized beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Bundle of InsurancePlan resources
   */
  async getInsurancePlanData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.InsurancePlan,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the Location data resources for the authorized beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Bundle of Location resources
   */
  async getLocationData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.Location,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the MedicationRequest data resources for the authorized beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Bundle of MedicationRequest resources
   */
  async getMedicationRequestData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.MedicationRequest,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the Observation resources for the current (authorized) beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Bundle of Observation resources
   */
  async getObservationData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.Observation,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the Organization resources for the current (authorized) beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Bundle of Organization resources
   */
  async getOrganizationData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.Organization,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the OrganizationAffiliation resources for the current (authorized) beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Bundle of OrganizationAffiliation resources
   */
  async getOrganizationAffiliationData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.OrganizationAffiliation,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the Patient resource for the current (authorized) beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Patient resources
   */
  async getPatientData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.Patient,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the profile for the current (authorized) beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and profile
   */
  async getProfileData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.Profile,
      authToken,
      this,
      config
    );
  }

  /**
   * Returns the Practitioner resources for the current (authorized) beneficiary
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and Fhir Bundle of Practitioner resources
   */
  async getPractitionerData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.Practitioner,
      authToken,
      this,
      config
    );
  }

  /**
 * Returns the PractitionerRole resources for the current (authorized) beneficiary
 * @param authToken - AuthorizationToken with access token info
 * @param config - extra request parameters
 * @returns authToken and Fhir Bundle of PractitionerRole resources
 */
  async getPractitionerRole(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.PractitionerRole,
      authToken,
      this,
      config
    );
  }

  /**
 * Returns the Procedure resources for the current (authorized) beneficiary
 * @param authToken - AuthorizationToken with access token info
 * @param config - extra request parameters
 * @returns authToken and Fhir Bundle of Procedure resources
 */
  async getProcedureData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.Procedure,
      authToken,
      this,
      config
    );
  }

  /**
* Returns the ServiceRequest resources for the current (authorized) beneficiary
* @param authToken - AuthorizationToken with access token info
* @param config - extra request parameters
* @returns authToken and Fhir Bundle of ServiceRequest resources
*/
  async getServiceRequestData(
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResource(
      FhirResourceType.ServiceRequest,
      authToken,
      this,
      config
    );
  }


  /**
   * Returns the resource(s) for the current (authorized) beneficiary as identified by the url path
   * @param path - url path for the resurce(s)
   * @param authToken - AuthorizationToken with access token info
   * @param config - extra request parameters
   * @returns authToken and the resource(s)
   */
  async getCustomData(
    path: string,
    authToken: AuthorizationToken,
    config: AxiosRequestConfig = {}
  ) {
    return await getFhirResourceByPath(path, authToken, this, config);
  }

  /**
   * Extract 'next' page url from a FHIR search result (Bundle with nav links)
   * overload for convenience ('next' nav link is more frequently used to fetch all pages)
   * @param data - data in json, expect to be a FHIR Bundle of type 'searchset' with page nav links
   * @returns the url or null if expected structure not present
   */
  extractNextPageUrl(data: any) {
    return this.extractPageNavUrl(data, "next");
  }

  /**
   * Extract the specified nav link page url from a FHIR search result (Bundle with nav links)
   * @param data - data in json, expect to be a FHIR Bundle of type 'searchset' with page nav links
   * @param relation - the nav relation to current page: 'first', 'previous', 'next', 'self', 'last'
   * @returns the url or null if expected structure not present
   */
  extractPageNavUrl(data: any, relation: string) {
    if (
      data &&
      data.resourceType === "Bundle" &&
      data.type &&
      data.type === "searchset" &&
      data.link
    ) {
      for (const l of data.link) {
        if (l.relation === relation) {
          return l.url;
        }
      }
    }
    return null;
  }

  /**
   * Given a navigatable FHIR search result (Bundle with nav links), navigate forward until max pages reached
   * or when there is no next page whichever comes first, and return all the pages as a list.
   * @param data - current page of a FHIR search result (Bundle) with nav links
   * @param authToken - AuthorizationToken with access token info
   * @returns authToken (might be updated during fhir data call) and the page(s) as a list
   */
  async getPages(data: any, authToken: AuthorizationToken) {
    let bundle = data;
    let at = authToken;
    const pages = [bundle];
    let pageURL = this.extractNextPageUrl(bundle);
    while (pageURL) {
      const eobNextPage = await this.getCustomData(pageURL, authToken);
      at = eobNextPage.token;
      bundle = eobNextPage.response?.data;
      pages.push(bundle);
      pageURL = this.extractNextPageUrl(bundle);
    }
    return { token: at, pages: pages };
  }

  /**
   * Generate hashes for PKCE
   * @returns AuthData object
   */
  generateAuthData(): AuthData {
    return generateAuthData();
  }

  /**
   * Generate URL for beneficiary login (Medicare.gov)
   * @param authData - PKCE data used in the URL
   * @param patientScope - Optional patient scope to add to request
   * @returns the URL direct to beneficiary login
   */
  async generateAuthorizeUrl(authData: AuthData, patientScope: string): Promise<string> {
    return await generateAuthorizeUrl(this, authData, patientScope);
  }

  /**
   * Given an instance of AuthorizationToken (containing access token and refresh token),
   * refresh the access token and also will obtain a new refresh token.
   * @param authToken - AuthorizationToken instance with access token info
   * @returns new AuthorizationToken instance with newly issued (refreshed) access token (and refresh token)
   */
  async refreshAuthToken(authToken: AuthorizationToken) {
    return refreshAuthToken(authToken, this);
  }

  /**
   * Callback of OAUTH2 flow, App's oauth2 callback is routed to this function,
   * the returned AuthorizationToken object is used by subsequent Fhir resource(s)
   * queries
   * @param authData - PKCE data
   * @param callbackRequestCode - Auhtorization Code
   * @param callbackRequestState - the state
   * @param callbackRequestError - the error if any
   * @returns AuthorizationToken object containing access token, refresh token, etc.
   */
  async getAuthorizationToken(
    authData: AuthData,
    callbackRequestCode?: string,
    callbackRequestState?: string,
    callbackRequestError?: string
  ) {
    return getAuthorizationToken(
      this,
      authData,
      callbackRequestCode,
      callbackRequestState,
      callbackRequestError
    );
  }
}
