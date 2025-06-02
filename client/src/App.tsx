import React from 'react';
import Header from '../src/components/header';
import Patient from '../src/components/patient';
import Records from './components/records';
import { BrowserRouter as Router} from "react-router-dom";
import { TabPanel, Tabs } from '@cmsgov/design-system';

function App() {
  return (
    <div className="ds-l-container ds-u-margin-bottom--7 ds-u-padding-bottom--7">
    <Header />
    <Router>
      <Tabs tablistClassName="ds-u-margin-top--3">
        <TabPanel id="patient" tab="Patient Information">
          <div className="ds-u-display--flex">
            <div className="bb-c-card ds-l-col--12">
              <Patient />
            </div>                   
          </div>
          <Records /> 
  
        </TabPanel>
        
        <TabPanel id="summary" tab="About">
          
          <p className='ds-u-measure--base'>
            This project is derived from the Blue Button 2.0 sample app, which demonstrates how to integrated with the CMS Blue Button APIs.  It has been adapted to instead work with the North Carolina Medicaid Patient Access APIs, in order to demonstrate how beneficiaries would pull data for themselves and authorized representatives using a third-party application. This application lacks sufficient security controls for production operation, and should only be operated against the Sandbox environment.
          </p>

          <p className='ds-u-measure--base'>
            Blue Button 2.0 is a standards-based application programming interface (API) that delivers Medicare Part A, B, and D data for over 60 million Medicare beneficiaries. <a href="https://bluebutton.cms.gov/">Learn more about Blue Button 2.0</a>
          </p>

          <p className='ds-u-measure--base'>
            The CMS design system is a set of open source design and front-end development resources
            for creating Section 508 compliant, responsive, and consistent websites. It builds on the
            U.S. Web Design System and extends it to support additional CSS and React components,
            utility classes, and a grid framework to allow teams to quickly prototype and build
            accessible, responsive, production-ready websites. <a href="https://design.cms.gov/">Learn more about CMS Design System</a>
          </p>
        </TabPanel>
      </Tabs>
    </Router>
    </div>
  );
}

export default App;
