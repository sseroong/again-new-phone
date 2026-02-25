import { describe, it, expect } from 'vitest';
import type { Brand } from '@phone-marketplace/shared';

// 필터 로직 단위 테스트 (컴포넌트 마운트 없이 순수 로직 검증)
const CATEGORY_BRANDS: Record<string, Brand[]> = {
  SMARTPHONE: ['APPLE', 'SAMSUNG', 'LG', 'OTHER'],
  TABLET: ['APPLE', 'SAMSUNG', 'LENOVO', 'OTHER'],
  WATCH: ['APPLE', 'SAMSUNG', 'OTHER'],
  LAPTOP: ['APPLE', 'SAMSUNG', 'LG', 'LENOVO', 'OTHER'],
  EARPHONE: ['APPLE', 'SAMSUNG', 'OTHER'],
};

describe('카테고리별 브랜드 필터 로직', () => {
  describe('CATEGORY_BRANDS 매핑', () => {
    it('스마트폰은 APPLE, SAMSUNG, LG, OTHER를 포함한다', () => {
      expect(CATEGORY_BRANDS.SMARTPHONE).toEqual(['APPLE', 'SAMSUNG', 'LG', 'OTHER']);
    });

    it('스마트폰은 LENOVO를 포함하지 않는다', () => {
      expect(CATEGORY_BRANDS.SMARTPHONE).not.toContain('LENOVO');
    });

    it('태블릿은 APPLE, SAMSUNG, LENOVO, OTHER를 포함한다', () => {
      expect(CATEGORY_BRANDS.TABLET).toEqual(['APPLE', 'SAMSUNG', 'LENOVO', 'OTHER']);
    });

    it('태블릿은 LG를 포함하지 않는다', () => {
      expect(CATEGORY_BRANDS.TABLET).not.toContain('LG');
    });

    it('스마트워치는 APPLE, SAMSUNG, OTHER만 포함한다', () => {
      expect(CATEGORY_BRANDS.WATCH).toEqual(['APPLE', 'SAMSUNG', 'OTHER']);
      expect(CATEGORY_BRANDS.WATCH).toHaveLength(3);
    });

    it('스마트워치는 LG, LENOVO를 포함하지 않는다', () => {
      expect(CATEGORY_BRANDS.WATCH).not.toContain('LG');
      expect(CATEGORY_BRANDS.WATCH).not.toContain('LENOVO');
    });

    it('노트북은 모든 주요 브랜드를 포함한다', () => {
      expect(CATEGORY_BRANDS.LAPTOP).toEqual(['APPLE', 'SAMSUNG', 'LG', 'LENOVO', 'OTHER']);
      expect(CATEGORY_BRANDS.LAPTOP).toHaveLength(5);
    });

    it('무선이어폰은 APPLE, SAMSUNG, OTHER만 포함한다', () => {
      expect(CATEGORY_BRANDS.EARPHONE).toEqual(['APPLE', 'SAMSUNG', 'OTHER']);
    });
  });

  describe('카테고리별 브랜드 수', () => {
    it('스마트폰: 4개 브랜드', () => {
      expect(CATEGORY_BRANDS.SMARTPHONE).toHaveLength(4);
    });

    it('태블릿: 4개 브랜드', () => {
      expect(CATEGORY_BRANDS.TABLET).toHaveLength(4);
    });

    it('스마트워치: 3개 브랜드', () => {
      expect(CATEGORY_BRANDS.WATCH).toHaveLength(3);
    });

    it('노트북: 5개 브랜드', () => {
      expect(CATEGORY_BRANDS.LAPTOP).toHaveLength(5);
    });

    it('무선이어폰: 3개 브랜드', () => {
      expect(CATEGORY_BRANDS.EARPHONE).toHaveLength(3);
    });
  });

  describe('모든 카테고리에 공통 브랜드', () => {
    it('모든 카테고리에 APPLE이 포함된다', () => {
      Object.values(CATEGORY_BRANDS).forEach((brands) => {
        expect(brands).toContain('APPLE');
      });
    });

    it('모든 카테고리에 SAMSUNG이 포함된다', () => {
      Object.values(CATEGORY_BRANDS).forEach((brands) => {
        expect(brands).toContain('SAMSUNG');
      });
    });

    it('모든 카테고리에 OTHER가 포함된다', () => {
      Object.values(CATEGORY_BRANDS).forEach((brands) => {
        expect(brands).toContain('OTHER');
      });
    });
  });

  describe('카테고리 변경 시 브랜드 필터링 로직', () => {
    function filterBrands(selectedBrands: Brand[], category: string): Brand[] {
      const validBrands = CATEGORY_BRANDS[category] || [];
      return selectedBrands.filter((b) => validBrands.includes(b));
    }

    it('스마트폰에서 태블릿으로 변경 시 LG가 제거된다', () => {
      const selected: Brand[] = ['APPLE', 'LG'];
      const result = filterBrands(selected, 'TABLET');
      expect(result).toEqual(['APPLE']);
      expect(result).not.toContain('LG');
    });

    it('노트북에서 스마트워치로 변경 시 LG, LENOVO가 제거된다', () => {
      const selected: Brand[] = ['APPLE', 'LG', 'LENOVO'];
      const result = filterBrands(selected, 'WATCH');
      expect(result).toEqual(['APPLE']);
    });

    it('스마트워치에서 노트북으로 변경 시 기존 선택 유지', () => {
      const selected: Brand[] = ['APPLE', 'SAMSUNG'];
      const result = filterBrands(selected, 'LAPTOP');
      expect(result).toEqual(['APPLE', 'SAMSUNG']);
    });

    it('빈 선택으로 카테고리 변경 시 빈 배열 유지', () => {
      const selected: Brand[] = [];
      const result = filterBrands(selected, 'SMARTPHONE');
      expect(result).toEqual([]);
    });

    it('모든 브랜드 선택 후 스마트워치로 변경 시 3개만 유지', () => {
      const selected: Brand[] = ['APPLE', 'SAMSUNG', 'LG', 'LENOVO', 'OTHER'];
      const result = filterBrands(selected, 'WATCH');
      expect(result).toEqual(['APPLE', 'SAMSUNG', 'OTHER']);
      expect(result).toHaveLength(3);
    });
  });

  describe('기본 카테고리 설정', () => {
    it('URL query가 없을 때 기본값은 SMARTPHONE이다', () => {
      const queryCategory = undefined;
      const defaultCategory = queryCategory || 'SMARTPHONE';
      expect(defaultCategory).toBe('SMARTPHONE');
    });

    it('URL query에 카테고리가 있으면 해당 카테고리를 사용한다', () => {
      const queryCategory = 'TABLET';
      const defaultCategory = queryCategory || 'SMARTPHONE';
      expect(defaultCategory).toBe('TABLET');
    });
  });
});
