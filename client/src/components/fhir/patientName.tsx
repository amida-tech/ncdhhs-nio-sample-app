import { Table, TableBody, TableCaption, TableRow, TableCell, TableHead } from '@cmsgov/design-system';
import React, { useEffect, useState } from 'react';
import * as process from 'process';
import { Patient } from 'fhir/r4';

export type FHIRRecord = {
    fullUrl: string,
    resource: Patient,
}

export type ErrorResponse = {
    type: string,
    content: string,
}

export default function FHIRPatient() {
    const [bundleRecords, setBundleRecords] = useState<FHIRRecord[]>([]);
    const [message, setMessage] = useState<ErrorResponse>();

    useEffect(() => {
        const test_url = process.env.TEST_APP_API_URL ? process.env.TEST_APP_API_URL : '';

        // get patient data
        fetch(`${test_url}/api/data/patient`)
            .then(res => {
                return res.json();
            }).then(fhirData => {
                if (fhirData.resourceType === "Bundle") {
                    const records: FHIRRecord[] = fhirData.entry.map((resourceData: any) => {
                        return {
                            fullUrl: resourceData.fullUrl,
                            resource: resourceData.resource
                        }
                    });
                    setBundleRecords(records);
                }
                else {
                    if (fhirData.resourceType === "OperationOutcome") {
                        setMessage({ "type": fhirData.issue[0].details.coding[0].code, "content": fhirData.issue[0].details.coding[0].system || "Unknown" })
                    }
                }
            });
    }, [])

    if (message) {
        return (
            <div className='full-width-card'>
                <Table className="ds-u-margin-top--2" stackable stackableBreakpoint="md">
                    <TableCaption>Error Response</TableCaption>
                    <TableHead>
                        <TableRow>
                            <TableCell id="column_1">Error Code</TableCell>
                            <TableCell id="column_2">Code System</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell stackedTitle="Error Code" headers="column_1">
                                {message.type}
                            </TableCell>
                            <TableCell stackedTitle="Code System" headers="column_2">
                                {message.content}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    } else {
        if (bundleRecords.length > 0) {
            return (
            <h2> 
                { bundleRecords[0].resource.name?.[0].given}'s Records:
            </h2>
            )

        }
        
    };
}