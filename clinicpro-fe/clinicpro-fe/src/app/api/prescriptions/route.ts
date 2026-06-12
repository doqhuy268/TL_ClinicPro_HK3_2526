import { NextRequest, NextResponse } from 'next/server';

interface PrescriptionServiceRequest {
  order: number;
  serviceCode?: string;
  serviceId?: string;
  doctorId?: string;
}

interface PrescriptionRequestBody {
  patientProfileId: string;
  medicalRecordId?: string;
  services: PrescriptionServiceRequest[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientProfileId, medicalRecordId, services } = body;

    // Validate required fields (doctorId removed since it comes from token)
    if (!patientProfileId || !services || !Array.isArray(services)) {
      return NextResponse.json(
        { error: 'Missing required fields: patientProfileId, services' },
        { status: 400 }
      );
    }

    // Validate and clean services format
    const cleanedServices = services.map((s: PrescriptionServiceRequest) => {
      const cleaned: PrescriptionServiceRequest = {
        order: s.order
      };
      
      // Only include non-empty values
      if (s.serviceId && String(s.serviceId).trim().length > 0) {
        cleaned.serviceId = String(s.serviceId).trim();
      }
      
      if (s.serviceCode && String(s.serviceCode).trim().length > 0) {
        cleaned.serviceCode = String(s.serviceCode).trim();
      }
      
      if (s.doctorId && String(s.doctorId).trim().length > 0) {
        cleaned.doctorId = String(s.doctorId).trim();
      }
      
      return cleaned;
    });

    // Validate that each service has at least serviceId or serviceCode
    const invalidServices = cleanedServices.filter((s: PrescriptionServiceRequest) => {
      const hasServiceId = s.serviceId && String(s.serviceId).trim().length > 0;
      const hasServiceCode = s.serviceCode && String(s.serviceCode).trim().length > 0;
      return !hasServiceId && !hasServiceCode;
    });

    if (invalidServices.length > 0) {
      console.error('Invalid services received:', invalidServices);
      console.error('All services:', services);
      return NextResponse.json(
        { error: 'Each service must include serviceId or serviceCode' },
        { status: 400 }
      );
    }

    // Prepare request body - only include defined values
    const requestBody: PrescriptionRequestBody = {
      patientProfileId,
      services: cleanedServices,
    };
    
    if (medicalRecordId && String(medicalRecordId).trim().length > 0) {
      requestBody.medicalRecordId = String(medicalRecordId).trim();
    }

    console.log('Forwarding to backend:', JSON.stringify(requestBody, null, 2));

    // Forward the request to the backend service
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${backendUrl}/prescriptions`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Backend service error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Create prescription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
