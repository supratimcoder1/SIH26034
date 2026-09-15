export type OverallStatus = 'compliant' | 'non_compliant' | 'review_required' | 'insufficient_image_quality' | 'pending' | 'processing' | 'failed';
export type FieldStatus = 'compliant' | 'non_compliant' | 'not_detected';
export type Severity = 'critical' | 'major' | 'minor';
export type ScanType = 'physical' | 'ecommerce';
export type UserRole = 'viewer' | 'enforcement_officer' | 'admin';

export type FieldValue = string | { amount: number; unit?: string; inclusive_of_all_taxes?: boolean } | string[];

export interface ScanField { 
  status: FieldStatus; 
  rule_ref: string; 
  value?: FieldValue; 
  bbox_height_mm?: number; 
  reason?: string; 
}

export interface Scan {
  id: string; 
  product_name: string; 
  manufacturer: string; 
  scan_date: string; 
  scan_type: ScanType; 
  overall_status: OverallStatus;
  review_status?: string; // from backend
  compliance_score?: number;
  is_ecommerce: boolean; 
  is_molded: boolean; 
  usp_context: { required: boolean; reason: string };
  fields: Record<string, ScanField>; 
  violations: { rule_ref: string; severity: Severity; description: string }[];
  not_detected_fields: string[]; 
  preprocessing: { 
    pixels_per_cm: number; 
    pdp_area_cm2: number; 
    calibration_method: string; 
    image_enhancement_applied: boolean; 
    original_resolution: string; 
    enhanced_resolution: string;
  };
  image_url?: string; 
  message?: string;
  __sourceFile?: File; // Optional original file used in frontend only
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isSuspended: boolean;
  createdAt?: string;
}

export interface ScanFilters { 
  search?: string; 
  status?: OverallStatus | 'all'; 
  type?: ScanType | 'all';
}
