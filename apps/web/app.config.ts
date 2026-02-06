export default defineAppConfig({
  ui: {
    primary: 'blue',
    gray: 'slate',

    // 버튼 기본 스타일
    button: {
      default: {
        size: 'md',
        color: 'primary',
      },
    },

    // 입력 필드 기본 스타일
    input: {
      default: {
        size: 'md',
      },
    },

    // 카드 기본 스타일
    card: {
      rounded: 'rounded-xl',
      shadow: 'shadow-sm',
      ring: 'ring-1 ring-gray-200',
    },

    // 네비게이션 메뉴
    navigationMenu: {
      default: {
        size: 'md',
      },
    },
  },
});
