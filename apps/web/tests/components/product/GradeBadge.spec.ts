import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import GradeBadge from '~/components/product/GradeBadge.vue';

describe('GradeBadge', () => {
  describe('렌더링', () => {
    it('유효한 등급 키로 배지를 렌더링한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'S_PLUS' },
      });
      expect(wrapper.text()).toContain('S+');
    });

    it('NEW 등급을 "새제품" 텍스트로 렌더링한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'NEW' },
      });
      expect(wrapper.text()).toContain('새제품');
    });

    it('UNOPENED 등급을 "단순개봉"으로 렌더링한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'UNOPENED' },
      });
      expect(wrapper.text()).toContain('단순개봉');
    });

    it('A 등급을 "A"로 렌더링한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'A' },
      });
      expect(wrapper.text()).toContain('A');
    });

    it('B+ 등급을 "B+"로 렌더링한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'B_PLUS' },
      });
      expect(wrapper.text()).toContain('B+');
    });

    it('E 등급을 "E"로 렌더링한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'E' },
      });
      expect(wrapper.text()).toContain('E');
    });
  });

  describe('색상 클래스', () => {
    it('NEW 등급은 emerald 색상을 사용한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'NEW' },
      });
      expect(wrapper.html()).toContain('bg-emerald-100');
      expect(wrapper.html()).toContain('text-emerald-700');
    });

    it('S_PLUS 등급은 blue 색상을 사용한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'S_PLUS' },
      });
      expect(wrapper.html()).toContain('bg-blue-100');
      expect(wrapper.html()).toContain('text-blue-700');
    });

    it('S 등급은 sky 색상을 사용한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'S' },
      });
      expect(wrapper.html()).toContain('bg-sky-100');
      expect(wrapper.html()).toContain('text-sky-700');
    });

    it('C 등급은 yellow 색상을 사용한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'C' },
      });
      expect(wrapper.html()).toContain('bg-yellow-100');
      expect(wrapper.html()).toContain('text-yellow-700');
    });

    it('D 등급은 orange 색상을 사용한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'D' },
      });
      expect(wrapper.html()).toContain('bg-orange-100');
      expect(wrapper.html()).toContain('text-orange-700');
    });

    it('E 등급은 red 색상을 사용한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'E' },
      });
      expect(wrapper.html()).toContain('bg-red-100');
      expect(wrapper.html()).toContain('text-red-700');
    });
  });

  describe('사이즈', () => {
    it('기본 사이즈는 sm이다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'A' },
      });
      expect(wrapper.html()).toContain('text-xs');
      expect(wrapper.html()).toContain('px-1.5');
    });

    it('md 사이즈를 지정하면 더 큰 패딩과 폰트를 사용한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'A', size: 'md' },
      });
      expect(wrapper.html()).toContain('text-sm');
      expect(wrapper.html()).toContain('px-2.5');
    });
  });

  describe('linkable', () => {
    it('linkable이 false(기본)이면 span으로 렌더링한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'A' },
      });
      const badge = wrapper.find('.grade-badge');
      expect(badge.element.tagName.toLowerCase()).toBe('span');
    });

    it('linkable이 true이면 link로 렌더링한다', async () => {
      const wrapper = await mountSuspended(GradeBadge, {
        props: { grade: 'A', linkable: true },
      });
      const link = wrapper.find('a');
      expect(link.exists()).toBe(true);
      expect(link.attributes('href')).toBe('/grade-guide');
    });
  });

  describe('모든 등급 렌더링', () => {
    const allGrades = [
      'NEW', 'UNOPENED', 'S_PLUS', 'S', 'A', 'B_PLUS', 'B', 'C', 'D', 'E',
    ] as const;

    allGrades.forEach((grade) => {
      it(`${grade} 등급이 에러 없이 렌더링된다`, async () => {
        const wrapper = await mountSuspended(GradeBadge, {
          props: { grade },
        });
        expect(wrapper.find('.grade-badge').exists()).toBe(true);
      });
    });
  });
});
