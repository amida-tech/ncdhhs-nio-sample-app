import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import FHIRVisionPrescription from './visionPrescription';

const visionPrescriptionBundle = {
    resourceType: 'Bundle',
    total: 1,
    entry: [
        {
            fullUrl: 'https://example.org/fhir/VisionPrescription/33123',
            resource: {
                resourceType: 'VisionPrescription',
                id: '33123',
                status: 'active',
                created: '2014-06-15',
                dateWritten: '2014-06-15',
                patient: { reference: 'Patient/example' },
                prescriber: { reference: 'Practitioner/example', display: 'Dr. Jane Optometrist' },
                lensSpecification: [
                    {
                        product: {
                            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/ex-visionprescriptionproduct', code: 'lens' }],
                        },
                        eye: 'right',
                        sphere: -2.0,
                        cylinder: -0.5,
                        axis: 180,
                        add: 2.0,
                    },
                    {
                        product: { text: 'Contact lens' },
                        eye: 'left',
                        sphere: -1.0,
                    },
                ],
            },
        },
    ],
};

function mockFetch(body: unknown) {
    const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve(body) });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

describe('FHIRVisionPrescription', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('fetches from the visionPrescription endpoint and renders prescription details', async () => {
        const fetchMock = mockFetch(visionPrescriptionBundle);
        render(<FHIRVisionPrescription />);

        expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/data\/visionPrescription$/));
        expect(await screen.findByText('Total Records: 1')).toBeInTheDocument();
        expect(screen.getByText('2014-06-15')).toBeInTheDocument();
        expect(screen.getByText('Dr. Jane Optometrist')).toBeInTheDocument();
        expect(screen.getByText('active')).toBeInTheDocument();
    });

    test('renders one row per lens specification with formatted values', async () => {
        mockFetch(visionPrescriptionBundle);
        render(<FHIRVisionPrescription />);

        // product from coding code, all values present
        expect(await screen.findByText('lens (right):')).toBeInTheDocument();
        expect(screen.getByText('SPH -2, CYL -0.5, AXIS 180, ADD 2')).toBeInTheDocument();
        // product from text, only sphere present
        expect(screen.getByText('Contact lens (left):')).toBeInTheDocument();
        expect(screen.getByText('SPH -1')).toBeInTheDocument();
    });

    test('renders an OperationOutcome as an error table', async () => {
        mockFetch({
            resourceType: 'OperationOutcome',
            issue: [{ details: { coding: [{ code: 'not-supported', system: 'http://example.org/errors' }] } }],
        });
        render(<FHIRVisionPrescription />);

        expect(await screen.findByText('Error Response')).toBeInTheDocument();
        expect(screen.getByText('not-supported')).toBeInTheDocument();
        expect(screen.getByText('http://example.org/errors')).toBeInTheDocument();
    });
});
