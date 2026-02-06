<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

useHead({
  title: '자주 묻는 질문',
});

type FaqItem = { question: string; answer: string };
type FaqCategory = { key: string; label: string; items: FaqItem[] };

const activeCategory = ref('buy');
const openItems = ref<Set<string>>(new Set());

const toggleItem = (id: string) => {
  if (openItems.value.has(id)) {
    openItems.value.delete(id);
  } else {
    openItems.value.add(id);
  }
};

const faqCategories: FaqCategory[] = [
  {
    key: 'buy',
    label: '구매',
    items: [
      {
        question: '중고폰 구매 시 보증은 어떻게 되나요?',
        answer: '모든 제품은 구매일로부터 30일간 무상 보증이 제공됩니다. 기기 불량이 발견될 경우 교환 또는 환불이 가능합니다. 단, 고객 과실로 인한 파손은 보증 대상에서 제외됩니다.',
      },
      {
        question: '등급은 어떤 기준으로 나뉘나요?',
        answer: 'S등급은 사용감이 거의 없는 최상급, A등급은 외관과 액정이 깨끗한 양호 상태, B등급은 약간의 사용감이 있는 보통 상태, C등급은 외관 흠집이나 액정 흠집이 있는 상태, D등급은 기능 불량이나 외관 파손이 있는 하급 상태입니다.',
      },
      {
        question: '배터리 효율은 어떻게 확인하나요?',
        answer: '모든 제품은 출고 전 배터리 효율을 측정하여 상품 상세 페이지에 표시합니다. iPhone의 경우 설정 > 배터리 > 배터리 성능 상태에서도 확인 가능합니다.',
      },
      {
        question: '구매 후 마음에 들지 않으면 반품이 가능한가요?',
        answer: '구매일로부터 7일 이내에 반품 신청이 가능합니다. 제품 수령 후 사용하지 않은 상태여야 하며, 단순 변심에 의한 반품 시 왕복 배송비가 발생합니다.',
      },
    ],
  },
  {
    key: 'sell',
    label: '판매',
    items: [
      {
        question: '판매 접수는 어떻게 하나요?',
        answer: '판매하기 페이지에서 기기 정보(모델, 용량, 색상)와 상태를 입력하면 예상 견적을 받을 수 있습니다. 견적에 동의하시면 택배 수거 또는 방문 수거를 선택하여 기기를 보내주시면 됩니다.',
      },
      {
        question: '판매 대금은 언제 지급되나요?',
        answer: '기기 수령 후 1~2 영업일 내에 검수를 진행합니다. 검수 완료 후 최종 가격이 확정되면 등록하신 계좌로 당일 입금됩니다.',
      },
      {
        question: '자가 등급 판정과 실제 등급이 다를 수 있나요?',
        answer: '네, 자가 등급은 참고용이며 실제 검수 결과에 따라 등급이 변경될 수 있습니다. 등급이 낮아지면 최종 가격이 조정될 수 있으며, 이 경우 판매 취소도 가능합니다.',
      },
      {
        question: '초기화하지 않고 보내도 되나요?',
        answer: '가능하지만, 개인정보 보호를 위해 발송 전 공장 초기화를 권장합니다. 초기화하지 않은 기기는 저희가 안전하게 초기화 처리합니다.',
      },
    ],
  },
  {
    key: 'payment',
    label: '결제',
    items: [
      {
        question: '어떤 결제 수단을 사용할 수 있나요?',
        answer: '신용카드, 체크카드, 계좌이체를 지원합니다. 토스페이먼츠를 통한 안전한 결제가 가능합니다.',
      },
      {
        question: '할부 결제가 가능한가요?',
        answer: '신용카드 결제 시 2~12개월 할부가 가능합니다. 무이자 할부 이벤트는 카드사별로 다르며, 결제 시 안내됩니다.',
      },
      {
        question: '결제 후 주문 취소가 가능한가요?',
        answer: '배송 전 주문 취소가 가능하며, 결제 금액은 카드사에 따라 3~7 영업일 내에 환불됩니다. 배송 중인 경우 상품 수령 후 반품 절차를 진행해주세요.',
      },
    ],
  },
  {
    key: 'shipping',
    label: '배송',
    items: [
      {
        question: '배송은 얼마나 걸리나요?',
        answer: '결제 완료 후 1~2 영업일 내에 출고되며, 출고 후 1~2일 내에 수령 가능합니다. 도서산간 지역은 추가 1~2일이 소요될 수 있습니다.',
      },
      {
        question: '배송비는 얼마인가요?',
        answer: '구매 시 배송비는 무료입니다. 판매 시 택배 수거도 무료이며, 반품 시에는 왕복 배송비(5,000원)가 발생합니다.',
      },
      {
        question: '배송 추적은 어떻게 하나요?',
        answer: '출고 후 문자 또는 알림으로 송장번호를 안내드립니다. 나의 거래내역 페이지에서도 배송 상태를 확인할 수 있습니다.',
      },
    ],
  },
  {
    key: 'refund',
    label: '반품/환불',
    items: [
      {
        question: '반품 절차는 어떻게 되나요?',
        answer: '나의 거래내역에서 반품 신청을 하시면, 무료 수거 택배가 방문합니다. 제품 수거 후 검수를 진행하고, 환불 처리합니다.',
      },
      {
        question: '환불은 얼마나 걸리나요?',
        answer: '제품 수거 후 검수 완료까지 1~2 영업일, 환불 처리 후 카드사에 따라 3~7 영업일이 소요됩니다. 계좌이체 결제의 경우 검수 완료 당일 환불됩니다.',
      },
      {
        question: '부분 환불이 가능한가요?',
        answer: '여러 상품을 한 번에 구매한 경우 개별 상품 단위로 반품 및 환불이 가능합니다.',
      },
      {
        question: '수령한 제품에 문제가 있을 경우 어떻게 하나요?',
        answer: '상품 상세 페이지에 기재된 내용과 다르거나 미고지 불량이 있는 경우, 수령일로부터 30일 이내에 무상 교환 또는 환불이 가능합니다. 고객센터로 연락해주세요.',
      },
    ],
  },
];

