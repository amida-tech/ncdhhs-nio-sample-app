import { Tabs, TabPanel } from '@cmsgov/design-system';
import FHIRPatient from './fhir/patient';
import FHIRCoverage from './fhir/coverage';
import FHIRCondition from './fhir/condition';
import FHIREncounter from './fhir/encounter';
import FHIRDiagnosticReport from './fhir/diagnosticReport';
import FHIRExplanationOfBenefit from './fhir/explanationOfBenefit';
import FHIRInsurancePlan from './fhir/insurancePlan';
import FHIRLocation from './fhir/location';
import FHIRMedicationRequest from './fhir/medicationRequest';
import FHIRObservation from './fhir/observation';
import FHIROrganization from './fhir/organization';
import FHIROrganizationAffiliation from './fhir/organizationAffiliation';
import FHIRPractitioner from './fhir/practitioner';
import FHIRPractitionerRole from './fhir/practitionerRole';
import FHIRProcedure from './fhir/procedure';
import FHIRServiceRequest from './fhir/serviceRequest';
import FHIRPatientName from './fhir/patientName';

export default function Records() { 
       
        return (
            <div className='ds-content'>
                <div className='ds-u-margin-top--3'>
                  <FHIRPatientName />
                </div>
                <Tabs tablistClassName="ds-u-margin-top--3">
                    <TabPanel id="patient" tab="Patient Records">
                      <div>
                        <h2>Patients</h2>
                        <FHIRPatient />               
                      </div>
                </TabPanel>
                <TabPanel id="clinical" tab="Clinical Records">
                      <div>
                        <h2>Conditions</h2>
                        <FHIRCondition />        
                        <h2>Diagnostic Reports</h2>
                        <FHIRDiagnosticReport />
                        <h2>Encounters</h2>
                        <FHIREncounter />  
                        <h2>Medication Requests</h2>
                        <FHIRMedicationRequest />
                        <h2>Observations</h2>
                        <FHIRObservation />
                        <h2>Procedures</h2>
                        <FHIRProcedure />
                        <h2>Service Requests</h2>
                        <FHIRServiceRequest />
                      </div>
                </TabPanel>
                <TabPanel id="administrative" tab="Administrative Records">
                      <div>
                        <h2>Explanations Of Benefits</h2>     
                        <FHIRExplanationOfBenefit /> 
                        <h2>Coverages</h2>     
                        <FHIRCoverage /> 
                      </div>
                </TabPanel>
                <TabPanel id="supporting" tab="Supporting Records">
                    <div>
                        <h2>Insurance Plans</h2>
                        <FHIRInsurancePlan />
                        <h2>Locations</h2>
                        <FHIRLocation />
                        <h2>Organizations</h2>
                        <FHIROrganization />
                        <h2>Organization Affiliations</h2>
                        <FHIROrganizationAffiliation />
                        <h2>Practitioners</h2>
                        <FHIRPractitioner />
                        <h2>Practitioner Roles</h2>
                        <FHIRPractitionerRole />
                    </div>
                </TabPanel>
            </Tabs>
            </div>
        );
    }

