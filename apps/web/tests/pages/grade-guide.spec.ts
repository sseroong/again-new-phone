import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import GradeGuidePage from '~/pages/grade-guide.vue';

describe('등급 안내 페이지', () => {
  describe('페이지 구조', () => {
    it('페이지 타이틀이 "딱검수 등급 안내"를 포함한다', async () => {
      const wrapper = await mountSuspended(GradeGuidePage);
      expect(wrapper.text()).toContain('딱검수 등급 안내');
    });

    it('브레드크럼이 HOME 링크를 포함한다', async () => {
      const wrapper = await mountSuspended(GradeGuidePage);
      const homeLink = wrapper.find('a[href="/"]');
      expect(homeLink.exists()).toBe(true);
      expect(homeLink.text()).toContain('HOME');
    });
  });

  describe('검수 프로세스 섹션', () => {
    it('딱검수 프로세스 제목이 표시된다', async () => {
      const wrapper = await mountSuspended(GradeGuidePage);
      expect(wrapper.text()).toContain('딱검수 프로세스');
    });

    it('3단계 검수 프로세스가 표시된다', async () => {
      const wrapper = await mountSuspended(GradeGuidePage);
      expect(wrapper.text()).toContain('72시간 전문 검수');
      expect(wrapper.text()).toContain('등급 판정');
      expect(wrapper.text()).toContain('딱보증 부여');
    });

    it('검수 프로세스 설명이 표시된다', async () => {
      const wrapper = await mountSuspended(GradeGuidePage);
      expect(wrapper.text()).toContain('전문 검수사가 외관, 액정, 기능, 배터리를 꼼꼼히 검사합니다.');
      expect(wrapper.text()).toContain('검수 결과에 따라 10단계 등급을 부여합니다.');
      expect(wrapper.text()).toContain('등급에 맞는 품질보증과 실물인증을 부여합니다.');
    });
  });

  describe('등급표', () => {
    it('전체 등급 기준표 제목이 표시된다', async () => {
      const wrapper = await mountSuspended(GradeGuidePage);
      expect(wrapper.text()).toContain('전체 등급 기준표');
    });

    it('10개 등급이 모두 표시된다', async () => {
      const wrapper = await mountSuspended(GradeGuidePage);
      const text = wrapper.text();
      expect(text).toContain('새제품 등급');
      expect(text).toContain('단순개봉 등급');
      expect(text).toContain('S+ 등급');
      expect(text).toContain('S 등급');
      expect(text).toContain('A 등급');
      expect(text).toContain('B+ 등급');
      expect(text).toContain('B 등급');
      expect(text).toContain('C 등급');
      expect(text).toContain('D 등급');
      expect(text).toContain('E 등급');
    });

    it('등급별 검수 기준(외관, 액정, 배터리)이 표시된다', async () => {
      const wrapper = await mountSuspended(GradeGuidePage);
      const text = wrapper.text();
      // NEW 등급 기준
      expect(text).toContain('미개봉 완전 새제품');
      expect(text).toContain('100%');
      // S+ 등급 배터리 기준
      expect(text).toContain('95% 이상');
      // S 등급 배터리 기준
      expect(text).toContain('90% 이상');
      // A 등급 배터리 기준
      expect(text).toContain('85% 이상');
    });

    it('GradeBadge 컴포넌트가 등급표에 사용된다', async () => {
      const wrapper = await mountSuspended(GradeGuidePage);
      const badges = wrapper.findAll('.grade-badge');
      expect(badges.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('하단 CTA', () => {
    it('CTA 섹션이 표시된다', async () => {
      const wrapper = await mountSuspended(GradeGuidePage);
      expect(wrapper.text()).toContain('검수 완료 상품을 확인해보세요');
    });

    it('구매 페이지 링크 버튼이 존재한다', async () => {
      const wrapper = await mountSuspended(GradeGuidePage);
      const ctaLink = wrapper.find('a[href="/buy"]');
      expect(ctaLink.exists()).toBe(true);
      expect(ctaLink.text()).toContain('검수 완료 상품 둘러보기');
    });
  });
});