const currentFaqs = computed(() => {
  return faqCategories.find((c) => c.key === activeCategory.value)?.items || [];
});
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-2xl font-bold">자주 묻는 질문</h1>
        <nav class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <NuxtLink to="/" class="hover:text-gray-700">HOME</NuxtLink>
          <span>></span>
          <span class="text-gray-900">FAQ</span>
        </nav>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 카테고리 탭 -->
      <div class="flex gap-2 mb-8 overflow-x-auto pb-2">
        <button
          v-for="cat in faqCategories"
          :key="cat.key"
          class="px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
          :class="[
            activeCategory === cat.key
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          ]"
          @click="activeCategory = cat.key; openItems = new Set()"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- FAQ 아코디언 -->
      <div class="space-y-3">
        <div
          v-for="(faq, idx) in currentFaqs"
          :key="`${activeCategory}-${idx}`"
          class="bg-white rounded-xl overflow-hidden"
        >
          <button
            class="w-full px-6 py-4 flex items-center justify-between text-left"
            @click="toggleItem(`${activeCategory}-${idx}`)"
          >
            <div class="flex items-center gap-3">
              <span class="text-primary-600 font-bold text-sm">Q</span>
              <span class="font-medium">{{ faq.question }}</span>
            </div>
            <UIcon
              name="i-heroicons-chevron-down"
              class="w-5 h-5 text-gray-400 transition-transform flex-shrink-0"
              :class="{ 'rotate-180': openItems.has(`${activeCategory}-${idx}`) }"
            />
          </button>
          <div
            v-if="openItems.has(`${activeCategory}-${idx}`)"
            class="px-6 pb-4"
          >
            <div class="flex gap-3 pl-0">
              <span class="text-gray-400 font-bold text-sm">A</span>
              <p class="text-gray-600 text-sm leading-relaxed">{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 추가 문의 안내 -->
      <div class="mt-12 bg-white rounded-xl p-8 text-center">
        <UIcon name="i-heroicons-chat-bubble-left-right" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 class="font-bold text-lg mb-2">원하시는 답변을 찾지 못하셨나요?</h3>
        <p class="text-gray-500 text-sm mb-4">고객센터로 문의해주시면 빠르게 도움드리겠습니다.</p>
        <div class="flex items-center justify-center gap-4">
          <div class="text-center">
            <p class="text-sm text-gray-500">전화 문의</p>
            <p class="font-bold text-lg">1588-0000</p>
          </div>
          <div class="w-px h-10 bg-gray-200" />
          <div class="text-center">
            <p class="text-sm text-gray-500">운영 시간</p>
            <p class="font-bold text-lg">평일 09:00~18:00</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
