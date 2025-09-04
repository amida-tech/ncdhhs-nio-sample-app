import avatar from '../images/patient.png'
import React, { useEffect, useState } from 'react';
import * as process from 'process';
import { Button } from '@cmsgov/design-system';
import axios from 'axios';

export type Authorization = {
    firstName: string,
    lastName: string,
    fhirUser: string
}

export type Profile = {
    userNCID: string,
    sub: string,
    displayName: string,
    name: string,
    fhirUser: string,
    updated_at: string,
    user_authorizations?: Array<Authorization>
}

export default function Patient() {

    const defaultProfile = {
        userNCID: "",
        sub: "",
        displayName: "",
        name: "",
        fhirUser: "",
        updated_at: ""
    }

    const [userProfile, setUserProfile] = useState<Profile>(defaultProfile);
    const test_url = process.env.TEST_APP_API_URL ? process.env.TEST_APP_API_URL : ''

    /**
     * 
     * Requests data for a beneficiary
     * 
     */
    async function goAuthorize() {

        await axios.get(`${test_url}/api/authorize/authurl`)
            .then(response => {
                return response.data;
            })
            .then(data => {
                window.location.href = data;
            })
            .catch(error => {
                window.location.href = "/";
            });
    }

    /**
     * Requests data for an authorized representative
     * 
     */
    async function loadBeneficiaryData(beneficiaryId: String) {

        const payload = {
            beneficiaryId: beneficiaryId
        }

        await axios({
            method: 'post',
            url: `${test_url}/api/authorize/beneficiary`,
            data: payload,
            headers: {
                "Content-Type": 'application/json'
            }
        })
            .then(response => {
                return response.data;
            })
            .then(data => {
                window.location.href = data;
            })
            .catch(error => {
                console.error(error);
            });

    }

    useEffect(() => {
        const test_url = process.env.TEST_APP_API_URL ? process.env.TEST_APP_API_URL : '';

        // get profile Data
        fetch(`${test_url}/api/data/profile`)
            .then(res => {
                return res.json();
            }).then(profileData => {
                profileData.displayName = `${profileData.given_name} ${profileData.family_name}`
                profileData.userNCID = profileData.sub?.split("|")[2];
                setUserProfile(profileData);
            });
    }, [])




    /* DEVELOPER NOTES:
    * Here we are hard coding the users information for the sake of saving time
    * you would display user information that you have stored in whatever persistence layer/mechanism 
    * your application is using
    */
    return (
        <div className="ds-u-display-flex">
            <h1><b>User Information</b></h1>
            <div className="ds-u-display--flex ds-u-justify-content--between">
                <div className="ds-l-col--6">
                    <div className='ds-u-display--flex ds-u-flex-direction--row ds-u-align-items--start'>
                        <img src={avatar} alt="Profile avatar" width="200"/>
                        <div>
                            <ul>
                                <li><b>Name:</b> {userProfile?.displayName}</li>
                                <li><b>Email:</b> {userProfile?.name}</li>
                            </ul>
                        </div>
                    </div>

                    <div className='ds-u-margin--2 ds-l-col--8'>
                        <Button id="auth_btn" variation="solid" className="ds-u-margin--2 ds-l-col--8" onClick={goAuthorize}>Authorize</Button>
                    </div>
                </div>
                <div className="ds-l-col--6 bb-c-card ds-u-padding-bottom--2 ds-u-margin-bottom--2">
                    <h2><b>Medicaid Connect Profile</b></h2>
                    <ul>
                        <li><b>NCID:</b> {userProfile?.userNCID}</li>
                        <li><b>Last Updated:</b> {userProfile?.updated_at}</li>
                        <li><b>Subscriber ID:</b> {userProfile?.fhirUser}</li>
                        <li><b>Authorized Representative for:</b>
                            {(userProfile?.user_authorizations === undefined || userProfile?.user_authorizations?.length === 0) && 
                             <ul>
                                <li>None Found</li>
                             </ul>
                        
                            }
                            {userProfile?.user_authorizations?.map(authorization => {
                                return (
                                    <ul>
                                        <li key={authorization.firstName}>
                                            {authorization.firstName} {authorization.lastName}
                                            <ul>
                                                <li>{authorization.fhirUser}</li>
                                                <Button variation="solid" onClick={() => loadBeneficiaryData(authorization.fhirUser)} className="ds-l-col--8" >View Records</Button>
                                            </ul>
                                        </li>
                                    </ul>
                                )
                            })}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
