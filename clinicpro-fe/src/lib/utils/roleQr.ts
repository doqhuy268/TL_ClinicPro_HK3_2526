import { Admin, Cashier, Doctor, Patient, Receptionist } from '@/lib/types/user';

export type RoleCodeDescriptor = {
  label: string;
  value: string;
};

export interface RoleQrSource {
  id?: string;
  patient?: Patient | null;
  doctor?: Doctor | null;
  admin?: Admin | null;
  receptionist?: Receptionist | null;
  cashier?: Cashier | null;
}

export const buildRoleQrInfo = (data?: RoleQrSource | null) => {
  const descriptors: RoleCodeDescriptor[] = [];
  const segments: string[] = [];
  const seen = new Set<string>();

  const push = (label: string, value?: string | null, prefix?: string) => {
    const normalized = value?.trim();
    if (!normalized) return;
    const key = `${label}:${normalized}`;
    if (!seen.has(key)) {
      seen.add(key);
      descriptors.push({ label, value: normalized });
    }
    segments.push(`${prefix ?? label.toUpperCase()}:${normalized}`);
  };

  if (!data) {
    return { payload: '', descriptors };
  }

  if (data.patient?.patientCode) {
    push('Mã bệnh nhân', data.patient.patientCode, 'PAT');
  }

  const patientProfiles = data.patient?.patientProfiles ?? [];
  patientProfiles.forEach((profile) => {
    if (profile?.profileCode) {
      push('Mã hồ sơ', profile.profileCode, 'PRO');
    }
  });

  if (data.doctor?.doctorCode) {
    push('Mã bác sĩ', data.doctor.doctorCode, 'DOC');
  }

  if (data.receptionist?.receptionistCode) {
    push('Mã lễ tân', data.receptionist.receptionistCode, 'REC');
  }

  if (data.cashier?.cashierCode) {
    push('Mã thu ngân', data.cashier.cashierCode, 'CAS');
  }

  if (data.admin?.adminCode) {
    push('Mã quản trị', data.admin.adminCode, 'ADM');
  }

  if (!segments.length && data.id) {
    push('User ID', data.id, 'USR');
  }

  return {
    payload: segments.join('|'),
    descriptors,
  };
};

