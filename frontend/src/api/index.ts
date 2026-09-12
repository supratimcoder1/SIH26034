import { Scan, ScanFilters, User } from '../types';
import { saveFile } from '../fileStore';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export async function fetchScanImageBlob(scanId: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/scans/${scanId}/image`, {
    headers: getAuthHeaders(false)
  });
  if (!res.ok) throw new Error('Image not found');
  return res.blob();
}

function getAuthHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem("metroguard_jwt");
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 && !input.toString().includes('/auth/login')) {
    localStorage.removeItem("metroguard_jwt");
    localStorage.removeItem("metroguard_user");
    window.location.href = '/login';
  }
  return res;
}

// Ping the backend to wake up the Neon DB (which scales to zero)
export async function pingDatabase() {
  try {
    // /api/health now executes a SELECT 1 query to wake the DB
    await fetch(`${API_BASE}/health`); 
  } catch (e) {
    // Ignore errors for background ping
  }
}

// --- AUTH & USERS ---
export async function login(email: string, password: string) {
  const res = await apiFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function register(name: string, email: string, password: string) {
  const res = await apiFetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: JSON.stringify({ name, email, password })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getUsers(): Promise<User[]> {
  const res = await apiFetch(`${API_BASE}/users`, { headers: getAuthHeaders(false) });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function toggleSuspendUser(id: string, suspended: boolean): Promise<void> {
  const res = await apiFetch(`${API_BASE}/users/${id}/suspend`, {
    method: 'PUT',
    headers: getAuthHeaders(false),
    body: JSON.stringify({ suspended })
  });
  if (!res.ok) throw new Error('Failed to suspend/unsuspend user');
}

export async function deleteUser(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to delete user');
}

// --- SCANS ---
export async function analyzeImage(
  file: File,
  packWidthCm?: number,
  packHeightCm?: number,
  isMolded?: boolean
): Promise<Scan> {
  const formData = new FormData();
  formData.append("file", file);
  if (packWidthCm) formData.append("manual_pack_width_cm", String(packWidthCm));
  if (packHeightCm) formData.append("manual_pack_height_cm", String(packHeightCm));
  if (isMolded !== undefined) formData.append("is_molded", String(isMolded));

  const res = await apiFetch(`${API_BASE}/compliance/analyze-image`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(err.detail || `Analysis failed: ${res.status}`);
  }
  const raw = await res.json();
  const scan = normalizeApiScan(raw, file.name, file);
  await saveFile(scan.id, file);
  return scan;
}

export interface BatchItem {
  file: File;
  status: 'pending' | 'processing' | 'done' | 'failed';
  scan?: Scan;
  error?: string;
}

export async function analyzeBatch(
  files: File[],
  onProgress: (index: number, item: BatchItem) => void,
  packWidthCm?: number,
  packHeightCm?: number,
  isMolded?: boolean
): Promise<BatchItem[]> {
  const items: BatchItem[] = files.map(file => ({ file, status: 'pending' }));

  for (let i = 0; i < files.length; i++) {
    items[i].status = 'processing';
    onProgress(i, items[i]);
    try {
      const scan = await analyzeImage(files[i], packWidthCm, packHeightCm, isMolded);
      items[i].status = 'done';
      items[i].scan = scan;
    } catch (e) {
      items[i].status = 'failed';
      items[i].error = e instanceof Error ? e.message : 'Scan failed';
    }
    onProgress(i, items[i]);
  }

  return items;
}

export async function analyzeEcommerce(url: string): Promise<Scan> {
  const res = await apiFetch(`${API_BASE}/compliance/analyze-ecommerce`, {
    method: "POST",
    headers: getAuthHeaders(false),
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(err.detail || `Analysis failed: ${res.status}`);
  }
  const raw = await res.json();
  return normalizeApiScan(raw, url);
}

export async function generateReport(
  file: File,
  format: 'pdf' | 'docx' = 'pdf',
  packWidthCm?: number,
  packHeightCm?: number,
  isMolded?: boolean
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("format", format);
  if (packWidthCm) formData.append("manual_pack_width_cm", String(packWidthCm));
  if (packHeightCm) formData.append("manual_pack_height_cm", String(packHeightCm));
  if (isMolded !== undefined) formData.append("is_molded", String(isMolded));

  const res = await apiFetch(`${API_BASE}/compliance/generate-report`, { method: "POST", headers: getAuthHeaders(true), body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Report generation failed" }));
    const message = typeof err.detail === 'string' ? err.detail
      : Array.isArray(err.detail) ? err.detail.map((e: any) => e.msg || JSON.stringify(e)).join('; ')
      : `Report generation failed: ${res.status}`;
    throw new Error(message);
  }
  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function listScans(filters: ScanFilters = {}): Promise<Scan[]> {
  const res = await apiFetch(`${API_BASE}/scans`, { headers: getAuthHeaders(false) });
  if (!res.ok) throw new Error('Failed to load scans');
  const allScans: any[] = await res.json();
  
  // Fetch violations for all scans in parallel
  const scansWithViolations = await Promise.all(allScans.map(async (raw) => {
    try {
      const vRes = await apiFetch(`${API_BASE}/scans/${raw.id}/violations`, { headers: getAuthHeaders(false) });
      if (vRes.ok) {
        raw.violations = await vRes.json();
      } else {
        raw.violations = [];
      }
    } catch (e) {
      raw.violations = [];
    }
    return raw;
  }));

  let list: Scan[] = scansWithViolations.map(raw => normalizeApiScan(raw, "Product"));
  
  const query = filters.search?.toLowerCase().trim() ?? '';
  return list.filter(scan => 
    (!query || `${scan.id} ${scan.product_name} ${scan.manufacturer}`.toLowerCase().includes(query)) && 
    (!filters.status || filters.status === 'all' || scan.overall_status === filters.status) && 
    (!filters.type || filters.type === 'all' || scan.scan_type === filters.type)
  );
}

export async function getScanById(id: string): Promise<Scan | null> {
  const res = await apiFetch(`${API_BASE}/scans/${id}`, { headers: getAuthHeaders(false) });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch scan');
  }
  const raw = await res.json();
  
  // Fetch violations
  try {
    const vRes = await apiFetch(`${API_BASE}/scans/${id}/violations`, { headers: getAuthHeaders(false) });
    if (vRes.ok) {
      raw.violations = await vRes.json();
    }
  } catch (e) {}

  return normalizeApiScan(raw, "Product");
}

export async function resolveReview(scanId: string, fieldId: string, compliant: boolean) {
  const status = compliant ? 'approved' : 'rejected';
  const res = await apiFetch(`${API_BASE}/scans/${scanId}/review?status=${status}`, {
    method: 'PUT',
    headers: getAuthHeaders(false)
  });
  if (!res.ok) throw new Error('Failed to resolve review');
  return normalizeApiScan(await res.json(), "Product");
}

export async function getReviewItems(): Promise<{scan: Scan, field: string}[]> {
  const scans = await listScans({ status: 'review_required' });
  return scans
    .flatMap(scan => scan.not_detected_fields.map(field => ({ scan, field })))
    .sort((a, b) => new Date(b.scan.scan_date).getTime() - new Date(a.scan.scan_date).getTime());
}

// Normalize raw json from backend into Frontend Scan object
function normalizeApiScan(raw: any, sourceLabel: string, sourceFile?: File): Scan {
    const fields: Scan['fields'] = {};
    const rawFields = raw.rawJson?.fields || raw.fields || {};
    for (const [key, field] of Object.entries<any>(rawFields)) {
      let value = field.value;
    if (value && typeof value === 'object' && !Array.isArray(value) && 'amount' in value) {
      value = { ...value, amount: Number(value.amount) };
    }
    fields[key] = {
      status: field.status || 'compliant',
      rule_ref: field.rule_ref || 'Unknown',
      value,
      confidence: field.confidence ?? 0,
      bbox_height_mm: field.bbox_height_mm ?? undefined,
      reason: field.reason,
    };
  }

    // If backend returned a DB Scan entity, we might need to map DB fields:
    let status = raw.status || raw.overall_status || 'pending';
    
    if (raw.rawJson && raw.rawJson.overall_status) {
      status = raw.rawJson.overall_status;
    } else if (status === 'completed') {
      if (raw.violations && raw.violations.length > 0) {
        status = 'non_compliant';
      } else {
        status = 'compliant';
      }
    }

    if (raw.reviewStatus === 'approved') {
      status = 'compliant';
    } else if (raw.reviewStatus === 'rejected') {
      status = 'non_compliant';
    }

  // Also map the violations property
  const violations = raw.violations ? raw.violations.map((v: any) => ({
    rule_ref: v.ruleRef || v.rule_ref || 'Unknown Rule',
    severity: (v.severity || 'minor').toLowerCase(),
    description: v.description || ''
  })) : [];
  
  return {
    id: raw.id || `local-${Date.now()}`,
    scan_date: raw.scannedAt || raw.scanned_at || new Date().toISOString(),
    product_name: raw.product?.name || sourceLabel,
    manufacturer: 'Unknown Manufacturer',
    overall_status: status as any,
    compliance_score: raw.rawJson?.compliance_score ?? raw.compliance_score ?? 0,
    scan_type: raw.is_ecommerce ? 'ecommerce' : 'physical',
    message: raw.message || raw.rawJson?.message,
    is_molded: raw.is_molded || false,
    usp_context: raw.rawJson?.usp_context || raw.usp_context || { required: false, reason: '' },
    fields,
    violations,
    not_detected_fields: raw.rawJson?.not_detected_fields || raw.not_detected_fields || [],
    preprocessing: raw.rawJson?.preprocessing || raw.preprocessing || {
      pixels_per_cm: 0,
      pdp_area_cm2: raw.principalDisplayPanelAreaCm2 || 0,
      calibration_method: 'unknown',
      image_enhancement_applied: false,
      enhancement_method: 'none',
      original_resolution: '',
      enhanced_resolution: ''
    },
    review_status: raw.reviewStatus || 'pending',
    image_url: raw.imagePath || '',
    __sourceFile: sourceFile,
  };
}
