import { Table, TableBody, TableCaption, TableRow, TableCell, TableHead, Tabs, TabPanel } from '@cmsgov/design-system';
import React, { useEffect, useState } from 'react';
import * as process from 'process';
import ReactJson from 'react-json-view';
import { Coverage } from 'fhir/r4';

export type FHIRRecord = {
    fullUrl: string,
    resource: Coverage,
}

export type ErrorResponse = {
    type: string,
    content: string,
}

export default function FHIRCoverage() {
    const [bundleRecords, setBundleRecords] = useState<FHIRRecord[]>([]);
    const [message, setMessage] = useState<ErrorResponse>();
    const [bundleCount, setBundleCount] = useState(0)

    useEffect(() => {
        const test_url = process.env.TEST_APP_API_URL ? process.env.TEST_APP_API_URL : '';

        fetch(`${test_url}/api/data/coverage`)
            .then(res => {
                return res.json();
            }).then(fhirData => {
                if (fhirData.resourceType === "Bundle") {
                    setBundleCount(fhirData.total);
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
        return (
            <div className="ds-u-display--flex ds-u-flex-direction--column ds-u-lg-flex-direction--row ds-u-flex-wrap--nowrap ds-u-lg-flex-wrap--wrap">
                <div className="ds-l-col--12"><h3>Total Records: {bundleCount}{bundleCount > 10 && ', displaying first 10'}</h3></div>
                {bundleRecords.map(record => {
                    return (
                        <div className="default-card ds-u-margin--2">
                            <Tabs>
                                <TabPanel key="display" id="display" tab="Display">
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell
                                                    key="Description"
                                                    id="description"
                                                >
                                                    Description
                                                </TableCell>
                                                <TableCell
                                                    key="Value"
                                                    id="value"
                                                >
                                                    Value
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableRow>
                                            <TableCell>
                                                Status:
                                            </TableCell>
                                            <TableCell>
                                                {record.resource.status}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>
                                                Beneficiary Name:
                                            </TableCell>
                                            <TableCell>
                                                {record.resource.beneficiary.display}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>
                                                Effective Dates:
                                            </TableCell>
                                            <TableCell>
                                                {record.resource.period?.start} - {record.resource.period?.end}
                                            </TableCell>
                                        </TableRow>
                                    </Table>
                                </TabPanel>
                                <TabPanel key="source" id="source" tab="Source">
                                    <div style={{ minHeight: '230px' }}>
                                        <ReactJson src={record} collapsed={true} />
                                    </div>
                                </TabPanel>
                            </Tabs>
                        </div>
                    )
                })}
            </div>
        )
    };
}