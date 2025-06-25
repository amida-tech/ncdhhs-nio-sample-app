import avatar from '../images/maria.png'
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
    user_ncid: string,
    name: string,
    fhirUser: string,
    user_authorizations?: Array<Authorization>
}

export default function Patient() {

    const [userProfile, setUserProfile] = useState<Profile>();
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
            <h1>User Information</h1>
            <div className="ds-u-display--flex ds-u-justify-content--between">
                <div className="ds-l-col--5">
                    <div className='ds-u-display--flex ds-u-flex-direction--row ds-u-align-items--start'>
                        <img src={avatar} alt="Profile avatar" width="200"/>
                        <div>
                            <ul>
                                <li>Maria Velazquez</li>
                                <li>Born 12/12/1985</li>
                                <li>Sanford, NC</li>
                            </ul>
                        </div>
                    </div>

                    <div className='ds-u-margin--2 ds-l-col--8'>
                        <Button id="auth_btn" variation="solid" className="ds-u-margin--2 ds-l-col--8" onClick={goAuthorize}>Authorize</Button>
                    </div>
                </div>
                <div className="ds-l-col--6 bb-c-card ds-u-padding-bottom--2 ds-u-margin-bottom--2">
                    <h2>NC Account Profile</h2>
                    <ul>
                        <li>Name: {userProfile?.name}</li>
                        <li>Subscriber ID: {userProfile?.fhirUser}</li>
                        <li>Authorized Representative for:
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
