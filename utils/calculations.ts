
import { REFERENCE_TABLE } from '../constants';
import { ReferenceRange } from '../types';

/**
 * Finds the closest base value in the reference table to the provided value.
 */
export const findClosestReference = (value: number): ReferenceRange => {
  return REFERENCE_TABLE.reduce((prev, curr) => {
    return Math.abs(curr.baseValue - value) < Math.abs(prev.baseValue - value) ? curr : prev;
  });
};

/**
 * Checks if a value falls within a specific range.
 */
export const isWithinRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Parses a numeric input string safely.
 */
export const parseInput = (val: string): number | '' => {
  if (val === '') return '';
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? '' : parsed;
};
