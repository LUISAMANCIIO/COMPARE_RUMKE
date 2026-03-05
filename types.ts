
export interface ReferenceRange {
  baseValue: number;
  min: number;
  max: number;
  rawLabel: string;
}

export interface AnalysisRow {
  id: string;
  parameter: string;
  analyst1: number | '';
  analyst2: number | '';
  difference: number;
  referenceRangeStr: string;
  isApproved: boolean | null;
}

export interface ComparisonResult {
  parameter: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  message: string;
}
