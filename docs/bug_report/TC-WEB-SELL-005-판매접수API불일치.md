# 버그 리포트: TC-WEB-SELL-005 - 판매 접수 API 필드 불일치

## 1. 발견 (e2e-tester)
- **테스트 ID**: TC-WEB-SELL-005
- **테스트명**: 판매 접수 - 거래 방법 선택 및 접수
- **발견일시**: 2026-02-27 05:04
- **결과**: FAIL
- **현상**: "판매 접수하기" 버튼 클릭 시 422 Validation Error 발생
- **에러 메시지**: `["property model should not exist", "property variant should not exist", "modelName must be a string", "storage must be a string", "deviceCondition must be an object"]`
- **기대결과**: `/sell/complete` 페이지로 이동

## 2. 분석 (analyzer)
- **관련 파일**:
  - `apps/web/pages/sell/index.vue:154-162` (프론트엔드 요청 바디)
  - `apps/api/src/sell-requests/dto/create-sell-request.dto.ts:37-75` (백엔드 DTO)
- **Root Cause**: 프론트엔드와 백엔드 DTO 필드명 불일치
  - 프론트: `model` → 백엔드 기대: `modelName`
  - 프론트: `variant` → 백엔드 기대: `storage`
  - 프론트: `deviceCondition` 미전송 → 백엔드: 필수 필드
- **영향 범위**: 판매 접수 기능 완전 불능 (모든 판매 접수가 실패)

## 3. 수정 (fixer)
- **수정 파일**: `apps/web/pages/sell/index.vue`
- **수정 내용**:
  - `model` → `modelName`으로 변경
  - `variant` → `storage`로 변경
  - `deviceCondition` 객체 추가 (SELL_GRADES에서 screenCondition/bodyCondition 자동 매핑)
- **수정 코드**:
```javascript
body: {
  category: selectedCategory.value,
  brand: selectedBrand.value,
  modelName: selectedModel.value,       // model → modelName
  storage: selectedVariant.value,        // variant → storage
  selfGrade: selectedGrade.value,
  tradeMethod: selectedTradeMethod.value,
  estimatedPrice: estimatedPrice.value,
  deviceCondition: {                     // 신규 추가
    powerOn: true,
    screenCondition: selectedGrade.value ? SELL_GRADES[selectedGrade.value].screenCondition : '',
    bodyCondition: selectedGrade.value ? SELL_GRADES[selectedGrade.value].bodyCondition : '',
    buttonsWorking: true,
  },
},
```

## 4. 검증 (재테스트)
- **재테스트일시**: 2026-02-27 05:04
- **결과**: PASS
- **비고**: 수정 후 스마트폰 > 애플 > 아이폰 15 Pro > 256GB > A등급 > 택배 거래 → `/sell/complete` 페이지 정상 이동. DB에 SellRequest 레코드 생성 확인 (status=PENDING, tradeMethod=COURIER)
