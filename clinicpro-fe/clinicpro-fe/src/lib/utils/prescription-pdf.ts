// Utility function to generate PDF for prescription with QR code

interface PrescriptionForPDF {
  prescriptionCode: string;
  status: string;
  createdAt?: string;
  note?: string | null;
  patientProfile?: {
    name?: string;
    profileCode?: string;
    phone?: string;
    address?: string;
  } | null;
  doctor?: {
    name?: string;
    position?: string;
  } | null;
  services?: Array<{
    order: number;
    note?: string | null;
    service?: {
      serviceCode?: string;
      name?: string;
    } | null;
  }> | null;
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'Chờ thực hiện';
    case 'WAITING':
      return 'Đang chờ phục vụ';
    case 'SERVING':
      return 'Đang thực hiện';
    case 'WAITING_RESULT':
      return 'Chờ kết quả';
    case 'COMPLETED':
      return 'Hoàn thành';
    case 'DELAYED':
      return 'Trì hoãn';
    case 'CANCELLED':
      return 'Đã hủy';
    case 'NOT_STARTED':
      return 'Chưa bắt đầu';
    default:
      return String(status);
  }
};

export const generatePrescriptionPDF = async (prescription: PrescriptionForPDF): Promise<void> => {
  try {
    const { default: pdfMake } = await import('pdfmake/build/pdfmake');
    const { default: pdfFonts } = await import('pdfmake/build/vfs_fonts');
    pdfMake.vfs = pdfFonts.vfs;

    const doctorName = prescription.doctor?.name || 'Bác sĩ phụ trách';
    const doctorPosition = prescription.doctor?.position || 'Bác sĩ';
    const createdAt = prescription.createdAt 
      ? new Date(prescription.createdAt).toLocaleString('vi-VN')
      : new Date().toLocaleString('vi-VN');

    const docDefinition = {
      pageMargins: [36, 36, 36, 40],
      content: [
        // Header: left info + right QR in one box
        {
          table: {
            widths: ['*', 110],
            body: [[
              {
                stack: [
                  { text: 'PHIẾU CHỈ ĐỊNH DỊCH VỤ', style: 'title' },
                  {
                    columns: [
                      { width: 120, text: 'Mã phiếu:', style: 'label' },
                      { text: prescription.prescriptionCode, style: 'value' }
                    ], margin: [0, 4, 0, 0]
                  },
                  {
                    columns: [
                      { width: 120, text: 'Trạng thái:', style: 'label' },
                      { text: getStatusText(prescription.status), style: 'value' }
                    ]
                  },
                  {
                    columns: [
                      { width: 120, text: 'Ngày tạo:', style: 'label' },
                      { text: createdAt, style: 'value' }
                    ]
                  }
                ]
              },
              { qr: prescription.prescriptionCode, fit: 100, alignment: 'right' }
            ]]
          },
          layout: {
            fillColor: () => '#ffffff',
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb'
          },
          margin: [0, 0, 0, 12]
        },

        // Patient info
        ...(prescription.patientProfile ? [
          { text: 'Thông tin bệnh nhân', style: 'sectionHeader', margin: [0, 6, 0, 6] },
          {
            table: {
              widths: [120, '*', 120, '*'],
              body: [
                [
                  { text: 'Tên', style: 'label' },
                  { text: prescription.patientProfile.name || '—', style: 'value' },
                  { text: 'Mã hồ sơ', style: 'label' },
                  { text: prescription.patientProfile.profileCode || '—', style: 'value' }
                ],
                [
                  { text: 'SĐT', style: 'label' },
                  { text: prescription.patientProfile.phone || '—', style: 'value' },
                  { text: 'Địa chỉ', style: 'label' },
                  { text: prescription.patientProfile.address || '—', style: 'value' }
                ]
              ]
            },
            layout: {
              fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#f9fafb' : null),
              hLineColor: () => '#e5e7eb',
              vLineColor: () => '#e5e7eb'
            },
            margin: [0, 0, 0, 12]
          }
        ] : []),

        // Note
        ...(prescription.note ? [
          { text: 'Ghi chú', style: 'sectionHeader', margin: [0, 6, 0, 4] },
          { text: prescription.note, fontSize: 11, margin: [0, 0, 0, 10] }
        ] : []),

        // Services table
        { text: 'Danh sách dịch vụ', style: 'sectionHeader', margin: [0, 6, 0, 6] },
        {
          table: {
            headerRows: 1,
            widths: [28, 100, '*', 150],
            body: [
              [
                { text: '#', style: 'tableHeader', alignment: 'center' },
                { text: 'Mã dịch vụ', style: 'tableHeader' },
                { text: 'Tên dịch vụ', style: 'tableHeader' },
                { text: 'Ghi chú', style: 'tableHeader' }
              ],
              ...(prescription.services?.map((s) => [
                { text: String(s.order), alignment: 'center', fontSize: 10 },
                { text: s.service?.serviceCode || '—', fontSize: 10 },
                { text: s.service?.name || '—', fontSize: 10 },
                { text: s.note || '—', fontSize: 10 }
              ]) || [])
            ]
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f3f4f6' : null),
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb'
          },
          margin: [0, 0, 0, 14]
        },

        // Footer signature
        {
          columns: [
            { width: '*', text: `In từ hệ thống ClinicPro\nNgày in: ${new Date().toLocaleString('vi-VN')}`, fontSize: 10 },
            {
              width: 'auto',
              stack: [
                { text: 'Chữ ký bác sĩ', bold: true, alignment: 'right', margin: [0, 0, 0, 24] },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.5, lineColor: '#9ca3af' }] },
                { text: `${doctorPosition}: ${doctorName}`, alignment: 'right', margin: [0, 6, 0, 0] }
              ]
            }
          ]
        }
      ],
      styles: {
        title: { fontSize: 16, bold: true, color: '#111827' },
        sectionHeader: { fontSize: 13, bold: true, color: '#111827' },
        tableHeader: { bold: true, fontSize: 11, color: '#111827' },
        label: { fontSize: 11, color: '#374151' },
        value: { fontSize: 11, color: '#111827' }
      },
      defaultStyle: { fontSize: 11, color: '#111827' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const pdfDoc = pdfMake.createPdf(docDefinition);
    pdfDoc.download(`Phieu-chi-dinh-${prescription.prescriptionCode}.pdf`);
  } catch (e) {
    console.error('PDF generate error', e);
    throw new Error('Không thể tạo PDF phiếu chỉ định');
  }
};



