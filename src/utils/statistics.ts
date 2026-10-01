/**
 * Tiện ích tính toán thống kê phương pháp nghiên cứu thực nghiệm
 * Đề tài: Tác động của Cam kết xanh đến hành vi quản lý chất thải tại nguồn
 */

import { BC08Record, StudyGroup } from '../types';

export interface DescriptiveStats {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
}

export interface GroupComparisonStats {
  tnStats: DescriptiveStats;
  dcStats: DescriptiveStats;
  differenceMeanDelta: number; // Mean ΔCWM TN - Mean ΔCWM ĐC
  tnImprovementRate: number; // Tỷ lệ hộ TN có ΔCWM > 0
  dcImprovementRate: number; // Tỷ lệ hộ ĐC có ΔCWM > 0
  tnNoChangeRate: number;
  dcNoChangeRate: number;
  tnDecreaseRate: number;
  dcDecreaseRate: number;
}

// Tính trung bình cộng
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / values.length).toFixed(2));
}

// Tính trung vị
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
  }
  return Number(sorted[mid].toFixed(2));
}

// Tính độ lệch chuẩn mẫu (Sample Standard Deviation)
export function calculateStandardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, curr) => acc + curr, 0) / (values.length - 1);
  return Number(Math.sqrt(variance).toFixed(2));
}

// Thống kê mô tả tổng hợp cho một mảng số liệu
export function getDescriptiveStats(values: number[]): DescriptiveStats {
  if (values.length === 0) {
    return { count: 0, mean: 0, median: 0, min: 0, max: 0, standardDeviation: 0 };
  }
  const mean = calculateMean(values);
  const median = calculateMedian(values);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const standardDeviation = calculateStandardDeviation(values);

  return {
    count: values.length,
    mean,
    median,
    min,
    max,
    standardDeviation,
  };
}

// So sánh nhóm can thiệp (TN) và nhóm đối chứng (ĐC) trên chỉ số ΔCWM
export function compareInterventionAndControl(bc08List: BC08Record[]): GroupComparisonStats {
  const tnDeltas: number[] = [];
  const dcDeltas: number[] = [];

  bc08List.forEach(item => {
    if (item.deltaCWM !== null && item.deltaCWM !== undefined) {
      if (item.group === 'TN') {
        tnDeltas.push(item.deltaCWM);
      } else if (item.group === 'DC') {
        dcDeltas.push(item.deltaCWM);
      }
    }
  });

  const tnStats = getDescriptiveStats(tnDeltas);
  const dcStats = getDescriptiveStats(dcDeltas);

  const diff = Number((tnStats.mean - dcStats.mean).toFixed(2));

  // Tỷ lệ cải thiện (>0), không đổi (=0), giảm (<0)
  const tnImproveCount = tnDeltas.filter(d => d > 0).length;
  const tnNoChangeCount = tnDeltas.filter(d => d === 0).length;
  const tnDecreaseCount = tnDeltas.filter(d => d < 0).length;

  const dcImproveCount = dcDeltas.filter(d => d > 0).length;
  const dcNoChangeCount = dcDeltas.filter(d => d === 0).length;
  const dcDecreaseCount = dcDeltas.filter(d => d < 0).length;

  const tnTotal = tnDeltas.length || 1;
  const dcTotal = dcDeltas.length || 1;

  return {
    tnStats,
    dcStats,
    differenceMeanDelta: diff,
    tnImprovementRate: Number(((tnImproveCount / tnTotal) * 100).toFixed(1)),
    dcImprovementRate: Number(((dcImproveCount / dcTotal) * 100).toFixed(1)),
    tnNoChangeRate: Number(((tnNoChangeCount / tnTotal) * 100).toFixed(1)),
    dcNoChangeRate: Number(((dcNoChangeCount / dcTotal) * 100).toFixed(1)),
    tnDecreaseRate: Number(((tnDecreaseCount / tnTotal) * 100).toFixed(1)),
    dcDecreaseRate: Number(((dcDecreaseCount / dcTotal) * 100).toFixed(1)),
  };
}
